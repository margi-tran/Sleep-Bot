/**
 * Module for processing messages recieved from the webhook. 
 * Messages recieved from users are sent a reply.
 */


var request = require('request');
var fbMessengerBot = require('fb-messenger-bot-api');
var fbMessengerBotClient = new fbMessengerBot.Client(process.env.FB_PAGE_ACCESS_TOKEN);
var MessengerBot = require('messenger-bot');
var messengerBotClient = new MessengerBot({ token: process.env.FB_PAGE_ACCESS_TOKEN });
var apiai = require('apiai-promise');
var apiaiClient = apiai(process.env.APIAI_CLIENT_ACCESS_TOKEN);

var user = require('../../../models/user');
var userBackground = require('../../../models/user_background');
var userSleepAnswers = require('../../../models/user_sleep_answers');
var factor = require('../../../models/factor');

var constants = require('../../constants');
var dateAndTimeUtil = require('../../../utility/date_and_time_util');

var backgroundQuestionsMap = {};
backgroundQuestionsMap[constants.BACKGROUND_QUESTIONS] = 'I need to have some background about your sleep. I only have a couple of questions, could you answer them first?';
backgroundQuestionsMap[constants.BACKGROUND_GET_UP] = 'At what time do you usually get up on a weekday? Please give your answer in 24-hour time format (i.e. HH:MM).';
backgroundQuestionsMap[constants.BACKGROUND_GO_TO_BED] = 'At what time do you usually go to bed on a weekday? Please give your answer in 24-hour time format (i.e. HH:MM).';
backgroundQuestionsMap[constants.BACKGROUND_ELECTRONICS] = 'Do you use your phone (or any other electronic devices) before going to bed (or in bed)?';
backgroundQuestionsMap[constants.BACKGROUND_STRESSED] = 'Are you stressed or worried about anything?';
backgroundQuestionsMap[constants.BACKGROUND_EAT] = 'Do you eat before going to bed?';
backgroundQuestionsMap[constants.BACKGROUND_ALCOHOL_NICOTINE] = 'Do you drink alcohol or take nicotine before going to bed?';
backgroundQuestionsMap[constants.BACKGROUND_CAFFEINE] = 'Do you drink any beverages with caffeine, such as tea, before going to bed?';
backgroundQuestionsMap[constants.BACKGROUND_LIGHTS] = 'Do you sleep with the lights on?';
backgroundQuestionsMap[constants.BACKGROUND_QUIET] = 'Is your bedroom quiet when you sleep?';
backgroundQuestionsMap[constants.BACKGROUND_EXERCISE] = 'Are you exercising regularly?';
backgroundQuestionsMap[constants.BACKGROUND_JOB] = 'Do you have a job?';
backgroundQuestionsMap[constants.BACKGROUND_WORK_SCHEDULE] = 'Is your work schedule irregular?';

const sleepQuestions = 
    [
        constants.NOTIFIED_SLEEP, constants.SLEEP_ELECTRONICS, constants.SLEEP_STRESSED, constants.SLEEP_EAT, 
        constants.SLEEP_ALCOHOL_NICOTINE, constants.SLEEP_CAFFEINE, constants.SLEEP_LIGHTS, constants.SLEEP_QUIET
    ];
var sleepQuestionsMap = {};
sleepQuestionsMap[constants.SLEEP_ELECTRONICS] = 'Did you use your phone (or any other electronic devices) before going to bed (or in bed)?'; 
sleepQuestionsMap[constants.SLEEP_STRESSED] = 'Are you stressed or worried about anything?';
sleepQuestionsMap[constants.SLEEP_EAT] = 'Did you eat before going to bed?';
sleepQuestionsMap[constants.SLEEP_ALCOHOL_NICOTINE] = 'Did you drink alcohol or take nicotine before going to bed?';
sleepQuestionsMap[constants.SLEEP_CAFFEINE] = 'Did you drink any beverages with caffeine, such as tea, before going to bed?';
sleepQuestionsMap[constants.SLEEP_LIGHTS] = 'Did you sleep with the lights on?';
sleepQuestionsMap[constants.SLEEP_QUIET] = 'Was your bedroom quiet when you went to sleep?';

module.exports = async (event) => {
    try { 
        const fbUserId = event.sender.id;
        var message = event.message.text.toLowerCase();
        await fbMessengerBotClient.markSeen(fbUserId);
        await messengerBotClient.sendSenderAction(fbUserId, 'typing_on');

        const botRequested = await user.getBotRequested(fbUserId);
        const userIsNew = await user.isUserNew(fbUserId);
        // Get background sleep information from new user
        if (userIsNew) {
            getNewUserBackground(fbUserId, message, botRequested);
            return;
        }

        // 'Interview' user about their sleep
        if (sleepQuestions.includes(botRequested)) {
            chatAboutSleep(fbUserId, message, botRequested);
            return;
        }

        /*const apiaiResponse = await apiaiClient.textRequest(message, { sessionId: fbUserId });
        const intent = apiaiResponse.result.metadata.intentName;
        const parameters = apiaiResponse.result.parameters;
        if (intent === 'factor effects' && parameters.factors !== '') {
            var explanation = await factor.getExplanation(parameters.factors);
            fbMessengerBotClient.sendTextMessage(fbUserId, explanation);
        } else { 
            // Default apiai filler response or smalltalk response
            fbMessengerBotClient.sendTextMessage(fbUserId, apiaiResponse.result.fulfillment.speech);
        }*/

        const apiaiResponse = await apiaiClient.textRequest(message, { sessionId: fbUserId });
        const intent = apiaiResponse.result.metadata.intentName;
        const parameters = apiaiResponse.result.parameters;
        if (intent === 'factor effects' && parameters.factors !== '') {
            var factorParameter = parameters.factors;
            var explanationArray = await factor.getExplanation(factorParameter);
            if (explanationArray.length === 1) {
                fbMessengerBotClient.sendTextMessage(fbUserId, explanationArray[0]);
                return;
            } else {
                const buttons = 
                    [{
                        "content_type": "text",
                        "title": "more",
                        "payload": 'FACTOR ' + factorParameter + ' ' + 1
                    },
                    {
                        "content_type": "text",
                        "title": "done",
                        "payload": "done with factor"
                    }];
                fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[0], buttons);
            }
        } else { 
            // Default apiai filler response or smalltalk response
            fbMessengerBotClient.sendTextMessage(fbUserId, apiaiResponse.result.fulfillment.speech);
        }
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
                if (timeRegex.test(message)) updateBackgroundandAskNextQuestion(fbUserId, constants.GET_UP, message, constants.BACKGROUND_GO_TO_BED, false);
                else repeatQuestion(fbUserId, backgroundQuestionsMap[constants.BACKGROUND_GET_UP], false);
                break;
            case constants.BACKGROUND_GO_TO_BED:
                if (timeRegex.test(message)) updateBackgroundandAskNextQuestion(fbUserId, constants.GO_TO_BED, message, constants.BACKGROUND_ELECTRONICS, true);
                else repeatQuestion(fbUserId, backgroundQuestionsMap[constants.BACKGROUND_GO_TO_BED], false);
                break;
            case constants.BACKGROUND_ELECTRONICS:
                if (message === 'yes' || message === 'no') updateBackgroundandAskNextQuestion(fbUserId, constants.ELECTRONICS, message, constants.BACKGROUND_STRESSED, true);
                else repeatQuestion(fbUserId, backgroundQuestionsMap[constants.BACKGROUND_ELECTRONICS], true);
                break;
            case constants.BACKGROUND_STRESSED:
                if (message === 'yes' || message === 'no') updateBackgroundandAskNextQuestion(fbUserId,  constants.STRESSED, message, constants.BACKGROUND_EAT, true);
                else repeatQuestion(fbUserId, backgroundQuestionsMap[constants.BACKGROUND_STRESSED], true);
                break;
            case constants.BACKGROUND_EAT:
                if (message === 'yes' || message === 'no') updateBackgroundandAskNextQuestion(fbUserId, constants.EAT, message, constants.BACKGROUND_ALCOHOL_NICOTINE, true);
                else repeatQuestion(fbUserId, backgroundQuestionsMap[constants.BACKGROUND_EAT], true);
                break;
            case constants.BACKGROUND_ALCOHOL_NICOTINE:
                if (message === 'yes' || message === 'no') updateBackgroundandAskNextQuestion(fbUserId, constants.ALCOHOL_NICOTINE, message, constants.BACKGROUND_CAFFEINE, true);
                else repeatQuestion(fbUserId, backgroundQuestionsMap[constants.BACKGROUND_ALCOHOL_NICOTINE], true);
                break;   
            case constants.BACKGROUND_CAFFEINE:
                if (message === 'yes' || message === 'no') updateBackgroundandAskNextQuestion(fbUserId, constants.CAFFEINE, message, constants.BACKGROUND_LIGHTS, true);
                else repeatQuestion(fbUserId, backgroundQuestionsMap[constants.BACKGROUND_CAFFEINE], true);
                break; 
            case constants.BACKGROUND_LIGHTS:
                if (message === 'yes' || message === 'no') updateBackgroundandAskNextQuestion(fbUserId, constants.LIGHTS, message, constants.BACKGROUND_QUIET, true);
                else repeatQuestion(fbUserId, backgroundQuestionsMap[constants.BACKGROUND_LIGHTS], true);
                break;     
            case constants.BACKGROUND_QUIET:
                if (message === 'yes' || message === 'no') updateBackgroundandAskNextQuestion(fbUserId, constants.QUIET, message, constants.BACKGROUND_EXERCISE, true);
                else repeatQuestion(fbUserId, backgroundQuestionsMap[constants.BACKGROUND_QUIET], true);
                break;  
            case constants.BACKGROUND_EXERCISE:
                if (message === 'yes' || message === 'no') updateBackgroundandAskNextQuestion(fbUserId, constants.EXERCISE, message, constants.BACKGROUND_JOB, true);
                else repeatQuestion(fbUserId, backgroundQuestionsMap[constants.BACKGROUND_EXERCISE], true);
                break; 
            case constants.BACKGROUND_JOB:
                if (message === 'yes' || message === 'no') {
                    await userBackground.updateBackground(fbUserId, constants.JOB, message);
                    if (message === 'yes') {
                        await user.updateUser(fbUserId, { botRequested: constants.BACKGROUND_WORK_SCHEDULE });
                        fbMessengerBotClient.sendQuickReplyMessage(fbUserId, backgroundQuestionsMap[constants.BACKGROUND_WORK_SCHEDULE], constants.QUICK_REPLIES_YES_OR_NO);
                    } else { 
                        presentResultsForBackground(fbUserId, false);
                    }
                } else { 
                    repeatQuestion(fbUserId, backgroundQuestionsMap[constants.BACKGROUND_JOB], true);
                }
                break;
            case constants.BACKGROUND_WORK_SCHEDULE:
                if (message === 'yes' || message === 'no') {
                    await userBackground.updateBackground(fbUserId, constants.WORK_SCHEDULE, message);
                    presentResultsForBackground(fbUserId, true);
                } else { 
                    repeatQuestion(fbUserId, backgroundQuestionsMap[contants.BACKGROUND_WORK_SCHEDULE], true);
                }
                break;
            default:
                break;
        }
    } catch (err) {
        console.log('[ERROR]', err);
    }     
}

async function repeatQuestion(fbUserId, questionText, quickReplyMessage) {
    await fbMessengerBotClient.sendTextMessage(fbUserId, 'Sorry, I didn\'t get that. Let\'s try again.');
    if (quickReplyMessage) fbMessengerBotClient.sendQuickReplyMessage(fbUserId, questionText, constants.QUICK_REPLIES_YES_OR_NO);
    else fbMessengerBotClient.sendTextMessage(fbUserId, questionText);
}

async function updateBackgroundandAskNextQuestion(fbUserId, context, message, nextQuestionContext, isQuickReplyMessage) {
    await userBackground.updateBackground(fbUserId, context, message);
    await user.updateBotRequested(fbUserId, nextQuestionContext);
    if (isQuickReplyMessage) fbMessengerBotClient.sendQuickReplyMessage(fbUserId, backgroundQuestionsMap[nextQuestionContext], constants.QUICK_REPLIES_YES_OR_NO);
    else fbMessengerBotClient.sendTextMessage(fbUserId, backgroundQuestionsMap[nextQuestionContext]);
}

async function presentResultsForBackground(fbUserId, hasIrregularWorkSchedule) {
    await user.updateBotRequested(fbUserId, null);
    await user.updateUserIsNew(fbUserId, false);
    await user.setNotifiedSleepToFalse(fbUserId);

    await fbMessengerBotClient.sendTextMessage(fbUserId, 'Thank you. That\'s all my questions.');

    var getUp = await userBackground.getGoToBed(fbUserId);
    var goToBed = await userBackground.getGetUp(fbUserId);
    var getUpHour = dateAndTimeUtil.getHourFromTimeString(getUp);
    var goToBedHour = dateAndTimeUtil.getHourFromTimeString(goToBed);
    var difference = Math.abs(getUpHour - goToBedHour) % 23;
    var date1 = new Date(2018, 1, 1, getUpHour);
    var date2 = new Date(2018, 1, 1, goToBedHour);
    var diff = (new Date(date2 - date1)).getHours();
    if(difference >= 7) {
        fbMessengerBotClient.sendTextMessage(fbUserId, 'You sleep for ' + difference + ' hours! This is enough!');
    } else if (difference < 7 ) {
        fbMessengerBotClient.sendTextMessage(fbUserId, 'You sleep for ' + difference + ' hours! This is not enough!');
    }
    fbMessengerBotClient.sendTextMessage(fbUserId, 'You said you sleep with the lights on and eat before sleeping and these can cause sleep disturbances!');
    fbMessengerBotClient.sendTextMessage(fbUserId, 'But thats it from me. If you have any questions abot sleep feel free to ask them.');
}

async function chatAboutSleep(fbUserId, message, botRequested) {
    try {
        switch (botRequested) {
            case constants.NOTIFIED_SLEEP:
                if (message === 'yes') {
                    await fbMessengerBotClient.sendTextMessage(fbUserId, 'Great. I have a few questions for you.');
                    await user.updateBotRequested(fbUserId, constants.SLEEP_ELECTRONICS);
                    fbMessengerBotClient.sendQuickReplyMessage(fbUserId, sleepQuestionsMap[constants.SLEEP_ELECTRONICS], constants.QUICK_REPLIES_YES_OR_NO);
                } else {  
                    var msg = 'Sorry but it\'s important that we find out why you had a sleep disturbance. Please may we proceed?';
                    fbMessengerBotClient.sendQuickReplyMessage(fbUserId, msg, constants.QUICK_REPLIES_YES_OR_NO);
                }
                break;
            case constants.SLEEP_ELECTRONICS:
                if (message === 'yes' || message === 'no') updateSleepAnswersandAskNextQuestion(fbUserId, constants.ELECTRONICS, message, constants.SLEEP_STRESSED, true);
                else repeatQuestion(fbUserId, constants.SLEEP_ELECTRONICS_TEXT, true);
                break;
            case constants.SLEEP_STRESSED:
                if (message === 'yes' || message === 'no') updateSleepAnswersandAskNextQuestion(fbUserId, constants.STRESSED, message, constants.SLEEP_EAT, true);
                else repeatQuestion(fbUserId, constants.SLEEP_STRESSED, true);
                break;
            case constants.SLEEP_EAT:
                if (message === 'yes' || message === 'no') updateSleepAnswersandAskNextQuestion(fbUserId, constants.EAT, message, constants.SLEEP_ALCOHOL_NICOTINE, true);
                else repeatQuestion(fbUserId, constants.SLEEP_EAT, true);
                break;
            case constants.SLEEP_ALCOHOL_NICOTINE:
                if (message === 'yes' || message === 'no') updateSleepAnswersandAskNextQuestion(fbUserId, constants.ALCOHOL_NICOTINE, message, constants.SLEEP_CAFFEINE, true);
                else repeatQuestion(fbUserId, constants.SLEEP_ALCOHOL_NICOTINE, true);
                break;
            case constants.SLEEP_CAFFEINE:
                if (message === 'yes' || message === 'no') updateSleepAnswersandAskNextQuestion(fbUserId, constants.CAFFEINE, message, constants.SLEEP_LIGHTS, true);
                else repeatQuestion(fbUserId, constants.SLEEP_CAFFEINE, true);
                break;
            case constants.SLEEP_LIGHTS:
                if (message === 'yes' || message === 'no') updateSleepAnswersandAskNextQuestion(fbUserId, constants.LIGHTS, message, constants.SLEEP_QUIET, true);
                else repeatQuestion(fbUserId, constants.SLEEP_LIGHTS, true);
                break;
            case constants.SLEEP_QUIET:
                if (message === 'yes' || message === 'no') {
                    await userSleepAnswers.updateSleepAnswer(fbUserId, constants.QUIET, message);
                    await user.updateBotRequested(fbUserId, null);
                    presentResultsForSleep(fbUserId);
                } else { 
                    repeatQuestion(fbUserId, sleepQuestionsMap[constants.SLEEP_QUIET], true);
                }
                break;
            default:
                break;
        }
    } catch (err) {
        console.log('[ERROR]', err);
    }
}

async function updateSleepAnswersandAskNextQuestion(fbUserId, context, message, nextQuestionContext, isQuickReplyMessage) {
    await userSleepAnswers.updateSleepAnswer(fbUserId, context, message);
    await user.updateBotRequested(fbUserId, nextQuestionContext);
    if (isQuickReplyMessage) fbMessengerBotClient.sendQuickReplyMessage(fbUserId, sleepQuestionsMap[nextQuestionContext], constants.QUICK_REPLIES_YES_OR_NO);
    else fbMessengerBotClient.sendTextMessage(fbUserId, sleepQuestionsMap[nextQuestionContext]);
}

async function presentResultsForSleep(fbUserId) {
    await user.updateBotRequested(fbUserId, null);
    await user.setNotifiedSleepToTrue(fbUserId);
    await fbMessengerBotClient.sendTextMessage(fbUserId, 'Being stressed can ruin your sleep. My advice to you is to try some destressing techniques. Maybe even try yoga!');
}