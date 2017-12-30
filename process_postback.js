/**
 * Module for processing messages recieved from the webhook.
   Messages recieved from users are sent a reply.
 */


var request = require('request');
var MongoClient = require('mongodb').MongoClient;

module.exports = async (event) => {
    try { 
        fbUserId = event.sender.id;

        sendMessage(fbUserId, '<postback received>');

        if(event.postback.payload === 'GET_STARTED_PAYLOAD') {
            // check whether the user exists in the database
            const db = await MongoClient.connect(process.env.MONGODB_URI);
            query = { fbUserId_: fbUserId };
            result = await db.collection('fitbitauths').find(query).toArray();
            db.close();

            if(result.length == 0) { // user is not in database
                const db = await MongoClient.connect(process.env.MONGODB_URI);
                var newUser = { fbUserId_: fbUserId, 
                                fitbitId_: "",
                                accessToken: "",
                                refreshAccessToken: "" };
                await db.collection('fitbitauths').insertOne(newUser);
                db.close();

                m1 = 'Hello there, I am SleepBot! I am here to help you with any sleep disturbances you may have. '
                        + 'I can also give you advice about sleep health in general.';
                m2 = 'I will need you to give me permission to access your health data on Fitbit, to help me analyze your sleep. '
                        + 'To do so click on the following link: https://calm-scrubland-31682.herokuapp.com/prepare_fitbit_auth?fbUserId='
                        + fbUserId;
                sendMultipleMessages(fbUserId, [m1, m2], 0); 
            } else { // user is in database
                sendMessage(fbUserId, 'Welcome back!');
            }
            return;
        }

    } catch (err) {
        console.log('ERROR: (process_postback.js)', err);
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