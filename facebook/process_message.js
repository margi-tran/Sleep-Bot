/**
 * Module for processing messages recieved from the webhook.
 * Messages recieved from users are sent a reply.
 */


var request = require('request');
var MongoClient = require('mongodb').MongoClient;

var FBPlatform = require('node-messenger-platform')
var Bot = FBPlatform.Bot(process.env.FB_PAGE_ACCESS_TOKEN);

var fbMessengerBot = require('fb-messenger-bot-api');
var fbMessengerBotClient = new fbMessengerBot.Client(process.env.FB_PAGE_ACCESS_TOKEN);

module.exports = async (event) => {
    try { 
        fbUserId = event.sender.id;
        message = event.message.text;

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
            await fbMessengerBotClient.sendTextMessage(fbUserId, '2');
            await fbMessengerBotClient.sendTextMessage(fbUserId, '3');
            return;
        }

        if (message === '!multi') {
            await botClient.sendTextMessage(fbUserId, 'wow this works');
            await botClient.sendTextMessage(fbUserId, 'awesome');
        }

       await botClient.sendTextMessage(fbUserId, '[OK] Text received! Echoing: ' + message.substring(0, 200));

    } catch (err) {
        console.log('[ERROR]', err);
    }
};