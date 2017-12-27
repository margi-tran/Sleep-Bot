/**
 * Module for processing messages recieved from the webhook.
   Messages recieved from users are sent a reply.
 */


var request = require('request');
var MongoClient = require('mongodb').MongoClient;

module.exports = async (event) => {
    try { 
        fbUserId = event.sender.id;
        message = event.message.text;

        if (message === '!fitbit_id') {
            const db = await MongoClient.connect(process.env.MONGODB_URI);
            const testcollection = await db.collection('firstcol');
            var query = {};
            const res1 = await testcollection.find(query).toArray();
            console.log(res1);
            var val = res1[1];
            var username = val.first;
            sendMessage(fbUserId, JSON.stringify(val.first));
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


        //
        // db fields
        // fbUserId, fitbitId, accessToken, refreshToken
        const db = await MongoClient.connect(process.env.MONGODB_URI);
        /*const testcollection = db.collection('fitbitauths');
        var newUserObj = {
            fbUserId:
            fitbitId:
            accessToken:
            refreshToken:
        };
        const res1 = await testcollection.find(query).toArray();*/
        var myobj = { name: "Company Inc", address: "Highway 37" };
        db.collection("fitbitauths").insertOne(myobj);

    } catch (err) {
        console.log('ERROR: ', err);
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