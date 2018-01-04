/**
 * Module for processing postbacks recieved from the webhook.
 * Messages recieved from users are sent a reply.
 */


var request = require('request');
var MongoClient = require('mongodb').MongoClient;

var fbMessengerBot = require('fb-messenger-bot-api');
var fbMessengerBotClient = new fbMessengerBot.Client(process.env.FB_PAGE_ACCESS_TOKEN);
var MessengerBot = require('messenger-bot');
var messengerBotClient = new MessengerBot({token:process.env.FB_PAGE_ACCESS_TOKEN});

module.exports = async (event) => {
    try { 
        var fbUserId = event.sender.id;

        fbMessengerBotClient.sendTextMessage(fbUserId, '<postback received>');

        if(event.postback.payload === 'GET_STARTED_PAYLOAD') {
            // check whether the user exists in the database
            const db = await MongoClient.connect(process.env.MONGODB_URI);
            const result = await db.collection('users').find({ fbUserId_: fbUserId }).toArray();
            db.close();

            if(result.length == 0) { // user is not in database
                const db = await MongoClient.connect(process.env.MONGODB_URI);
                var newUser = { fbUserId_: fbUserId }
                await db.collection('users').insertOne(newUser);
                db.close();

                var m1 = 'Hello there, I am SleepBot! I am here to help you with any sleep disturbances you may have.';
                var m2 = ' I will need you to give me permission to access your health data on Fitbit, to help me analyze your sleep.'
                        + ' To do so click on the following link: https://calm-scrubland-31682.herokuapp.com/prepare_fitbit_auth?fbUserId='
                        + fbUserId;

                await fbMessengerBotClient.sendTextMessage(fbUserId, m1);
                await fbMessengerBotClient.sendTextMessage(fbUserId, m2);
            } else { // user is in database
                await fbMessengerBotClient.sendTextMessage(fbUserId, 'Welcome back! :)');
            }
            return;
        }

    } catch (err) {
        console.log('[ERROR]', err);
    }
};