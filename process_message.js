/**
 * Module for processing messages recieved from the webhook.
   Messages recieved from users are sent a reply.
 */


var request = require('request');

/*
const send = (userId, messageData)  => {
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
};*/

const send = (userId, message_data)  => {
     console.log("IN HERE");
    return new Promise((resolve, reject) => {
       // request();   

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

    });
}


module.exports = (event) => {
	userId = event.sender.id;
	messageData = event.message.text;

   /* sendMessage(sender, "[OK] Text received, echo: " + message.substring(0, 200));

	if(message  === "!") {
		sendMessage(sender, "You entered '!'");
	}*/
send(userId, "[OK] Text received, echo: " + messageData.substring(0, 200));
    send(userId, "[OK] Text received, echo: " + messageData.substring(0, 200)).then(function(results) {
        console.log("GOT HERE WOW");
    }). catch(function (error) {
        console.log("ERROR");
    });
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

