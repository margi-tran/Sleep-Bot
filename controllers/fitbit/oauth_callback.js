/**
 * Module for handling Fitbit OAuth2 callback after the user has given permissions 
 * for the server to access their Fitbit data.
 */


var fbMessengerBot = require('fb-messenger-bot-api');
var fbMessengerBotClient = new fbMessengerBot.Client(process.env.FB_PAGE_ACCESS_TOKEN);
var MessengerBot = require('messenger-bot');
var messengerBotClient = new MessengerBot({ token: process.env.FB_PAGE_ACCESS_TOKEN });

var user = require('../../models/user');
var fitbitAuth = require('../../models/fitbit_auth');
var userBackground = require('../../models/user_background');
var userSleepAnswers = require('../../models/user_sleep_answers');

var constants = require('../constants');
var fitbitClient = require('./fitbit_client');
var dateAndTimeUlti = require('../../utility/date_and_time_util');

module.exports = async (req, res) => {
	try {
		const fbUserId = req.cookies.fbUserId;

		// If the fbUserId cookie is not set then this route is being accessed illegally
		/*if(fbUserId === undefined) {
			res.send('An error occurred. Please contact admin for assistance.' 
						+ '\n[ERROR] (/oauth_callback) fbUserId is undefined. );
			return;
		}*/

		// Check whether or not the user has already authenticated Fitbit with the server
		//const db = await MongoClient.connect(process.env.MONGODB_URI);
        /*const result = await db.collection('fitbit_auths').find({ fbUserId_: fbUserId }).toArray();   
        if(result != 0) {
        	res.send('You have already authenticated Fitbit with SleepBot.');
        	return;
        }*/

		const accessTokenPromise = await fitbitClient.client.getAccessToken(req.query.code, fitbitClient.redirectUri);
		const sleepData = await fitbitClient.client.get('/sleep/date/' + dateAndTimeUlti.dateToString(new Date()) + '.json', accessTokenPromise.access_token);
		const profileData = await fitbitClient.client.get('/profile.json', accessTokenPromise.access_token);

        await fitbitAuth.addNewFitbitAuth(fbUserId, accessTokenPromise.user_id, accessTokenPromise.access_token, accessTokenPromise.refresh_token);
        await user.setMainContext(fbUserId, null);
        await userBackground.addNewUserBackground(fbUserId, profileData[0].user.age);
        await userSleepAnswers.addNewUser(fbUserId);

    	fitbitClient.client.post('/sleep/apiSubscriptions/1.json', accessTokenPromise.access_token).then((results) => {
       		console.log(results);
            console.log('subscribeToSleep:', results[0]);
    	}).catch((results) => {
        	console.log(results[0].errors);
    	});

        res.send('You have successfully authenticated Fitbit with SleepBot. Please go back and talk to SleepBot, he is waiting for you.');
		
		var m1 = 'Great, you have given me permission to access to your health data on Fitbit.';
		var m2 = 'Before we go any further, I would like to get an idea about your current sleep health,' 
					+ ' so I\'m going to ask you a few questions.';
		var m3 = 'Are you ready?';

        await user.setMainContext(fbUserId, constants.BACKGROUND_QUESTIONS);

		await fbMessengerBotClient.sendTextMessage(fbUserId, m1);
		await fbMessengerBotClient.sendTextMessage(fbUserId, m2); 
		fbMessengerBotClient.sendQuickReplyMessage(fbUserId, m3, constants.QUICK_REPLIES_YES_OR_NO);
	} catch (err) {
		console.log('[ERROR]', err);
		res.send('An error occurred. Please contact admin for assistance.' + '\n[ERROR] (/oauth_callback) ' + err);
	}
};