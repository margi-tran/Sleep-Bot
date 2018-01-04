var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var cookieParser = require('cookie-parser');
var MongoClient = require('mongodb').MongoClient;
var path = require('path');

var fbMessengerBot = require('fb-messenger-bot-api');
var fbMessengerBotClient = new fbMessengerBot.Client(process.env.FB_PAGE_ACCESS_TOKEN);
var MessengerBot = require('messenger-bot');
var messengerBotClient = new MessengerBot({token:process.env.FB_PAGE_ACCESS_TOKEN});

var fbVerificationHandler = require('./route_handlers/facebook/verification_handler');
var fbWebhook = require('./route_handlers/facebook/webhook');
var fitbitWebhookGet = require('./route_handlers/fitbit/webhook_get');
var fitbitOAuthCallback = require('./route_handlers/fitbit/oauth_callback');
var fitbitRedirect = require('./route_handlers/fitbit/redirect');

var fitbitClient = require('./utility/fitbit_client');
var convertDate = require('./utility/convert_date');

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
app.post('/webhook/', fbWebhook);
app.get('/fitbit_webhook', fitbitWebhookGet);
app.get('/fitbit', fitbitRedirect);
app.get('/fitbit_oauth_callback', fitbitOAuthCallback);

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


// Test able to refresh token
app.get('/view', async (req, res) => {
 	try {
		var fitbitId = req.query.fitbitId;
		const db = await MongoClient.connect(process.env.MONGODB_URI);
    	const result = await db.collection('fitbit_auths').find({ fitbitId_: fitbitId }).toArray();
   
    	var oldAccessToken = result[0].accessToken;
    	var oldRefreshAccessToken = result[0].refreshAccessToken;

		refreshAccessTokenPromise = await fitbitClient.client.refreshAccessToken(oldAccessToken, oldRefreshAccessToken);
		var newAccessToken = refreshAccessTokenPromise.access_token;
		var newRefreshToken = refreshAccessTokenPromise.refresh_token;
		await db.collection('fitbit_auths').updateOne({fitbitId_: fitbitId}, 
								{ $set: { accessToken: newAccessToken, refreshAccessToken: newRefreshToken} });

		res.send(refreshAccessTokenPromise); 
	} catch (err) {
		res.send('[ERROR]' + err);
		console.log('[ERROR]', err);
	}
});

// Test if I can do anything with new token
app.get('/seedata', async (req, res) => {
	try {
		var fitbitId = req.query.fitbitId;
		const db = await MongoClient.connect(process.env.MONGODB_URI);
    	const result = await db.collection('fitbit_auths').find({ fitbitId_: fitbitId }).toArray();
   		var accessToken = result[0].accessToken;
    	const profile = await fitbitClient.client.get("/profile.json", accessToken, fitbitId);
    	res.send(profile);
	} catch (err) {
		res.send('hm: ' + err);
	}
});