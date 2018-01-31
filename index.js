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

var routeHandlers = require('./controllers/route_handlers');
var fitbitClient = require('./controllers/fitbit/fitbit_client');
var dateAndTimeUlti = require('./utility/date_and_time_util');
var sleepNotifier = require('./controllers/sleep/notifier');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());
app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'), () => {
    console.log('Running on port', app.get('port'));
});

app.get('/', routeHandlers.rootHandler);
app.get('/', routeHandlers.fbVerification);
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
    	const sleepData = await fitbitClient.client.get('/sleep/date/' + dateAndTimeUlti.dateToString(new Date()) + '.json', accessToken);
    	res.send(sleepData);
	} catch (err) {
		res.send('hm: ' + err);
	}
});


var user = require('./models/user');
app.get('/test', async (req, res) => {
	hm = await user.getAllUsersWithNotifiedSleepFalse();
	res.send(hm);
});

var sleep = require('./models/sleep'); // use
app.get('/sleep', async (req, res) => {
	date = dateAndTimeUlti.dateToString(new Date());
	hm = await sleep.getMainSleep('1509622955769729', date);
	res.send(hm);
});

var fbMessengerBot = require('fb-messenger-bot-api');
var fbMessengerBotClient = new fbMessengerBot.Client(process.env.FB_PAGE_ACCESS_TOKEN);
var MessengerBot = require('messenger-bot');
var messengerBotClient = new MessengerBot({ token:process.env.FB_PAGE_ACCESS_TOKEN });
var constants = require('./controllers/constants');

app.get('/notify', async (req, res) => {
	usersToNotify = await user.getAllUsersWithNotifiedSleepFalse();
	var numOfUsers = usersToNotify.length;

	for (var i = 0; i < usersToNotify; i++) {
		var userToNotify = usersToNotify[i];
		console.log(userToNotify);
		var mainSleep = sleep.getMainSleep(userToNotify);

		if (mainSleep === null) {
			console.log('no main sleep found');
			continue;
		}

		mainSleepLevels = mainSleep.length;
		for (var j = 0; j < mainSleepLevels; j++) {
			console.log(j);
		}

		await user.updateBotRequested(userToNotify, constants.NOTIFIED_SLEEP);
		var msg = 'Hey! I noticed a disturbance in your sleep last night. Can we have a little chat about that?';
        fbMessengerBotClient.sendQuickReplyMessage(userToNotify, msg, constants.QUICK_REPLIES_YES_OR_NO);
	}

    res.send('ok');
});




/*
app.get('/notify', async (req, res) => {
	usersToNotify = await user.getAllUsersWithNotifiedSleepFalse();
	await usersToNotify.forEach(async function(userToNotify) {
        await user.updateBotRequested(userToNotify, constants.NOTIFIED_SLEEP);

        mainSleep = sleep.getMainSleep(fbUserId);
        if (mainSleep === null) {
        	res.send('nop');
        	return; 
        }

        await mainSleep.forEach(function(data) {
        	console.log(data);
        });
        
        var msg = 'Hey! I noticed a disturbance in your sleep last night. Can we have a little chat about that?';
        fbMessengerBotClient.sendQuickReplyMessage(userToNotify, msg, constants.QUICK_REPLIES_YES_OR_NO);
    });
    res.send('ok');
});*/
