/**
 * Module for sending facebook messages to a user.
 */


var request = require('request');

/*
 * This function sends a single facebook message to a user.
 */
exports.sendTextMessage = (fbUserId, message) => {
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
            console.log('[ERROR] ', error);
        } else if (response.body.error) {
            console.log('[ERROR] ', response.body.error);
        }
    });
}

/*
 * This function was adapted from from https://developers.facebook.com/bugs/565416400306038
 * and it was by Le Hoang Dieu. This function allows multiple facebook messages
 * to be sent in order to a user.
 */
exports.sendMultipleTextMessages = (fbUserId, messageArray, i) => {
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
            sendMultipleTextMessages(fbUserId, messageArray, i+1);
        });
}