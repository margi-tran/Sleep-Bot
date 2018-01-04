var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var cookieParser = require('cookie-parser');
var MongoClient = require('mongodb').MongoClient;
var path = require('path');

var fbVerificationHandler = require('./facebook/verification_handler');
var facebookWebhook = require('./facebook/facebook_webhook');
var convertDate = require('./utility/convert_date');

var fbMessengerBot = require('fb-messenger-bot-api');
var fbMessengerBotClient = new fbMessengerBot.Client(process.env.FB_PAGE_ACCESS_TOKEN);
var MessengerBot = require('messenger-bot');
var messengerBotClient = new MessengerBot({token:process.env.FB_PAGE_ACCESS_TOKEN});

var Fitbit = require('fitbit-node');
var client = new Fitbit(process.env.FITBIT_CLIENT_ID , process.env.FITBIT_CLIENT_SECRET);
var redirectUri = 'https://calm-scrubland-31682.herokuapp.com/fitbit_oauth_callback';
var scope = 'activity heartrate location nutrition profile settings sleep social weight';

var subscribeToFoods = require('./fitbit/subscribe_to_foods');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());

app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'), () => {
    console.log('Running on port', app.get('port'));
});

app.get('/', (req, res) => {
  	try {
  		res.send('Margi\'s project');
  	} catch (err) {
  		console.log('[ERROR]', err);
  	}
});

app.get('/', fbVerificationHandler);
app.post('/webhook/', facebookWebhook);

app.get('/fitbit', function(req, res) {
	res.redirect(client.getAuthorizeUrl(scope, redirectUri));
});


app.get('/fitbit_oauth_callback', async (req, res) => {
	try {
		fbUserId = req.cookies.fbUserId;

		// If this cookie is not set then this route is being accessed illegally
		if(fbUserId === undefined) {
			res.send('You may not proceed beyond this page. Please contact Margi for assistance.'
						+ '\n[ERROR] (/fitbit_oauth_callback) fbUserId is undefined.');
			return;
		} 

		// Check whether or not the user has already authenticated their Fitbit with the server
		const db = await MongoClient.connect(process.env.MONGODB_URI);
        const result = await db.collection('fitbit_auths').find({ fbUserId_: fbUserId }).toArray();   
        if(result != 0) {
        	res.send('You have already authenticated Fitbit with SleepBot.');
        	return;
        }

		const accessTokenPromise = await client.getAccessToken(req.query.code, redirectUri);
		const sleepData = await client.get('/sleep/date/' + convertDate(new Date()) + '.json', accessTokenPromise.access_token);
		console.log(sleepData);

        var newUser = { fbUserId_: fbUserId, 
                    fitbitId_: accessTokenPromise.user_id,
                    accessToken: accessTokenPromise.access_token,
                    refreshAccessToken: accessTokenPromise.refresh_token };
        await db.collection('fitbit_auths').insertOne(newUser);
        db.close();

        subscribeToFoods(client, accessTokenPromise.access_token);

        res.send(sleepData);
		//res.send("You have successfully authenticated your Fitbit with me. Please go back and talk to SleepBot, he is waiting for you.");
		fbMessengerBotClient.sendTextMessage(fbUserId, 'Great, you have given me permission to access to your health data on Fitbit.');
		//m1 = 'Great! You have given me permission to access your health data on Fitbit.';
		//m2 = 'First, I would like to get an idea about your current sleep health so I\' going to ask you a few questions.';
	} catch (err) {
		console.log(err);
		res.send('[ERROR]: ' + err);
	}
});

/*
 * On the user's first time chatting to the bot, they are directed to this route.
 * This allows the user's Facebook ID to be correctly linked their Fibit ID.
 */
app.get('/prepare_fitbit_auth', async (req, res) => {
	var fbUserId = req.query.fbUserId;
	// If this cookie is not set then this route is being accessed illegally
	if(fbUserId === undefined) {
		res.send('You may not proceed beyond this page. Please contact Margi for assistance.'
					+ '\n[ERROR] (/prepare_fitbit_auth) fbUserId is undefined.');
			return;
	}

	// Check whether or not the user has already authenticated their Fitbit with the server
	const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('fitbit_auths').find({ fbUserId_: fbUserId }).toArray();
	if(result != 0) {
        res.send('You have already authenticated Fitbit with SleepBot.');
        return;
    } 

	res.cookie('fbUserId', fbUserId);
	res.sendFile(path.join(__dirname + '/html_files/prepare_fitbit_auth.html'));
});

app.get('/fitbit_webhook', (req, res) => {
	if (req.query.verify != process.env.FITBIT_VERIFICATION_CODE) {
		console.log('Cannot verify Fitbit webhook.');
		res.sendStatus(404); 
	} 
    else {
    	console.log('Fitbit webhook verified.');
        res.sendStatus(204);         
    }
});

app.post('/fitbit_webhook', async (req, res) => {
	try {
		console.log(req.body);
		fitbitId = req.body[0].ownerId;
		date = req.body[0].date;
		console.log('daaaaaa', fitbitId, date);
	
		// refresh the access token so that the user's fitbit data can be accessed

    	res.sendStatus(204);
	} catch (err) {
		console.log('[ERROR]', err)
	}
});

// test able to refresh token
app.get('/view', async (req, res) => {
 	try {
		//fitbitId = '649QPD';
		var fitbitId = req.query.fitbitId;
		const db = await MongoClient.connect(process.env.MONGODB_URI);
    	const testcollection = await db.collection('fitbit_auths');
    	const result = await testcollection.find({ fitbitId_: fitbitId }).toArray();
   
    	var oldAccessToken = result[0].accessToken;
    	var oldRefreshAccessToken = result[0].refreshAccessToken;

		refreshAccessTokenPromise = await client.refreshAccessToken(oldAccessToken, oldRefreshAccessToken);
		var newAccessToken = refreshAccessTokenPromise.access_token;
		var newRefreshToken = refreshAccessTokenPromise.refresh_token;
		await db.collection('fitbit_auths').updateOne({fitbitId_: fitbitId}, 
								{ $set: { accessToken: newAccessToken, refreshAccessToken: newRefreshToken} });

		res.send(refreshAccessTokenPromise); //
	} catch (err) {
		res.send('[ERROR]' + err);
		console.log('[ERROR]', err);
	}
});

// test if i can do anythin with new token
app.get('/seedata', async (req, res) => {
	try {
		//fitbitId = '649QPD';
		var fitbitId = req.query.fitbitId;
		const db = await MongoClient.connect(process.env.MONGODB_URI);
    	const testcollection = await db.collection('fitbit_auths');
    	const result = await testcollection.find({ fitbitId_: fitbitId }).toArray();
   		var accessToken = result[0].accessToken;
    	const profile = await client.get("/profile.json", accessToken, fitbitId);
    	res.send(profile);
	} catch (err) {
		res.send('hm: ' + err);
	}
});