/**
 * Module for processing messages recieved from the webhook.
   Messages recieved from users are sent a reply.
 */


var request = require('request');
var MongoClient = require('mongodb').MongoClient;

module.exports = async (event, req) => {
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
            sendMessage(fbUserId, 'You are not stored in the database. Adding you now!');

            // ask the user to authenticate with fitibit
            sendMessage(fbUserId, 'I will need you to authenticate with fitbit so that I can have access with your data to analyze.'
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
            sendMessage(fbUserId, val.first);
            db.close();
            return;
        }
    
        if (message === '!fb_id') {
            sendMessage(fbUserId, 'Your fb_id: ' + fbUserId);
            return;
        }

        if (message === '!multiple') 
            sendMultipleMessages(fbUserId, [1, 2, 3], 0); 

        sendMessage(fbUserId, '[OK] Text received! Echoing: ' + message.substring(0, 200));

    } catch (err) {
        console.log('[ERROR] (process_message.js) ', err);
    }
};

function sendMessage(fbUserId, message) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.FB_PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: fbUserId},
            message: {text: message}
        }
    }, (error, response, body) => {
        if (error) {
            console.log('[ERROR] (sendMessage) ', error);
        } else if (response.body.error) {
            console.log('[ERROR] (sendMessage) ', response.body.error);
        }
    });
}


/*
 * Taken from https://developers.facebook.com/bugs/565416400306038
 * it was by Le Hoang Dieu.
 * Seems to be only work around for sendin multiple messages in order
 */
function sendMultipleMessages(fbUserId, messageArray, i) {
    if (i < messageArray.length) 
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {access_token:process.env.FB_PAGE_ACCESS_TOKEN},
            method: 'POST',
            json: {
                recipient: {id: fbUserId},
                message: {text: messageArray[i]},
            }
        }, function (error, response, body) {
            if (error) {
                console.log('Error sending messages: ', error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error);
            }
            sendMultipleMessages(fbUserId, messageArray, i+1);
        });
}