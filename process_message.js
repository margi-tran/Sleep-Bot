/**
 * Module for processing messages recieved from the webhook.
   Messages recieved from users are sent a reply.
 */


var request = require('request');

const send = (userId, messageData)  => {
    return new Promise((resolve, reject) => {
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {access_token: process.env.FB_PAGE_ACCESS_TOKEN},
            method: 'POST',
            json: {
                recipient: {id: userId},
                message: {text: messageData}
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


module.exports = (event) => {
	userId = event.sender.id;
	message = event.message.text;

    /*send(sender, "Your userId: " + sender).then(
        send(sender, "[OK] Text received! echoing: " + message.substring(0, 200))).then(
        sendMessage(sender, "You entered '!'")
    );*/

    if(message === '!multiple') sendTextMessages(userId, [1, 2, 3], 0); 
};

function sendMessage(sender, text) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.FB_PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: sender},
            message: {text: text}
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
 * it was by Le Hoang Dieu
 */
function sendMultipleTextMessages(userId, messageArray, i) {
    if (i < text.length) 
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
            sendTextMessages(userId, messageArray, i+1);
        });
}

