/**
 * Module for processing messages recieved from the webhook.
   Messages recieved from users are sent a reply.
 */


var request = require('request');

var send = require('./send_message.js');


module.exports = (event) => {
	sender = event.sender.id;
	message = event.message.text;

   /* sendMessage(sender, "[OK] Text received, echo: " + message.substring(0, 200));

	if(message  === "!") {
		sendMessage(sender, "You entered '!'");
	}*/

    send(sender, "[OK] Text received, echo: " + message.substring(0, 200)).then(function() {
        if(message == "!") send(sender, "You entered '!'");
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
