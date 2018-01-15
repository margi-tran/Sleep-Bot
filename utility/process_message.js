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
        userIsNew = result[0].userIsNew;

        if (userIsNew) {
            getUserBackground(botRequested);
            return;
        }

        fbMessengerBotClient.sendTextMessage(fbUserId, 'not new');

        // Check whether the bot asked anything from the user, if this is the case, 
        // then the bot is expecting a reply
             
        db.close();
    } catch (err) {
        console.log('[ERROR]', err);
    }
};

async function getUserBackground(botRequested) {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
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
                    await db.collection('users').updateOne({ fbUserId_: fbUserId }, { $set: { botRequested: constants.BACKGROUND_GET_UP } });
                    fbMessengerBotClient.sendTextMessage(fbUserId, constants.BACKGROUND_GET_UP_TEXT);
                } else {  
                    var msg = 'I need to have some background about your sleep. I only have a couple of questions, could you answer them first?';
                    fbMessengerBotClient.sendQuickReplyMessage(fbUserId, msg, constants.QUICK_REPLIES_YES_OR_NO);
                }
                break;
            case constants.BACKGROUND_GET_UP:
                // need to check its a valid time!!

                //store user answer
                await db.collection('background').updateOne({ fbUserId_: fbUserId }, { $set: { get_up: message } });
                
                // ask next question
                await db.collection('users').updateOne({ fbUserId_: fbUserId }, { $set: { botRequested: constants.BACKGROUND_GO_TO_BED } });
                fbMessengerBotClient.sendTextMessage(fbUserId, constants.BACKGROUND_GO_TO_BED_TEXT);

                // other reply ask question 1 again
                //fbMessengerBotClient.sendTextMessage(fbUserId, 'gotta answer q1 first');
                break;
            case constants.BACKGROUND_GO_TO_BED:
                // need to check its a valid time!!

                //store user answer
                await db.collection('background').updateOne({ fbUserId_: fbUserId }, { $set: { go_to_bed: message } });
                
                // ask next question
                await db.collection('users').updateOne({ fbUserId_: fbUserId }, { $set: { botRequested: constants.BACKGROUND_ELECTRONICS } });
                await fbMessengerBotClient.sendQuickReplyMessage(fbUserId, constants.BACKGROUND_ELECTRONICS_TEXT, constants.QUICK_REPLIES_YES_OR_NO);
                // other reply ask question  again
                //fbMessengerBotClient.sendTextMessage(fbUserId, 'gotta answer q1 first');
                break;
            case constants.BACKGROUND_ELECTRONICS:
                if (message.toLowerCase() === 'yes' || message.toLowerCase() === 'no') {
                    await db.collection('background').updateOne({ fbUserId_: fbUserId }, { $set: { electronics: message.toLowerCase() } });
                    await db.collection('users').updateOne({ fbUserId_: fbUserId }, { $set: { botRequested: constants.BACKGROUND_STRESSED } });
                    await fbMessengerBotClient.sendQuickReplyMessage(fbUserId, constants.BACKGROUND_STRESSED_TEXT, constants.QUICK_REPLIES_YES_OR_NO);
                } else {  
                    await fbMessengerBotClient.sendTextMessage(fbUserId, 'Please answer my question.');
                    await fbMessengerBotClient.sendQuickReplyMessage(fbUserId, constants.BACKGROUND_ELECTRONICS_TEXT, constants.QUICK_REPLIES_YES_OR_NO);
                }
                break;
            case constants.BACKGROUND_STRESSED:
                if (message.toLowerCase() === 'yes' || message.toLowerCase() === 'no') {
                    await db.collection('background').updateOne({ fbUserId_: fbUserId }, { $set: { stressed: message.toLowerCase() } });
                    await db.collection('users').updateOne({ fbUserId_: fbUserId }, { $set: { botRequested: constants.BACKGROUND_EAT } });
                    await fbMessengerBotClient.sendQuickReplyMessage(fbUserId, constants.BACKGROUND_EAT_TEXT, constants.QUICK_REPLIES_YES_OR_NO);
                } else {  
                    await fbMessengerBotClient.sendTextMessage(fbUserId, 'Please answer my question.');
                    await fbMessengerBotClient.sendQuickReplyMessage(fbUserId, constants.BACKGROUND_STRESSED_TEXT, constants.QUICK_REPLIES_YES_OR_NO);
                }
                break;
            case constants.BACKGROUND_EAT:
                if (message.toLowerCase() === 'yes' || message.toLowerCase() === 'no') {
                    await db.collection('background').updateOne({ fbUserId_: fbUserId }, { $set: { eat: message.toLowerCase() } });
                    await db.collection('users').updateOne({ fbUserId_: fbUserId }, { $set: { botRequested: constants.BACKGROUND_ALCOHOL_NICOTINE } });
                    await fbMessengerBotClient.sendQuickReplyMessage(fbUserId, constants.BACKGROUND_ALCOHOL_NICOTINE_TEXT, constants.QUICK_REPLIES_YES_OR_NO);
                } else { 
                    await fbMessengerBotClient.sendTextMessage(fbUserId, 'Please answer my question.');
                    await fbMessengerBotClient.sendQuickReplyMessage(fbUserId, constants.BACKGROUND_EAT_TEXT, constants.QUICK_REPLIES_YES_OR_NO);
                }
                break;
            case constants.BACKGROUND_ALCOHOL_NICOTINE:
                if (message.toLowerCase() === 'yes' || message.toLowerCase() === 'no') {
                    await db.collection('background').updateOne({ fbUserId_: fbUserId }, { $set: { alcohol_nicotine: message.toLowerCase() } });
                    await db.collection('users').updateOne({ fbUserId_: fbUserId }, { $set: { botRequested: constants.BACKGROUND_CAFFEINE } });
                    await fbMessengerBotClient.sendQuickReplyMessage(fbUserId, constants.BACKGROUND_CAFFEINE_TEXT, constants.QUICK_REPLIES_YES_OR_NO);
                } else { 
                    await fbMessengerBotClient.sendTextMessage(fbUserId, 'Please answer my question.');
                    await fbMessengerBotClient.sendQuickReplyMessage(fbUserId, constants.BACKGROUND_ALCOHOL_NICOTINE_TEXT, constants.QUICK_REPLIES_YES_OR_NO);
                }
                break;
            case constants.BACKGROUND_CAFFEINE:
                if (message.toLowerCase() === 'yes' || message.toLowerCase() === 'no') {
                    await db.collection('background').updateOne({ fbUserId_: fbUserId }, { $set: { caffeine: message.toLowerCase() } });
                    await db.collection('users').updateOne({ fbUserId_: fbUserId }, { $set: { botRequested: constants.BACKGROUND_LIGHTS } });
                    await fbMessengerBotClient.sendQuickReplyMessage(fbUserId, constants.BACKGROUND_LIGHTS_TEXT, constants.QUICK_REPLIES_YES_OR_NO);
                } else { 
                    await fbMessengerBotClient.sendTextMessage(fbUserId, 'Please answer my question.');
                    await fbMessengerBotClient.sendQuickReplyMessage(fbUserId, constants.BACKGROUND_CAFFEINE_TEXT, constants.QUICK_REPLIES_YES_OR_NO);
                }
                break;
            case constants.BACKGROUND_LIGHTS:
                if (message.toLowerCase() === 'yes' || message.toLowerCase() === 'no') {
                    await db.collection('background').updateOne({ fbUserId_: fbUserId }, { $set: { lights: message.toLowerCase() } });
                    await db.collection('users').updateOne({ fbUserId_: fbUserId }, { $set: { botRequested: constants.BACKGROUND_NOISE } });
                    await fbMessengerBotClient.sendQuickReplyMessage(fbUserId, constants.BACKGROUND_NOISE_TEXT, constants.QUICK_REPLIES_YES_OR_NO);
                } else { 
                    await fbMessengerBotClient.sendTextMessage(fbUserId, 'Please answer my question.');
                    await fbMessengerBotClient.sendQuickReplyMessage(fbUserId, constants.BACKGROUND_LIGHTS_TEXT, constants.QUICK_REPLIES_YES_OR_NO);
                }
                break;
            case constants.BACKGROUND_NOISE:
                if (message.toLowerCase() === 'yes' || message.toLowerCase() === 'no') {
                    await db.collection('background').updateOne({ fbUserId_: fbUserId }, { $set: { noise: message.toLowerCase() } });
                    await db.collection('users').updateOne({ fbUserId_: fbUserId }, { $set: { botRequested: constants.BACKGROUND_EXCERCISE } });
                    await fbMessengerBotClient.sendQuickReplyMessage(fbUserId, constants.BACKGROUND_EXCERCISE_TEXT, constants.QUICK_REPLIES_YES_OR_NO);
                } else { 
                    await fbMessengerBotClient.sendTextMessage(fbUserId, 'Please answer my question.');
                    await fbMessengerBotClient.sendQuickReplyMessage(fbUserId, constants.BACKGROUND_NOISE_TEXT, constants.QUICK_REPLIES_YES_OR_NO);
                }
                break;
            case constants.BACKGROUND_EXCERCISE:
                if (message.toLowerCase() === 'yes' || message.toLowerCase() === 'no') {
                    await db.collection('background').updateOne({ fbUserId_: fbUserId }, { $set: { excercise: message.toLowerCase() } });
                    await db.collection('users').updateOne({ fbUserId_: fbUserId }, { $set: { botRequested: constants.BACKGROUND_JOB } });
                    await fbMessengerBotClient.sendQuickReplyMessage(fbUserId, constants.BACKGROUND_JOB_TEXT, constants.QUICK_REPLIES_YES_OR_NO);
                } else { 
                    await fbMessengerBotClient.sendTextMessage(fbUserId, 'Please answer my question.');
                    await fbMessengerBotClient.sendQuickReplyMessage(fbUserId, constants.BACKGROUND_EXCERCISE_TEXT, constants.QUICK_REPLIES_YES_OR_NO);
                }
                break;
            case constants.BACKGROUND_JOB:
                console.log('in here');
                if (message.toLowerCase() === 'yes' || message.toLowerCase() === 'no') {
                    await db.collection('background').updateOne({ fbUserId_: fbUserId }, { $set: { excercise: message.toLowerCase() } });

                    if (message.toLowerCase() === 'yes') {
                        await db.collection('users').updateOne({ fbUserId_: fbUserId }, { $set: { botRequested: constants.BACKGROUND_WORK_SCHEDULE } });
                        await fbMessengerBotClient.sendQuickReplyMessage(fbUserId, constants.BACKGROUND_WORK_SCHEDULE_TEXT, constants.QUICK_REPLIES_YES_OR_NO);
                    } else { 
                        await db.collection('users').updateOne({ fbUserId_: fbUserId }, { $set: { botRequested: constants.BACKGROUND_DONE } });
                        // send results of questions
                        await fbMessengerBotClient.sendTextMessage(fbUserId, 'Thank you, that\'s all my questions.');
                    }
                } else { 
                    await fbMessengerBotClient.sendTextMessage(fbUserId, 'Please answer my question.');
                    await fbMessengerBotClient.sendQuickReplyMessage(fbUserId, constants.BACKGROUND_JOB_TEXT, constants.QUICK_REPLIES_YES_OR_NO);
                }
                break;
            case constants.BACKGROUND_WORK_SCHEDULE:
                if (message.toLowerCase() === 'yes' || message.toLowerCase() === 'no') {
                    await db.collection('background').updateOne({ fbUserId_: fbUserId }, { $set: { excercise: message.toLowerCase() } });
                    await db.collection('users').updateOne({ fbUserId_: fbUserId }, { $set: { botRequested: constants.BACKGROUND_DONE } });
                    // send results of questions
                    await fbMessengerBotClient.sendTextMessage(fbUserId, 'Thank you, that\'s all my questions.');
                } else { 
                    await fbMessengerBotClient.sendTextMessage(fbUserId, 'Please answer my question.');
                    await fbMessengerBotClient.sendQuickReplyMessage(fbUserId, constants.BACKGROUND_WORK_SCHEDULE_TEXT, constants.QUICK_REPLIES_YES_OR_NO);
                }
                break;
            default:
                fbMessengerBotClient.sendTextMessage(fbUserId, '[ECHO] ' + message.substring(0, 200));
        }   
}