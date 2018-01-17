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

var constants = require('./constants');

module.exports = async (event) => {
    try { 
        const fbUserId = event.sender.id;

        await fbMessengerBotClient.markSeen(fbUserId);
        await messengerBotClient.sendSenderAction(fbUserId, 'typing_on');

        fbMessengerBotClient.sendTextMessage(fbUserId, '<postback received>');

        if (event.postback.payload === constants.GET_STARTED_PAYLOAD) {
            // check whether the user exists in the database
            const db = await MongoClient.connect(process.env.MONGODB_URI);
            const result = await db.collection('users').find({ fbUserId_: fbUserId }).toArray();

            if(result.length == 0) { // user is not in database
                var newUser = 
                    { 
                        fbUserId_: fbUserId, 
                        botRequested: constants.FITBIT_AUTH,
                        userIsNew: true
                    };
                await db.collection('users').insertOne(newUser);
            
                var msg1 = 'Hello there, I am SleepBot! I am here to help you with any sleep disturbances you may have.';
                var msg2 = 'Please give me permission to access your data on Fitbit, to help me analyze your sleep.'
                            + ' To do so click on the following link: https://calm-scrubland-31682.herokuapp.com/prepare_fitbit_auth?fbUserId='
                            + fbUserId;

                await fbMessengerBotClient.sendTextMessage(fbUserId, msg1);
                await fbMessengerBotClient.sendTextMessage(fbUserId, msg2);
            } else { // user is in database
                await fbMessengerBotClient.sendTextMessage(fbUserId, 'Welcome back! :)');
            }
            db.close();
            return;
        }
    } catch (err) {
        console.log('[ERROR]', err);
    }
};