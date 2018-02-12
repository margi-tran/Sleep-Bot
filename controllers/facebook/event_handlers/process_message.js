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

const BUTTONS_WHY_AND_NEXT_QUESTION = 
    [{
        "content_type": "text",
        "title": "why",
        "payload": "why"
    },
    {
        "content_type": "text",
        "title": "next question",
        "payload": "next question"
    }];

const BUTTONS_MORE_AND_NEXT_QUESTION = 
    [{
        "content_type": "text",
        "title": "more",
        "payload": "more"
    },
    {
        "content_type": "text",
        "title": "next question",
        "payload": "next question"
    }];

const BUTTON_NEXT_QUESTION = 
    [{
        "content_type": "text",
        "title": "next question",
        "payload": "next question"
    }];

module.exports = async (event) => {
    try { 
        const fbUserId = event.sender.id;
        var message = event.message.text.toLowerCase();
        await fbMessengerBotClient.markSeen(fbUserId);
        await messengerBotClient.sendSenderAction(fbUserId, 'typing_on');

        const mainContext = await user.getMainContext(fbUserId);
        const userIsNew = await user.isUserNew(fbUserId);
        // Get background sleep information from new user
        if (userIsNew) {
            getNewUserBackground(fbUserId, message, event, mainContext);
            return;
        }

        // 'Interview' user about their sleep
        if (sleepQuestions.includes(mainContext)) {
            chatAboutSleep(fbUserId, message, mainContext);
            return;
        }

        if (event.hasOwnProperty('message')) {
            if (event.message.hasOwnProperty('quick_reply')) {
                if (event.message.quick_reply.hasOwnProperty('payload')) {
                    var payloadStringSplit = event.message.quick_reply.payload.split(' ');
                    var context = payloadStringSplit[0];

                    // The user has asked a question about the effect of a factor on sleep
                    if (context === 'FACTORS') {
                        var factorParameter = payloadStringSplit[1];
                        var explanationNumber = parseInt(payloadStringSplit[2]);
                        var explanationArray = await factor.getExplanation(factorParameter);
                        
                        var nextExplanation = explanationNumber+1;
                        if(nextExplanation >= explanationArray.length-1)                    
                            fbMessengerBotClient.sendTextMessage(fbUserId, explanationArray[nextExplanation]);
                        else 
                            fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[nextExplanation], getButtonsForFactorsReply(factorParameter, nextExplanation));
                        return;
                    }
                }
            }
        }
            
        const apiaiResponse = await apiaiClient.textRequest(message, { sessionId: fbUserId });
        const intent = apiaiResponse.result.metadata.intentName;
        const parameters = apiaiResponse.result.parameters;
        if (intent === constants.INTENT_EFFECTS_OF_FACTORS) {
            if(parameters.factors === '') {
                var msg = 'Sorry, I didn\'t quite get that. I can tell how the following affect your sleep:\n- alcohol\n- nicotine'
                            + '\n- electronic devices\n- stress\n- eating before bed\n- caffeine\n- noise\n- exercise\n- sleeping with the lights on'
                fbMessengerBotClient.sendTextMessage(fbUserId, msg);
                return;
            }
            var factorParameter = parameters.factors;
            var explanationArray = await factor.getExplanation(factorParameter);
            if (explanationArray.length === 1) 
                fbMessengerBotClient.sendTextMessage(fbUserId, explanationArray[0]);
             else 
                fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[0], getButtonsForFactorsReply(factorParameter, 0));
        } else { 
            // Default apiai filler response or smalltalk response
            fbMessengerBotClient.sendTextMessage(fbUserId, apiaiResponse.result.fulfillment.speech);
        }
    } catch (err) {
        console.log('[ERROR]', err);
    } 
};

async function getNewUserBackground(fbUserId, message, event, mainContext) {
    const subContext = await user.getSubContext(fbUserId);
    try {
        // The following regex was by Peter O. and it was taken from https://stackoverflow.com/questions/7536755/regular-expression-for-matching-hhmm-time-format
        const timeRegex = RegExp(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/);

        // Check whether the bot asked anything from the user, if this is the case, then the bot is expecting a reply
        switch (mainContext) {
            case constants.FITBIT_AUTH:
                var msg = 'You haven\'t given me permission to access your Fitbit yet. Please do that first before we proceed with anything else.';
                                + 'To do so click on the following link:\nhttps://calm-scrubland-31682.herokuapp.com/prepare_fitbit_auth?fbUserId='
                                + fbUserId;
                fbMessengerBotClient.sendTextMessage(fbUserId, msg);
                break;
            case constants.BACKGROUND_QUESTIONS:
                if (message === 'yes') {
                    await user.setMainContext(fbUserId, constants.BACKGROUND_GET_UP);
                    await user.setSubContext(fbUserId, constants.QUESTION_ANSWER);
                    await fbMessengerBotClient.sendTextMessage(fbUserId, 'Great. Let\'s begin.');
                    fbMessengerBotClient.sendTextMessage(fbUserId, backgroundQuestionsMap[constants.BACKGROUND_GET_UP]);
                } else {  
                    var msg = 'I would like to get an idea about your current sleep health. I only have a couple of questions, could you answer them first?';
                    fbMessengerBotClient.sendQuickReplyMessage(fbUserId, msg, constants.QUICK_REPLIES_YES_OR_NO);
                }
                break;
            case constants.BACKGROUND_GET_UP:
                if (subContext === constants.QUESTION_ANSWER) {
                    if (timeRegex.test(message)) {
                        await userBackground.updateBackground(fbUserId, constants.GET_UP, message);
                        var getUpHour = dateAndTimeUtil.getHourFromTimeString(message);
                         if (getUpHour < 6 || getUpHour > 10) { // unacceptable get up hours
                            await user.setSubContext(fbUserId, constants.LATE_WAKEUP_EXPECT_EXPLANATION);
                            if (getUpHour < 6) fbMessengerBotClient.sendTextMessage(fbUserId, 'Why do you very early in the morning?');
                            if (getUpHour < 12) fbMessengerBotClient.sendTextMessage(fbUserId, 'Why do you get up late, in the morning?');
                            else if (getUpHour < 17) fbMessengerBotClient.sendTextMessage(fbUserId, 'Why do you get up late, in the afternoon?');
                            else fbMessengerBotClient.sendTextMessage(fbUserId, 'Why do you get up late, in the evening?');
                         } else {
                            updateContextsAndAskNextQuestion(fbUserId, constants.BACKGROUND_GO_TO_BED, constants.QUESTION_ANSWER, constants.BACKGROUND_GO_TO_BED, true);
                         }
                    } else {
                        repeatQuestion(fbUserId, backgroundQuestionsMap[constants.BACKGROUND_GET_UP], false);
                    }
                } else if (subContext === constants.LATE_WAKEUP_EXPECT_EXPLANATION) {
                    await user.setSubContext(fbUserId, constants.FINISHED_OPTIONS);
                    fbMessengerBotClient.sendQuickReplyMessage(fbUserId, 'late wakeup aint good', BUTTON_NEXT_QUESTION);
                } else if (subContext === constants.FINISHED_OPTIONS) {
                    if (message === constants.NEXT_QUESTION) updateContextsAndAskNextQuestion(fbUserId, constants.BACKGROUND_GO_TO_BED, constants.QUESTION_ANSWER, constants.BACKGROUND_GO_TO_BED, false);
                    else fbMessengerBotClient.sendQuickReplyMessage(fbUserId, 'Sorry, I didn\'t get that. Please touch this button if you are ready for the next question.', BUTTON_NEXT_QUESTION);
                }
                break;
            case constants.BACKGROUND_GO_TO_BED:
                if (subContext === constants.QUESTION_ANSWER) {
                    if (timeRegex.test(message)) {
                        await userBackground.updateBackground(fbUserId, constants.GO_TO_BED, message);
                        var goToBedHour = dateAndTimeUtil.getHourFromTimeString(message);
                        if (goToBedHour >= 20 || goToBedHour === 0) { // acceptable go to bed hours
                            updateContextsAndAskNextQuestion(fbUserId, constants.BACKGROUND_ELECTRONICS, constants.QUESTION_ANSWER, constants.BACKGROUND_ELECTRONICS, true);
                        } else {
                            await user.setSubContext(fbUserId, constants.LATE_GO_TO_BED_EXPECT_EXPLANATION);
                            if (goToBedHour < 3) fbMessengerBotClient.sendTextMessage(fbUserId, 'Why do you go to bed very late at night?');
                            else if (goToBedHour < 12) fbMessengerBotClient.sendTextMessage(fbUserId, 'Why do you go to bed in the morning?');
                            else if (goToBedHour < 18) fbMessengerBotClient.sendTextMessage(fbUserId, 'Why do you go to bed in the afternoon?');
                            else fbMessengerBotClient.sendTextMessage(fbUserId, 'Why do you go to bed early evening?');
                        }
                    } else {
                        repeatQuestion(fbUserId, backgroundQuestionsMap[constants.BACKGROUND_GO_TO_BED], false);
                    }
                } else if (subContext === constants.LATE_GO_TO_BED_EXPECT_EXPLANATION) {
                    await user.setSubContext(fbUserId, constants.FINISHED_OPTIONS);
                    fbMessengerBotClient.sendQuickReplyMessage(fbUserId, 'going to bed at these times are not good', BUTTON_NEXT_QUESTION);
                } else if (subContext === constants.FINISHED_OPTIONS) {
                    if (message === constants.NEXT_QUESTION) {
                        updateContextsAndAskNextQuestion(fbUserId, constants.BACKGROUND_ELECTRONICS, constants.QUESTION_ANSWER, constants.BACKGROUND_ELECTRONICS, true);
                    } else {
                        fbMessengerBotClient.sendQuickReplyMessage(fbUserId, 'Sorry, I didn\'t get that. Please touch the button if you are ready for the next question.', BUTTON_NEXT_QUESTION);
                    }
                }
                break;             
            case constants.BACKGROUND_ELECTRONICS:
                if (subContext === constants.QUESTION_ANSWER) {
                    if (message === 'yes' || message === 'no') {
                        await userBackground.updateBackground(fbUserId, constants.ELECTRONICS, message);
                        if (message === 'yes') {
                            var msg = 'You should not be using electronics before bedtime.';
                            await user.setSubContext(fbUserId, constants.QUESTION_ANSWER_DONE);
                            fbMessengerBotClient.sendQuickReplyMessage(fbUserId, msg, BUTTONS_WHY_AND_NEXT_QUESTION);
                        } else {
                            updateContextsAndAskNextQuestion(fbUserId, constants.BACKGROUND_STRESSED, constants.QUESTION_ANSWER, constants.BACKGROUND_STRESSED, true);
                        }
                    } else {
                        repeatQuestion(fbUserId, backgroundQuestionsMap[constants.BACKGROUND_ELECTRONICS], true);
                    }
                } else if (subContext === constants.QUESTION_ANSWER_DONE) {
                    if (message === 'why') {
                        var explanationArray = await factor.getExplanation(constants.ELECTRONICS);
                        if (explanationArray.length === 1) {
                            await user.setSubContext(fbUserId, constants.FINISHED_OPTIONS);
                            fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[0], BUTTON_NEXT_QUESTION);
                        }
                        else {
                            await user.setSubContext(fbUserId, constants.MORE_INFO);
                            fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[0], getButtonsForMoreInfo(constants.ELECTRONICS, 0));
                        }
                    } else if (message === constants.NEXT_QUESTION) {
                        updateContextsAndAskNextQuestion(fbUserId, constants.BACKGROUND_STRESSED, constants.QUESTION_ANSWER, constants.BACKGROUND_STRESSED, true);
                    } else {
                        fbMessengerBotClient.sendQuickReplyMessage(fbUserId, 'Sorry, I didn\'t get that. Please choose an option.', BUTTONS_WHY_AND_NEXT_QUESTION);
                    }
                } else if (subContext === constants.MORE_INFO) {
                        if(message === 'more') {
                            var explanationNumber = parseInt(event.message.quick_reply.payload.split(' ')[2]);
                            var explanationArray = await factor.getExplanation(constants.ELECTRONICS);
                            var nextExplanation = explanationNumber+1;
                            if (nextExplanation >= explanationArray.length-1) {    
                                await user.setSubContext(fbUserId, constants.FINISHED_OPTIONS);   
                                fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[nextExplanation], BUTTON_NEXT_QUESTION);
                            } else {
                                fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[nextExplanation], getButtonsForMoreInfo(constants.ELECTRONICS, nextExplanation));
                            }
                        } else if (message === constants.NEXT_QUESTION) {
                            updateContextsAndAskNextQuestion(fbUserId, constants.BACKGROUND_STRESSED, constants.QUESTION_ANSWER, constants.BACKGROUND_STRESSED, true);
                        } else {
                            fbMessengerBotClient.sendQuickReplyMessage(fbUserId, 'Sorry, I didn\'t get that. Please touch this button if you are ready for the next question.', BUTTONS_NEXT_QUESTION);
                        }
                } else if (subContext === constants.FINISHED_OPTIONS) {
                    if (message === constants.NEXT_QUESTION) updateContextsAndAskNextQuestion(fbUserId, constants.BACKGROUND_STRESSED, constants.QUESTION_ANSWER, constants.BACKGROUND_STRESSED, true);
                    else fbMessengerBotClient.sendQuickReplyMessage(fbUserId, 'Sorry, I didn\'t get that. Please touch this button if you are ready for the next question.', BUTTONS_NEXT_QUESTION);
                } 
                break;
            case constants.BACKGROUND_STRESSED:
                if (subContext === constants.QUESTION_ANSWER) {
                    fbMessengerBotClient.sendTextMessage(fbUserId, 'heehe');
                }
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
                        await user.updateUser(fbUserId, { mainContext: constants.BACKGROUND_WORK_SCHEDULE });
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

async function updateBackgroundandAskNextQuestion(fbUserId, mainContext, message, nextQuestion, isQuickReplyMessage) {
    await userBackground.updateBackground(fbUserId, mainContext, message);
    await user.setMainContext(fbUserId, nextQuestion);
    if (isQuickReplyMessage) fbMessengerBotClient.sendQuickReplyMessage(fbUserId, backgroundQuestionsMap[nextQuestion], constants.QUICK_REPLIES_YES_OR_NO);
    else fbMessengerBotClient.sendTextMessage(fbUserId, backgroundQuestionsMap[nextQuestion]);
}

async function presentResultsForBackground(fbUserId, hasIrregularWorkSchedule) {
    await user.setMainContext(fbUserId, null);
    await user.updateUserIsNew(fbUserId, false);
    await user.setNotifiedSleepToFalse(fbUserId);

    await fbMessengerBotClient.sendTextMessage(fbUserId, 'Thank you. That\'s all my questions.');
    var advice = '';
    var getUp = await userBackground.getGoToBed(fbUserId);
    var goToBed = await userBackground.getGetUp(fbUserId);
    var getUpHour = dateAndTimeUtil.getHourFromTimeString(getUp);
    var goToBedHour = dateAndTimeUtil.getHourFromTimeString(goToBed);
    var difference = Math.abs(getUpHour - goToBedHour) % 23;
    var date1 = new Date(2018, 1, 1, getUpHour);
    var date2 = new Date(2018, 1, 1, goToBedHour);
    var diff = (new Date(date2 - date1)).getHours();
    var sleepEnough = false;
    if(difference >= 7) {
        sleepEnough = true;
    } else if (difference < 7 ) {
        advice += '\n- You sleep for ' + difference + ' hours which is not enough. You should be sleeping for at least 7-8 hours.'
    }

    var advice = '';
    
    var answers = await userBackground.getBackground(fbUserId);
    if (answers.electronics === 'yes') advice += '\n- You should avoid electronic devices before sleeping.';
    if (answers.stressed === 'yes') advice += '\n- Stress can impact on your sleep';
    if (answers.eat === 'yes') advice += '\n- You should avoid eating late.';
    if (answers.alcohol_nicotine === 'yes') advice += '\n- You should avoid alcohol and nicotine before going to bed.'
    if (answers.caffeine === 'yes') advice += '\n- You should avoid caffeine before going to bed.'
    if (answers.lights === 'yes') advice += '\n- You should sleep with the lights off.'
    if (answers.quiet === 'yes') advice += '\n- You should make your bedroom as quiet as possible for sleeping.'
    if (answers.exercise === 'yes') advice += '\n- You should be exercising regularly.'
    if (answers.work_schedule === 'yes') advice+= '\n- Your irregular work schedule may be interferring with your sleep.';

    console.log('answers: ', answers);
    var pre = 'Based on your answers, I can see a few things that are possibly causing you to wake up in the middle of the night:';
        await fbMessengerBotClient.sendTextMessage(fbUserId, pre+advice);
    if (advice !== '') {
        var pre = 'Based on your answers, I can see a few things that are possibly causing you to wake up in the middle of the night:';
        await fbMessengerBotClient.sendTextMessage(fbUserId, pre+advice);
    } else if(sleepEnough === true) {
        await fbMessengerBotClient.sendTextMessage(fbUserId, 'Based on your answers, there does not seem to be anything concerning. It seems your are getting enough sleep each night without any disturbances.');
    }
    await fbMessengerBotClient.sendTextMessage('That\'s it from me for now.');
    await fbMessengerBotClient.sendTextMessage('If you have any questions about how something affects sleep feel free to ask me.');
}

async function chatAboutSleep(fbUserId, message, mainContext) {
    try {
        switch (mainContext) {
            case constants.NOTIFIED_SLEEP:
                if (message === 'yes') {
                    await fbMessengerBotClient.sendTextMessage(fbUserId, 'Great. I have a few questions for you.');
                    await user.setMainContext(fbUserId, constants.SLEEP_ELECTRONICS);
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
                    await user.setMainContext(fbUserId, null);
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

async function updateSleepAnswersandAskNextQuestion(fbUserId, mainContext, message, nextQuestion, isQuickReplyMessage) {
    await userSleepAnswers.updateSleepAnswer(fbUserId, mainContext, message);
    await user.setMainContext(fbUserId, nextQuestion);
    if (isQuickReplyMessage) fbMessengerBotClient.sendQuickReplyMessage(fbUserId, sleepQuestionsMap[nextQuestion], constants.QUICK_REPLIES_YES_OR_NO);
    else fbMessengerBotClient.sendTextMessage(fbUserId, sleepQuestionsMap[nextQuestion]);
}

async function presentResultsForSleep(fbUserId) {
    await user.setMainContext(fbUserId, null);
    await user.setNotifiedSleepToTrue(fbUserId);
    await fbMessengerBotClient.sendTextMessage(fbUserId, 'Being stressed can ruin your sleep. My advice to you is to try some destressing techniques. Maybe even try yoga!');
}

function getButtonsForFactorsReply(factor, index) {
    var buttons = 
        [{
            "content_type": "text",
            "title": "more",
            "payload": 'FACTORS ' + factor + ' ' + index
        }];
    return buttons;
}

function getButtonsForMoreInfo(factor, index) {
    var buttons = 
        [{
            "content_type": "text",
            "title": "more",
            "payload": 'FACTORS ' + factor + ' ' + index
        },
        {
            "content_type": "text",
            "title": "next question",
            "payload": "next question"
        }];
    return buttons;
}

async function updateContextsAndAskNextQuestion(fbUserId, mainContext, subContext, constant, isQuickReplyMessage) {
    await user.setMainContext(fbUserId, mainContext);
    await user.setSubContext(fbUserId, subContext);
    if (isQuickReplyMessage) fbMessengerBotClient.sendQuickReplyMessage(fbUserId, backgroundQuestionsMap[constant], constants.QUICK_REPLIES_YES_OR_NO);
    else fbMessengerBotClient.sendTextMessage(fbUserId, backgroundQuestionsMap[constant]);
}