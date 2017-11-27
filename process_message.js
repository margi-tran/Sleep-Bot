/**
 * Module for processing messages recieved from the webhook. 
   Messages sent from users are sent a reply.
 */
 
 
var request = require('request');

module.exports = (event) => {
	sender = event.sender.id;
	message = event.message.text;
	
    sendMessage(sender, "[ok] Text received, echo: " + message.substring(0, 200));
	
	if(message  === "!") {
		sendMessage(sender, "Going to print your data!");
	}
};

sendMessage = function(sender, text) {
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
};