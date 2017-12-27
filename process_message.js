/**
 * Module for processing messages recieved from the webhook.
   Messages recieved from users are sent a reply.
 */


var request = require('request');

var MongoClient = require('mongodb').MongoClient;

module.exports = async (event) => {
	userId = event.sender.id;
	message = event.message.text;


    //test

    const db = await MongoClient.connect("mongodb://admin_margi:pw_margi@ds139436.mlab.com:39436/honours_proj");
    const testcollection = db.collection('firstcol');
    var query = {};
    const res1 = await testcollection.find(query).toArray();
    console.log(res1);
    var val = res1[1];
    var v = JSON.stringify(val);
    console.log("STRING: " + val);
    console.log("STRING: " + v);
    console.log("USERNAME:" + v.first);
    sendMessage(userId, "ok");
    return;
    


    if(message === 'id') {
        sendMessage(userId, 'Your userId: ' + userId);
        return;
    }

    if(message === '!multiple') sendMultipleMessages(userId, [1, 2, 3], 0); 

    sendMessage(userId, "[OK] Text received! Echoing: " + message.substring(0, 200));
};

function sendMessage(userId, message) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.FB_PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: userId},
            message: {text: message}
        }
    }, function(error, response, body) {
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
function sendMultipleMessages(userId, messageArray, i) {
    if (i < messageArray.length) 
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {access_token:process.env.FB_PAGE_ACCESS_TOKEN},
            method: 'POST',
            json: {
                recipient: {id: userId},
                message: {text: messageArray[i]},
            }
        }, function(error, response, body) {
            if (error) {
                console.log('Error sending messages: ', error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error);
            }
            sendMultipleMessages(userId, messageArray, i+1);
        });
}

// NOT WORKING: MESSAGES ARENT SENT IN ORDER WITH PROMISES
function sendWithPromise(userId, message) {
    return new Promise((resolve, reject) => {
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {access_token: process.env.FB_PAGE_ACCESS_TOKEN},
            method: 'POST',
            json: {
                recipient: {id: userId},
                message: {text: message}
            }
        }, function(error, response, body) {
            if (error) {
                console.log('Error sending messages: ', error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error);
            }
            console.log('Message sent successfully to ' + userId); 
            return resolve(response);
        });
    });
}