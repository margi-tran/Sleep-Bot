var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var cookieParser = require('cookie-parser');
var MongoClient = require('mongodb').MongoClient;
var fbMessengerBot = require('fb-messenger-bot-api');
var fbMessengerBotClient = new fbMessengerBot.Client(process.env.FB_PAGE_ACCESS_TOKEN);
var MessengerBot = require('messenger-bot');
var messengerBotClient = new MessengerBot({ token:process.env.FB_PAGE_ACCESS_TOKEN });

var routeHandlers = require('./route_handlers/route_handlers');
var fitbitClient = require('./utility/fitbit_client');
var convertDate = require('./utility/convert_date');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());
app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'), () => {
    console.log('Running on port', app.get('port'));
});

app.get('/', routeHandlers.homeHandler);
app.get('/', routeHandlers.fbVerificationHandler);
app.post('/webhook/', routeHandlers.fbWebhook);
app.get('/fitbit_webhook', routeHandlers.fitbitWebhookGet);
app.post('/fitbit_webhook', routeHandlers.fitbitWebhookPost);
app.get('/prepare_fitbit_auth', routeHandlers.prepareFitbitAuth);
app.get('/fitbit', routeHandlers.fitbitRedirect);
app.get('/fitbit_oauth_callback', routeHandlers.fitbitOAuthCallback);



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
		await db.collection('fitbit_auths').updateOne({ fitbitId_: fitbitId }, 
								{ $set: { accessToken: newAccessToken, refreshAccessToken: newRefreshToken } });

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

app.get('/haha', async (req, res) => {
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