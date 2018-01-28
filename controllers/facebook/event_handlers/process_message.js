/**
 * Module for processing messages recieved from the webhook. 
 * Messages recieved from users are sent a reply.
 */


var request = require('request');
var fbMessengerBot = require('fb-messenger-bot-api');
var fbMessengerBotClient = new fbMessengerBot.Client(process.env.FB_PAGE_ACCESS_TOKEN);
var MessengerBot = require('messenger-bot');
var messengerBotClient = new MessengerBot({ token:process.env.FB_PAGE_ACCESS_TOKEN });

var userBackground = require('../../../models/user_background');
var user = require('../../../models/user');

var constants = require('../../constants');
var dateAndTimeUtil = require('../../../utility/date_and_time_util');

module.exports = async (event) => {
    try { 
        const fbUserId = event.sender.id;
        var message = event.message.text.toLowerCase();
        await fbMessengerBotClient.markSeen(fbUserId);
        await messengerBotClient.sendSenderAction(fbUserId, 'typing_on');

        const botRequested = await user.getBotRequested(fbUserId);
        const userIsNew = await user.isUserNew(fbUserId);
        if (userIsNew) {
            getNewUserBackground(fbUserId, message, botRequested);
            return;
        }

        //var notifiedSleep = await user.getNotifiedSleep(fbUserId);
        sleepQuestions = 
            [NOTIFIED_SLEEP, SLEEP_ELECTRONICS, SLEEP_STRESSED, SLEEP_EAT, SLEEP_ALCOHOL_NICOTINE,
            SLEEP_CAFFEINE, SLEEP_LIGHTS, SLEEP_QUIET];
        if (sleepQuestions.include(botRequested)) {
            console.log('in here');
            chatAboutSleep(fbUserId, message, botRequested);
            return;
        }

        fbMessengerBotClient.sendTextMessage(fbUserId, 'not new');
        // fbMessengerBotClient.sendTextMessage(fbUserId, '[ECHO] ' + message.substring(0, 200));
    } catch (err) {
        console.log('[ERROR]', err);
    } 
};

async function getNewUserBackground(fbUserId, message, botRequested) {
    try {
        // The following regex was by Peter O. and it was taken from https://stackoverflow.com/questions/7536755/regular-expression-for-matching-hhmm-time-format
        const timeRegex = RegExp(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/);

        // Check whether the bot asked anything from the user, if this is the case, then the bot is expecting a reply
        switch (botRequested) {
            case constants.FITBIT_AUTH:
                var msg = 'You haven\'t given me permission to access your Fitbit yet. Please do that first before we proceed with anything else.';
                                + 'To do so click on the following link:\nhttps://calm-scrubland-31682.herokuapp.com/prepare_fitbit_auth?fbUserId='
                                + fbUserId;
                fbMessengerBotClient.sendTextMessage(fbUserId, msg);
                break;
            case constants.BACKGROUND_QUESTIONS:
                if (message === 'yes') {
                    await user.updateBotRequested(fbUserId, constants.BACKGROUND_GET_UP);
                    fbMessengerBotClient.sendTextMessage(fbUserId, constants.BACKGROUND_GET_UP_TEXT);
                } else {  
                    var msg = 'I need to have some background about your sleep. I only have a couple of questions, could you answer them first?';
                    fbMessengerBotClient.sendQuickReplyMessage(fbUserId, msg, constants.QUICK_REPLIES_YES_OR_NO);
                }
                break;
            case constants.BACKGROUND_GET_UP:
                if (timeRegex.test(message)) updateBackgroundandAskNextQuestion(fbUserId, constants.GET_UP, message, constants.BACKGROUND_GO_TO_BED, constants.BACKGROUND_GO_TO_BED_TEXT, false);
                else repeatBackgroundQuestion(fbUserId, constants.BACKGROUND_GET_UP_TEXT, false);
                break;
            case constants.BACKGROUND_GO_TO_BED:
                if (timeRegex.test(message)) updateBackgroundandAskNextQuestion(fbUserId, constants.GO_TO_BED, message, constants.BACKGROUND_ELECTRONICS, constants.BACKGROUND_ELECTRONICS_TEXT, true);
                else repeatBackgroundQuestion(fbUserId, constants.BACKGROUND_GO_TO_BED_TEXT, false);
                break;
            case constants.BACKGROUND_ELECTRONICS:
                if (message === 'yes' || message === 'no') updateBackgroundandAskNextQuestion(fbUserId, constants.ELECTRONICS, message, constants.BACKGROUND_STRESSED, constants.BACKGROUND_STRESSED_TEXT, true);
                else repeatBackgroundQuestion(fbUserId, constants.BACKGROUND_ELECTRONICS_TEXT, true);
                break;
            case constants.BACKGROUND_STRESSED:
                if (message === 'yes' || message === 'no') updateBackgroundandAskNextQuestion(fbUserId,  constants.STRESSED, message, constants.BACKGROUND_EAT, constants.BACKGROUND_EAT_TEXT, true);
                else repeatBackgroundQuestion(fbUserId, constants.BACKGROUND_STRESSED_TEXT, true);
                break;
            case constants.BACKGROUND_EAT:
                if (message === 'yes' || message === 'no') updateBackgroundandAskNextQuestion(fbUserId, constants.EAT, message, constants.BACKGROUND_ALCOHOL_NICOTINE, constants.BACKGROUND_ALCOHOL_NICOTINE_TEXT, true);
                else repeatBackgroundQuestion(fbUserId, constants.BACKGROUND_EAT_TEXT, true);
                break;
            case constants.BACKGROUND_ALCOHOL_NICOTINE:
                if (message === 'yes' || message === 'no') updateBackgroundandAskNextQuestion(fbUserId, constants.ALCOHOL_NICOTINE, message, constants.BACKGROUND_CAFFEINE, constants.BACKGROUND_CAFFEINE_TEXT, true);
                else repeatBackgroundQuestion(fbUserId, constants.BACKGROUND_ALCOHOL_NICOTINE_TEXT, true);
                break;   
            case constants.BACKGROUND_CAFFEINE:
                if (message === 'yes' || message === 'no') updateBackgroundandAskNextQuestion(fbUserId, constants.CAFFEINE, message, constants.BACKGROUND_LIGHTS, constants.BACKGROUND_LIGHTS_TEXT, true);
                else repeatBackgroundQuestion(fbUserId, constants.BACKGROUND_CAFFEINE_TEXT, true);
                break; 
            case constants.BACKGROUND_LIGHTS:
                if (message === 'yes' || message === 'no') updateBackgroundandAskNextQuestion(fbUserId, constants.LIGHTS, message, constants.BACKGROUND_QUIET, constants.BACKGROUND_QUIET_TEXT, true);
                else repeatBackgroundQuestion(fbUserId, constants.BACKGROUND_LIGHTS_TEXT, true);
                break;     
            case constants.BACKGROUND_QUIET:
                if (message === 'yes' || message === 'no') updateBackgroundandAskNextQuestion(fbUserId, constants.QUIET, message, constants.BACKGROUND_EXCERCISE, constants.BACKGROUND_EXCERCISE_TEXT, true);
                else repeatBackgroundQuestion(fbUserId, constants.BACKGROUND_QUIET_TEXT, true);
                break;  
            case constants.BACKGROUND_EXCERCISE:
                if (message === 'yes' || message === 'no') updateBackgroundandAskNextQuestion(fbUserId, constants.EXCERCISE, message, constants.BACKGROUND_JOB, constants.BACKGROUND_JOB_TEXT, true);
                else repeatBackgroundQuestion(fbUserId, constants.BACKGROUND_EXCERCISE_TEXT, true);
                break; 
            case constants.BACKGROUND_JOB:
                if (message === 'yes' || message === 'no') {
                    await userBackground.updateBackground(fbUserId, constants.JOB, message);
                    if (message === 'yes') {
                        await user.updateUser(fbUserId, { botRequested: constants.BACKGROUND_WORK_SCHEDULE });
                        fbMessengerBotClient.sendQuickReplyMessage(fbUserId, constants.BACKGROUND_WORK_SCHEDULE_TEXT, constants.QUICK_REPLIES_YES_OR_NO);
                    } else { 
                        await user.updateUser(fbUserId, { botRequested: null, userIsNew: false });
                        presentResultsForBackground(fbUserId, false);
                    }
                } else { 
                    repeatBackgroundQuestion(fbUserId, constants.BACKGROUND_JOB_TEXT, true);
                }
                break;
            case constants.BACKGROUND_WORK_SCHEDULE:
                if (message === 'yes' || message === 'no') {
                    await userBackground.updateBackground(fbUserId, constants.WORK_SCHEDULE, message);
                    await user.updateBotRequested(fbUserId, null);
                    await user.updateUserIsNew(fbUserId, false);
                    presentResultsForBackground(fbUserId, true);
                } else { 
                    repeatBackgroundQuestion(fbUserId, constants.BACKGROUND_WORK_SCHEDULE_TEXT, true);
                }
                break;
            default:
                break;
        }
    } catch (err) {
        console.log('[ERROR]', err);
    }     
}

async function updateBackgroundandAskNextQuestion(fbUserId, context, message, nextQuestionContext, nextQuestionText, isQuickReplyMessage) {
    await userBackground.updateBackground(fbUserId, context, message);
    await user.updateBotRequested(fbUserId, nextQuestionContext);
    if (isQuickReplyMessage) fbMessengerBotClient.sendQuickReplyMessage(fbUserId, nextQuestionText, constants.QUICK_REPLIES_YES_OR_NO);
    else fbMessengerBotClient.sendTextMessage(fbUserId, nextQuestionText);
}

async function repeatBackgroundQuestion(fbUserId, questionText, quickReplyMessage) {
    await fbMessengerBotClient.sendTextMessage(fbUserId, 'Please answer my question.');
    if (quickReplyMessage) fbMessengerBotClient.sendQuickReplyMessage(fbUserId, questionText, constants.QUICK_REPLIES_YES_OR_NO);
    else fbMessengerBotClient.sendTextMessage(fbUserId, questionText);
}

async function presentResultsForBackground(fbUserId, hasIrregularWorkSchedule) {
    await fbMessengerBotClient.sendTextMessage(fbUserId, 'Thank you, that\'s all my questions.');

    var getUp = await userBackground.getGoToBed(fbUserId);
    var goToBed = await userBackground.getGetUp(fbUserId);
    var getUpHour = dateAndTimeUtil.getHourFromTimeString(getUp);
    var goToBedHour = dateAndTimeUtil.getHourFromTimeString(goToBed);
    var difference = Math.abs(getUpHour - goToBedHour) % 23;
    var date1 = new Date(2018, 1, 1, getUpHour);
    var date2 = new Date(2018, 1, 1, goToBedHour);
    var diff = (new Date(date2 - date1)).getHours();
    if(difference >= 7) {
        fbMessengerBotClient.sendTextMessage(fbUserId, 'You slept for ' + difference + ' hours! This is enough!');
    } else if (difference < 7 ) {
        fbMessengerBotClient.sendTextMessage(fbUserId, 'You slept for ' + difference + ' hours! This is not enough!');
    }
}

async function chatAboutSleep(fbUserId, message, botRequested) {
    try {
        switch (botRequested) {
            case constants.NOTIFIED_SLEEP:
                if (message === 'yes') {
                    await user.updateBotRequested(fbUserId, constants.SLEEP_ELECTRONICS);
                    fbMessengerBotClient.sendTextMessage(fbUserId, constants.SLEEP_ELECTRONICS_TEXT);
                } else {  
                    var msg = 'I would like to have a quick chat about your sleep. Please may we proceed?';
                    fbMessengerBotClient.sendQuickReplyMessage(fbUserId, msg, constants.QUICK_REPLIES_YES_OR_NO);
                }
                break;
            case constants.SLEEP_ELECTRONICS:
                if (message === 'yes' || message === 'no') updateSleepAnswersandAskNextQuestion(fbUserId, constants.ELECTRONICS, message, constants.SLEEP_STRESSED, constants.SLEEP_STRESSED_TEXT, true);
                else repeatSleepQuestion(fbUserId, constants.SLEEP_ELECTRONICS_TEXT, true);
                break;
            case constants.SLEEP_STRESSED:
                if (message === 'yes' || message === 'no') updateSleepAnswersandAskNextQuestion(fbUserId, constants.STRESSED, message, constants.SLEEP_EAT, constants.SLEEP_EAT_TEXT, true);
                else repeatSleepQuestion(fbUserId, constants.SLEEP_STRESSED, true);
                break;
            case constants.SLEEP_EAT:
                if (message === 'yes' || message === 'no') updateSleepAnswersandAskNextQuestion(fbUserId, constants.SLEEP_EAT, message, constants.SLEEP_ALCOHOL_NICOTINE, constants.SLEEP_ALCOHOL_NICOTINE_TEXT, true);
                else repeatSleepQuestion(fbUserId, constants.SLEEP_EAT, true);
                break;
            case constants.SLEEP_ALCOHOL_NICOTINE:
                if (message === 'yes' || message === 'no') updateSleepAnswersandAskNextQuestion(fbUserId, constants.SLEEP_ALCOHOL_NICOTINE, message, constants.SLEEP_CAFFEINE, constants.SLEEP_CAFFEINE_TEXT, true);
                else repeatSleepQuestion(fbUserId, constants.SLEEP_ALCOHOL_NICOTINE, true);
                break;
            case constants.SLEEP_CAFFEINE:
                if (message === 'yes' || message === 'no') updateSleepAnswersandAskNextQuestion(fbUserId, constants.SLEEP_CAFFEINE, message, constants.LIGHTS, constants.LIGHTS_TEXT, true);
                else repeatSleepQuestion(fbUserId, constants.SLEEP_CAFFEINE, true);
                break;
            case constants.SLEEP_LIGHTS:
                if (message === 'yes' || message === 'no') updateSleepAnswersandAskNextQuestion(fbUserId, constants.LIGHTS, message, constants.SLEEP_QUIET, constants.SLEEP_QUIET_TEXT, true);
                else repeatSleepQuestion(fbUserId, constants.SLEEP_LIGHTS, true);
                break;
            case constants.SLEEP_QUIET:
                break;
            default:
                break;
        }
    } catch (err) {
        console.log('[ERROR]', err);
    }
}

async function updateSleepAnswersandAskNextQuestion(fbUserId, context, message, nextQuestionContext, nextQuestionText, isQuickReplyMessage) {
    await userBackground.updateSleepAnswer(fbUserId, context, message);
    await user.updateBotRequested(fbUserId, nextQuestionContext);
    if (isQuickReplyMessage) fbMessengerBotClient.sendQuickReplyMessage(fbUserId, nextQuestionText, constants.QUICK_REPLIES_YES_OR_NO);
    else fbMessengerBotClient.sendTextMessage(fbUserId, nextQuestionText);
}

async function repeatSleepQuestion(fbUserId, questionText, quickReplyMessage) {
    await fbMessengerBotClient.sendTextMessage(fbUserId, 'Please answer my question.');
    if (quickReplyMessage) fbMessengerBotClient.sendQuickReplyMessage(fbUserId, questionText, constants.QUICK_REPLIES_YES_OR_NO);
    else fbMessengerBotClient.sendTextMessage(fbUserId, questionText);
}