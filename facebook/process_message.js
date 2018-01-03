/**
 * Module for processing messages recieved from the webhook.
 * Messages recieved from users are sent a reply.
 */


var request = require('request');
var MongoClient = require('mongodb').MongoClient;

var messengerApis = require('./messenger_apis')

module.exports = async (event) => {
    try { 
        fbUserId = event.sender.id;
        message = event.message.text;

        await messengerApis.fbMessengerBotClient.markSeen(fbUserId);
        await messengerApis.messengerBotClient.sendSenderAction(fbUserId, 'typing_on');

        /*
        // check whether the user exists in the database
        const db = await MongoClient.connect(process.env.MONGODB_URI);
        query = { fbUserId_: fbUserId };
        result = await db.collection('fitbitauths').find(query).toArray();
        db.close();

        if(result.length == 0) { // user is not in database
            const db = await MongoClient.connect(process.env.MONGODB_URI);
            var newUser = { fbUserId_: fbUserId, 
                            fitbitId_: "raise",
                            accessToken: "kappa",
                            refreshAccessToken: "123" };
            await db.collection('fitbitauths').insertOne(newUser);
            db.close();
            sendTextMessage(fbUserId, 'You are not stored in the database. Adding you now!');

            // ask the user to authenticate with fitibit
            sendTextMessage(fbUserId, 'I will need you to authenticate with fitbit so that I can have access with your data to analyze.'
                                    + 'Do so this link: https://calm-scrubland-31682.herokuapp.com/fitbit');
            return;
        }
        */

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

       await messengerApisfbMessengerBotClient.sendTextMessage(fbUserId, '[OK] Text received! Echoing: ' + message.substring(0, 200));

    } catch (err) {
        console.log('[ERROR]', err);
    }
};