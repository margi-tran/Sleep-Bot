/**
 * Module for processing messages recieved from the webhook. 
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
        var message = event.message.text;

        await fbMessengerBotClient.markSeen(fbUserId);
        await messengerBotClient.sendSenderAction(fbUserId, 'typing_on');

        if (message === '!fitbitId') {
            const db = await MongoClient.connect(process.env.MONGODB_URI);
            const result = await db.collection('fitbit_auths').find({ fbUserId_: fbUserId }).toArray();
            await fbMessengerBotClient.sendTextMessage(fbUserId, result[0].fitbitId_);
            db.close();
            return;
        }
    
        if (message === '!fbUserId') {
            await fbMessengerBotClient.sendTextMessage(fbUserId, 'Your fb_id: ' + fbUserId);
            return;
        }

        if (message === '!numbers') {
            await fbMessengerBotClient.sendTextMessage(fbUserId, '1');
            await messengerBotClient.sendSenderAction(fbUserId, 'typing_on');
            await fbMessengerBotClient.sendTextMessage(fbUserId, '2');
            await messengerBotClient.sendSenderAction(fbUserId, 'typing_on');
            await fbMessengerBotClient.sendTextMessage(fbUserId, '3');
            return;
        }

        if (message === '!multi') {
            await fbMessengerBotClient.sendTextMessage(fbUserId, 'wow this works');
            await fbMessengerBotClient.sendTextMessage(fbUserId, 'awesome');
        }


        const db = await MongoClient.connect(process.env.MONGODB_URI);
        const result = await db.collection('users').find({ fbUserId_: fbUserId }).toArray();
        console.log(result);
        botRequested = result[0].botRequested;

        switch(botRequested) {
            case constants.FITBIT_AUTH:
                var m1 = 'You haven\'t given me permission to access your Fitbit yet.'
                            + ' Please do that first before we proceed with anything else.';
                var m2 = 'To do so click on the following link: https://calm-scrubland-31682.herokuapp.com/prepare_fitbit_auth?fbUserId='
                            + fbUserId;
                await fbMessengerBotClient.sendTextMessage(fbUserId, m1);
                await fbMessengerBotClient.sendTextMessage(fbUserId, m2);
            default:
                await fbMessengerBotClient.sendTextMessage(fbUserId, '[ECHO] ' + message.substring(0, 200));
        }        

    } catch (err) {
        console.log('[ERROR]', err);
    }
};