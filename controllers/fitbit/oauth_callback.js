/**
 * Module for handling Fitbit OAuth2 callback after the user has given permissions 
 * for the server to access their Fitbit data.
 */


var MongoClient = require('mongodb').MongoClient;

var fbMessengerBot = require('fb-messenger-bot-api');
var fbMessengerBotClient = new fbMessengerBot.Client(process.env.FB_PAGE_ACCESS_TOKEN);
var MessengerBot = require('messenger-bot');
var messengerBotClient = new MessengerBot({ token:process.env.FB_PAGE_ACCESS_TOKEN });

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
		const db = await MongoClient.connect(process.env.MONGODB_URI);
        /*const result = await db.collection('fitbit_auths').find({ fbUserId_: fbUserId }).toArray();   
        if(result != 0) {
        	res.send('You have already authenticated Fitbit with SleepBot.');
        	return;
        }*/

		const accessTokenPromise = await fitbitClient.client.getAccessToken(req.query.code, fitbitClient.redirectUri);
		const sleepData = await fitbitClient.client.get('/sleep/date/' + dateAndTimeUlti.dateToString(new Date()) + '.json', accessTokenPromise.access_token);
		const profileData = await fitbitClient.client.get('/profile.json', accessTokenPromise.access_token);

        var newUser = 
            { 
                fbUserId_: fbUserId, 
                fitbitId_: accessTokenPromise.user_id,
                accessToken: accessTokenPromise.access_token,
                refreshAccessToken: accessTokenPromise.refresh_token 
            };
        await db.collection('fitbit_auths').insertOne(newUser);
        await db.collection('users').updateOne( { fbUserId_: fbUserId }, { $set: { botRequested: null } } );

    	fitbitClient.client.post('/sleep/apiSubscriptions/1.json', accessTokenPromise.access_token).then((results) => {
       		console.log(results);
            console.log('subscribeToSleep:', results[0]);
    	}).catch((results) => {
        	console.log(results[0].errors);
    	});

        var background = 
            { 
                fbUserId_: fbUserId, 
                age: profileData[0].user.age,
                get_up: null,
                go_to_bed: null,
                electronics: null,
                stressed: null,
                eat: null,
                alcohol_nicotine: null,
                caffeine: null,
                lights: null,
                noise: null,
                excercise: null,
                job: null,
                work_schedule: null
            };
        await db.collection('background').insertOne(background);

        res.send("You have successfully authenticated Fitbit with me. Please go back and talk to SleepBot, he is waiting for you.");
		
		var m1 = 'Great, you have given me permission to access to your health data on Fitbit.';
		var m2 = 'Before we go any further, I would like to get an idea about your current sleep health,' 
					+ ' so I\'m going to ask you a few questions.';
		var m3 = 'Are you ready to start answering my questions?';
		var quickReplies = 
			[{
            	"content_type":"text",
                "title":"yes",
                "payload":"yes"
            },
            {
            	"content_type":"text",
            	"title":"no",
            	"payload":"no"
            }];

        await db.collection('users').updateOne( { fbUserId_: fbUserId }, { $set: { botRequested: constants.BACKGROUND_QUESTIONS } } );
        db.close();
		await fbMessengerBotClient.sendTextMessage(fbUserId, m1);
		await fbMessengerBotClient.sendTextMessage(fbUserId, m2); 
		await fbMessengerBotClient.sendQuickReplyMessage(fbUserId, m3, quickReplies);
	} catch (err) {
		console.log('[ERROR]', err);
		res.send('An error occurred. Please contact admin for assistance.' + '\n[ERROR] (/oauth_callback) ' + err);
	}
};