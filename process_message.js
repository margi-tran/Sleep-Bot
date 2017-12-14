/**
 * Module for processing messages recieved from the webhook.
   Messages recieved from users are sent a reply.
 */


var request = require('request');


const send2 = (userId, messageData)  => {
     console.log("IN HERE");
    return new Promise((resolve, reject) => {
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {access_token: process.env.FB_PAGE_ACCESS_TOKEN},
            method: "POST",
            json: {
                 recipient: {id: userId },
                message: {text: text}
            }
        }, (error, response, body) => {
                if (error) { 
                    console.log("Error sending message: " + response.error); return reject(response.error); 
                }
                else if (response.body.error) { 
                    console.log('Response body Error: ' + response.body.error); return reject(response.body.error); 
                }

                console.log("Message sent successfully to " + userId); 
                return resolve(response);
            }
        );    
    });
};

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
	sender = event.sender.id;
	message = event.message.text;

    /*send(sender, "Your userId: " + sender);
    send(sender, "[OK] Text received! echoing: " + message.substring(0, 200)).then(function(results) {
         sendMessage(sender, "You entered '!'");
    }).catch(function (error) {
        console.log('Error: ', error);
    });*/

    send(sender, "Your userId: " + sender).then(
        send(sender, "[OK] Text received! echoing: " + message.substring(0, 200))).then(
        sendMessage(sender, "You entered '!'")
        );


    /*send(sender, "[OK] Text received! echoing: " + message.substring(0, 200)).then(function(results) {
         sendMessage(sender, "You entered '!'");
    }).catch(function (error) {
        console.log('Error: ', error);
    });*/
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

