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
            getNewUserBackground(fbUserId, message, botRequested);
            db.close();
            return;
        }

        fbMessengerBotClient.sendTextMessage(fbUserId, 'not new');
             
        db.close();
    } catch (err) {
        console.log('[ERROR]', err);
    }
};

async function getNewUserBackground(fbUserId, message, botRequested) {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    // The following regex was by Peter O. and it was taken from https://stackoverflow.com/questions/7536755/regular-expression-for-matching-hhmm-time-format
    var timeRegex = RegExp(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/);

    // Check whether the bot asked anything from the user, if this is the case, then the bot is expecting a reply
    switch (botRequested) {
        case constants.FITBIT_AUTH:
            var msg1 = 'You haven\'t given me permission to access your Fitbit yet.'
                            + ' Please do that first before we proceed with anything else.';
            var msg2 = 'To do so click on the following link: https://calm-scrubland-31682.herokuapp.com/prepare_fitbit_auth?fbUserId='
                            + fbUserId;
            await fbMessengerBotClient.sendTextMessage(fbUserId, msg1);
            fbMessengerBotClient.sendTextMessage(fbUserId, msg2);
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
            if (timeRegex.test(message)) updateBackgroundandAskNextQuestion(fbUserId, { get_up: message }, constants.BACKGROUND_GO_TO_BED, constants.BACKGROUND_GO_TO_BED_TEXT, false);
            else repeatBackgroundQuestion(fbUserId, constants.BACKGROUND_GET_UP_TEXT, false);
            break;
        case constants.BACKGROUND_GO_TO_BED:
            if (timeRegex.test(message)) updateBackgroundandAskNextQuestion(fbUserId, { go_to_bed: message }, constants.BACKGROUND_ELECTRONICS, constants.BACKGROUND_ELECTRONICS_TEXT, true);
            else repeatBackgroundQuestion(fbUserId, constants.BACKGROUND_GO_TO_BED_TEXT, false);
            break;
        case constants.BACKGROUND_ELECTRONICS:
            if (message.toLowerCase() === 'yes' || message.toLowerCase() === 'no') updateBackgroundandAskNextQuestion(fbUserId, { electronics: message.toLowerCase() }, constants.BACKGROUND_STRESSED, constants.BACKGROUND_STRESSED_TEXT, true);
            else repeatBackgroundQuestion(fbUserId, constants.BACKGROUND_ELECTRONICS_TEXT, true);
            break;
        case constants.BACKGROUND_STRESSED:
            if (message.toLowerCase() === 'yes' || message.toLowerCase() === 'no') updateBackgroundandAskNextQuestion(fbUserId, { stressed: message.toLowerCase() }, constants.BACKGROUND_EAT, constants.BACKGROUND_EAT_TEXT, true);
            else repeatBackgroundQuestion(fbUserId, constants.BACKGROUND_STRESSED_TEXT, true);
            break;
        case constants.BACKGROUND_EAT:
            if (message.toLowerCase() === 'yes' || message.toLowerCase() === 'no') updateBackgroundandAskNextQuestion(fbUserId, { eat: message.toLowerCase() }, constants.BACKGROUND_ALCOHOL_NICOTINE, constants.BACKGROUND_ALCOHOL_NICOTINE_TEXT, true);
            else repeatBackgroundQuestion(fbUserId, constants.BACKGROUND_EAT_TEXT, true);
            break;
        case constants.BACKGROUND_ALCOHOL_NICOTINE:
            if (message.toLowerCase() === 'yes' || message.toLowerCase() === 'no') updateBackgroundandAskNextQuestion(fbUserId, { alcohol_nicotine: message.toLowerCase() }, constants.BACKGROUND_CAFFEINE, constants.BACKGROUND_CAFFEINE_TEXT, true);
            else repeatBackgroundQuestion(fbUserId, constants.BACKGROUND_ALCOHOL_NICOTINE_TEXT, true);
            break;   
        case constants.BACKGROUND_CAFFEINE:
            if (message.toLowerCase() === 'yes' || message.toLowerCase() === 'no') updateBackgroundandAskNextQuestion(fbUserId, { caffeine: message.toLowerCase() }, constants.BACKGROUND_LIGHTS, constants.BACKGROUND_LIGHTS_TEXT, true);
            else repeatBackgroundQuestion(fbUserId, constants.BACKGROUND_CAFFEINE_TEXT, true);
            break; 
        case constants.BACKGROUND_LIGHTS:
            if (message.toLowerCase() === 'yes' || message.toLowerCase() === 'no') updateBackgroundandAskNextQuestion(fbUserId, { lights: message.toLowerCase() }, constants.BACKGROUND_NOISE, constants.BACKGROUND_NOISE_TEXT, true);
            else repeatBackgroundQuestion(fbUserId, constants.BACKGROUND_LIGHTS_TEXT, true);
            break;     
        case constants.BACKGROUND_NOISE:
            if (message.toLowerCase() === 'yes' || message.toLowerCase() === 'no') updateBackgroundandAskNextQuestion(fbUserId, { noise: message.toLowerCase() }, constants.BACKGROUND_EXCERCISE, constants.BACKGROUND_EXCERCISE_TEXT, true);
            else repeatBackgroundQuestion(fbUserId, constants.BACKGROUND_NOISE_TEXT, true);
            break;  
        case constants.BACKGROUND_EXCERCISE:
            if (message.toLowerCase() === 'yes' || message.toLowerCase() === 'no') updateBackgroundandAskNextQuestion(fbUserId, { excercise: message.toLowerCase()}, constants.BACKGROUND_JOB, constants.BACKGROUND_JOB_TEXT, true);
            else repeatBackgroundQuestion(fbUserId, constants.BACKGROUND_EXCERCISE_TEXT, true);
            break; 
        case constants.BACKGROUND_JOB:
            if (message.toLowerCase() === 'yes' || message.toLowerCase() === 'no') {
                await db.collection('background').updateOne({ fbUserId_: fbUserId }, { $set: { job: message.toLowerCase() } });
                if (message.toLowerCase() === 'yes') {
                    await db.collection('users').updateOne({ fbUserId_: fbUserId }, { $set: { botRequested: constants.BACKGROUND_WORK_SCHEDULE } });
                    fbMessengerBotClient.sendQuickReplyMessage(fbUserId, constants.BACKGROUND_WORK_SCHEDULE_TEXT, constants.QUICK_REPLIES_YES_OR_NO);
                } else { 
                    await db.collection('users').updateOne({ fbUserId_: fbUserId }, { $set: { botRequested: constants.BACKGROUND_DONE, userIsNew: false } });
                    presentResultsForBackground(fbUserId, false);
                }
            } else { 
                repeatBackgroundQuestion(fbUserId, constants.BACKGROUND_JOB_TEXT, true);
            }
            break;
        case constants.BACKGROUND_WORK_SCHEDULE:
            if (message.toLowerCase() === 'yes' || message.toLowerCase() === 'no') {
                await db.collection('background').updateOne({ fbUserId_: fbUserId }, { $set: { work_schedule: message.toLowerCase() } });
                await db.collection('users').updateOne({ fbUserId_: fbUserId }, { $set: { botRequested: constants.BACKGROUND_DONE, userIsNew: false } });
                presentResultsForBackground(fbUserId, true);
            } else { 
                 repeatBackgroundQuestion(fbUserId, constants.BACKGROUND_WORK_SCHEDULE_TEXT, true);
            }
            break;
        default:
            fbMessengerBotClient.sendTextMessage(fbUserId, '[ECHO] ' + message.substring(0, 200));
            break;
    }      
}

async function updateBackgroundandAskNextQuestion(fbUserId, messageObj, nextQuestion, nextQuestionText, quickReplyMessage) {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    await db.collection('background').updateOne({ fbUserId_: fbUserId }, { $set: messageObj });
    await db.collection('users').updateOne({ fbUserId_: fbUserId }, { $set: { botRequested: nextQuestion } });
    if (quickReplyMessage) fbMessengerBotClient.sendQuickReplyMessage(fbUserId, nextQuestionText, constants.QUICK_REPLIES_YES_OR_NO);
    else fbMessengerBotClient.sendTextMessage(fbUserId, nextQuestionText);
    db.close();
}

async function repeatBackgroundQuestion(fbUserId, questionText, quickReplyMessage) {
    await fbMessengerBotClient.sendTextMessage(fbUserId, 'Please answer my question.');
    if (quickReplyMessage) {
        fbMessengerBotClient.sendQuickReplyMessage(fbUserId, questionText, constants.QUICK_REPLIES_YES_OR_NO);
        console.log('first case');
    } 
    else { fbMessengerBotClient.sendTextMessage(fbUserId, nextQuestionText);
    console.log('second case');
    }
}

async function presentResultsForBackground(fbUserId, hasIrregularWorkSchedule) {
    await fbMessengerBotClient.sendTextMessage(fbUserId, 'Thank you, that\'s all my questions.');
}