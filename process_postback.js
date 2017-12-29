/**
 * Module for processing messages recieved from the webhook.
   Messages recieved from users are sent a reply.
 */


var request = require('request');
var MongoClient = require('mongodb').MongoClient;

module.exports = async (event) => {
    try { 
        fbUserId = event.sender.id;
        //message = event.message.text;

        sendMessage(fbUserId, 'postback');

        if(event.postback.payload === 'GET_STARTED_PAYLOAD') {
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
                
                m1 = 'I will need you to give me permission to access your data on Fitbit, so that I can analyze your sleep based on it.';
                m2 = 'To do so click on the following link:';
                m3 = 'https://calm-scrubland-31682.herokuapp.com/fitbit'
                sendMultipleMessages(fbUserId, [m1, m2, m3], 0); 
            } else { // user is in database
                sendMessage(fbUserId, 'Welcome back!');
            }
            return;
        }

    } catch (err) {
        console.log('postback ERROR: ', err);
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
            console.log('Error sending messages: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
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