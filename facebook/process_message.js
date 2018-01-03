/**
 * Module for processing messages recieved from the webhook.
 * Messages recieved from users are sent a reply.
 */


var request = require('request');
var MongoClient = require('mongodb').MongoClient;

var messengerApis = require('./messenger_apis');

var test = require('./test');

module.exports = async (event) => {
    try { 
        fbUserId = event.sender.id;
        message = event.message.text;

        await messengerApis.fbMessengerBotClient.markSeen(fbUserId);
        await messengerApis.messengerBotClient.sendSenderAction(fbUserId, 'typing_on');

        if (message === '!fitbit_id') {
            const db = await MongoClient.connect(process.env.MONGODB_URI);
            const testcollection = await db.collection('firstcol');
            var query = {};
            const result = await testcollection.find(query).toArray();
            //console.log(result);
            var val = result[1];
            var username = val.first;
            await messengerApis.fbMessengerBotClient.sendTextMessage(fbUserId, val.first);
            db.close();
            return;
        }
    
        if (message === '!fb_id') {
            await messengerApis.fbMessengerBotClient.sendTextMessage(fbUserId, 'Your fb_id: ' + fbUserId);
            return;
        }

        if (message === '!numbers') {
            await messengerApis.fbMessengerBotClient.sendTextMessage(fbUserId, '1');
            await messengerApis.messengerBotClient.sendSenderAction(fbUserId, 'typing_on');
            await messengerApis.fbMessengerBotClient.sendTextMessage(fbUserId, '2');
            await messengerApis.messengerBotClient.sendSenderAction(fbUserId, 'typing_on');
            await messengerApis.fbMessengerBotClient.sendTextMessage(fbUserId, '3');
            return;
        }

        if (message === '!multi') {
            await messengerApis.fbMessengerBotClient.sendTextMessage(fbUserId, 'wow this works');
            await messengerApis.fbMessengerBotClient.sendTextMessage(fbUserId, 'awesome');
        }

        if (message = 'kappa') {
            await test.sendTextMessage(fbUserId, 'leeel');
            await test.sendTextMessage(fbUserId, 'leeel 2');
        }

       await messengerApis.fbMessengerBotClient.sendTextMessage(fbUserId, '[OK] Text received! Echoing: ' + message.substring(0, 200));

    } catch (err) {
        console.log('[ERROR]', err);
    }
};