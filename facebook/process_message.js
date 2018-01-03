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
        fbUserId = event.sender.id;
        message = event.message.text;

        await fbMessengerBotClient.markSeen(fbUserId);
        await messengerBotClient.sendSenderAction(fbUserId, 'typing_on');

        if (message === '!fitbit_id') {
            const db = await MongoClient.connect(process.env.MONGODB_URI);
            const testcollection = await db.collection('firstcol');
            var query = {};
            const result = await testcollection.find(query).toArray();
            //console.log(result);
            var val = result[1];
            var username = val.first;
            await fbMessengerBotClient.sendTextMessage(fbUserId, val.first);
            db.close();
            return;
        }
    
        if (message === '!fb_id') {
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

       await fbMessengerBotClient.sendTextMessage(fbUserId, '[OK] Text received! Echoing: ' + message.substring(0, 200));

    } catch (err) {
        console.log('[ERROR]', err);
    }
};