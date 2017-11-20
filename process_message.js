/**
 * This module processes messages sent by a user, then sends a relevant reply.
 */
 
 
var request = require('request')

module.exports = (sender, text) => {
    sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200));
};

sendTextMessage = function(sender, text) {
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