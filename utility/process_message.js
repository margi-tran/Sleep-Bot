/**
 * Module for processing messages recieved from the webhook. 
 * Messages recieved from users are sent a reply.
 */


var request = require('request');
var MongoClient = require('mongodb').MongoClient;

var fbMessengerBot = require('fb-messenger-bot-api');
var fbMessengerBotClient = new fbMessengerBot.Client(process.env.FB_PAGE_ACCESS_TOKEN);
var MessengerBot = require('messenger-bot');
var messengerBotClient = new MessengerBot({token:process.env.FB_PAGE_ACCESS_TOKEN});

var constants = require('./constants');

module.exports = async (event) => {
    try { 
        var fbUserId = event.sender.id;
        var message = event.message.text;

        await fbMessengerBotClient.markSeen(fbUserId);
        await messengerBotClient.sendSenderAction(fbUserId, 'typing_on');
        const db = await MongoClient.connect(process.env.MONGODB_URI);

        if (message === '!fitbitId') {
            const result = await db.collection('fitbit_auths').find({ fbUserId_: fbUserId }).toArray();
            await fbMessengerBotClient.sendTextMessage(fbUserId, result[0].fitbitId_);
            db.close();
            return;
        }
    
        if (message === '!fbUserId') {
            await fbMessengerBotClient.sendTextMessage(fbUserId, 'Your fb_id: ' + fbUserId);
            db.close();
            return;
        }

        if (message === '!numbers') {
            await fbMessengerBotClient.sendTextMessage(fbUserId, '1');
            await messengerBotClient.sendSenderAction(fbUserId, 'typing_on');
            await fbMessengerBotClient.sendTextMessage(fbUserId, '2');
            await messengerBotClient.sendSenderAction(fbUserId, 'typing_on');
            await fbMessengerBotClient.sendTextMessage(fbUserId, '3');
            db.close();
            return;
        }

        if (message === '!multi') {
            await fbMessengerBotClient.sendTextMessage(fbUserId, 'wow this works');
            await fbMessengerBotClient.sendTextMessage(fbUserId, 'awesome');
            db.close();
            return;
        }

        if (message === '!buttons') {
            var buttons = 
                [{
                    "type": "web_url",
                    "url": "https://www.messenger.com",
                    "title": "woo"
                }, 
                {
                    "type": "postback",
                    "title": "Postback",
                    "payload": "Payload for first element in a generic bubble",
                }];
            fbMessengerBotClient.sendButtonsMessage(fbUserId, 'You asked for buttons', buttons);
            db.close();
            return;
        } 

        const result = await db.collection('users').find({ fbUserId_: fbUserId }).toArray();
        botRequested = result[0].botRequested;

        // Check whether the bot asked anything from the user, if this is the case, 
        // then the bot is expecting a reply
        switch (botRequested) {
            case constants.FITBIT_AUTH:
                var msg1 = 'You haven\'t given me permission to access your Fitbit yet.'
                            + ' Please do that first before we proceed with anything else.';
                var msg2 = 'To do so click on the following link: https://calm-scrubland-31682.herokuapp.com/prepare_fitbit_auth?fbUserId='
                            + fbUserId;
                await fbMessengerBotClient.sendTextMessage(fbUserId, msg1);
                await fbMessengerBotClient.sendTextMessage(fbUserId, msg2);
                break;
            case constants.BACKGROUND_QUESTIONS:
                if (message.toLowerCase() === 'yes') {
                    await db.collection('users').updateOne({ fbUserId_: fbUserId }, 
                                { $set: { botRequested: constants.BACKGROUND_QUESTION_ONE } });
                    fbMessengerBotClient.sendTextMessage(fbUserId, '<great this is the first question>');
                } else {  
                    var msg = 'I need to have some background about your sleep.' 
                                + ' I only have a couple of questions, could you answer them first?';
                    fbMessengerBotClient.sendQuickReplyMessage(fbUserId, msg, constants.QUICK_REPLIES_YES_OR_NO);
                }
                break;
            case constants.BACKGROUND_QUESTION_ONE:
                fbMessengerBotClient.sendTextMessage(fbUserId, 'gotta answer q1 first');
                break;
            default:
                fbMessengerBotClient.sendTextMessage(fbUserId, '[ECHO] ' + message.substring(0, 200));
        }        
        db.close();
    } catch (err) {
        console.log('[ERROR]', err);
    }
};