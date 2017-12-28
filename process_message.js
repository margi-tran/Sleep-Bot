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

        // check whether the user exists in the database
        const db = await MongoClient.connect(process.env.MONGODB_URI);
        query = { fbUserId_: fbUserId };
        res = await db.collection('fitbitauths').find(query).toArray();
        console.log(res);


        if(res.length == 0) { // user is not in database
            console.log('res: ', res);
            console.log("RES WHAT HAPPENED", res.length);
            var newUser = { fbUserId_: fbUserId, 
                            fitbitId_: "raise",
                            accessToken: "kappa",
                            refreshAccessToken: "123" };
            await db.collection('fitbitauths').insertOne(newUser);
            db.close();
            sendMessage(fbUserId, 'You are not stored in the database. Adding you now!');
        }

        db.close(); 
              

        // example on to insert some documents
        /*
        const db = await MongoClient.connect(process.env.MONGODB_URI);
        var myobj = { name: "Company Inc", 
                      address: "lappen" };
        await db.collection("fitbitauths").insertOne(myobj);
        db.close();
        */

        // example on how to find some documents
        /*
        const db = await MongoClient.connect(process.env.MONGODB_URI);
        var addr = 'lappen';
        var query = { address: addr };
        res = await db.collection("fitbitauths").find(query).toArray();
        console.log(res);
        db.close();
        */

        if (message === '!fitbit_id') {
            const db = await MongoClient.connect(process.env.MONGODB_URI);
            const testcollection = await db.collection('firstcol');
            var query = {};
            const res = await testcollection.find(query).toArray();
            console.log(res);
            var val = res[1];
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