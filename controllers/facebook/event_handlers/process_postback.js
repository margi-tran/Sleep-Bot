/**
 * Module for processing postbacks recieved from the webhook.
 * Messages recieved from users are sent a reply.
 */


var request = require('request');
var fbMessengerBot = require('fb-messenger-bot-api');
var fbMessengerBotClient = new fbMessengerBot.Client(process.env.FB_PAGE_ACCESS_TOKEN);
var MessengerBot = require('messenger-bot');
var messengerBotClient = new MessengerBot({ token: process.env.FB_PAGE_ACCESS_TOKEN });

var user = require('../../../models/user');

var constants = require('../../constants');

module.exports = async (event) => {
    try { 
        console.log(event);
        const fbUserId = event.sender.id;

        await fbMessengerBotClient.markSeen(fbUserId);
        await messengerBotClient.sendSenderAction(fbUserId, 'typing_on');

        if (event.postback.payload === constants.GET_STARTED_PAYLOAD) {
            var isAUser = await user.isAUser(fbUserId);
            if (!isAUser) { // user is not in database
                user.addUser(fbUserId);
                var msg1 = 'Hello there. I am SleepBot! I am here to help you with any sleep disturbances you may have.';
                var msg2 = 'Please give me permission to access your data on Fitbit, to help me analyze your sleep.'
                                + ' To do so click on the following link: https://calm-scrubland-31682.herokuapp.com/prepare_fitbit_auth?fbUserId='
                                + fbUserId;
                await fbMessengerBotClient.sendTextMessage(fbUserId, msg1);
                fbMessengerBotClient.sendTextMessage(fbUserId, msg2);
            } else { // user is in database
                await fbMessengerBotClient.sendTextMessage(fbUserId, 'Welcome back! :)');
            }
            return;
        }

        if (event.postback.payload === 'FACTOR alcohol 1') {
            fbMessengerBotClient.sendTextMessage(fbUserId, 'woah');
        }

    } catch (err) {
        console.log('[ERROR]', err);
    }
};