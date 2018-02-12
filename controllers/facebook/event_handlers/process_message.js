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
backgroundQuestionsMap[constants.GET_UP] = 'At what time do you usually get up on a weekday? Please give your answer in 24-hour time format (i.e. HH:MM).';
backgroundQuestionsMap[constants.GO_TO_BED] = 'At what time do you usually go to bed on a weekday? Please give your answer in 24-hour time format (i.e. HH:MM).';
backgroundQuestionsMap[constants.ELECTRONICS] = 'Do you use your phone (or any other electronic devices) before going to bed (or in bed)?';
backgroundQuestionsMap[constants.STRESSED] = 'Are you stressed or worried about anything?';
backgroundQuestionsMap[constants.EAT] = 'Do you eat before going to bed?';
backgroundQuestionsMap[constants.ALCOHOL] = 'Do you drink alcohol before going to bed?';
backgroundQuestionsMap[constants.NICOTINE] = 'Do you take nicotine before going to bed?';
backgroundQuestionsMap[constants.CAFFEINE] = 'Do you drink any beverages with caffeine, such as tea, before going to bed?';
backgroundQuestionsMap[constants.LIGHTS] = 'Do you sleep with the lights on?';
backgroundQuestionsMap[constants.QUIET] = 'Is your bedroom quiet when you sleep?';
backgroundQuestionsMap[constants.EXERCISE] = 'Are you exercising regularly?';
backgroundQuestionsMap[constants.JOB] = 'Do you have a job?';
backgroundQuestionsMap[constants.WORK_SCHEDULE] = 'Is your work schedule irregular?';

var initialAdviceMap = {};
initialAdviceMap[constants.ELECTRONICS] = 'You should be avoiding the use of electronic devices before bedtime.';
initialAdviceMap[constants.STRESSED] = 'Stress can impact on your sleep. Try some relaxation techniques to de-stress.';
initialAdviceMap[constants.EAT] = 'You should avoid eating late, especially large heavy meals.';
initialAdviceMap[constants.ALCOHOL] = 'You should be avoiding alcohol and nicotine before going to bed.';
initialAdviceMap[constants.NICOTINE] = 'You should be avoiding alcohol and nicotine before going to bed.';
initialAdviceMap[constants.CAFFEINE] = 'You should be avoiding caffeine before going to bed.';
initialAdviceMap[constants.LIGHTS] = 'You should be sleeping with the lights off.';
initialAdviceMap[constants.QUIET] = 'You should make your bedroom as quiet as possible for sleeping.';
initialAdviceMap[constants.EXERCISE] = 'You should be exercising regularly.';
initialAdviceMap[constants.WORK_SCHEDULE] = 'Your irregular work schedule may be interferring with your sleep.';

const sleepQuestions = 
    [
        constants.NOTIFIED_SLEEP, constants.ELECTRONICS, constants.STRESSED, constants.EAT, constants.ALCOHOL, 
        constants.NICOTINE, constants.CAFFEINE, constants.LIGHTS, constants.QUIET
    ];
var sleepQuestionsMap = {};
sleepQuestionsMap[constants.ELECTRONICS] = 'Did you use your phone (or any other electronic devices) before going to bed (or in bed)?'; 
sleepQuestionsMap[constants.STRESSED] = 'Are you stressed or worried about anything?';
sleepQuestionsMap[constants.EAT] = 'Did you eat before going to bed?';
sleepQuestionsMap[constants.ALCOHOL] = 'Did you drink alcohol before going to bed?';
sleepQuestionsMap[constants.NICOTINE] = 'Did you take nicotine before going to bed?';
sleepQuestionsMap[constants.CAFFEINE] = 'Did you drink any beverages with caffeine, such as tea, before going to bed?';
sleepQuestionsMap[constants.LIGHTS] = 'Did you sleep with the lights on?';
sleepQuestionsMap[constants.QUIET] = 'Was your bedroom quiet when you went to sleep?';

var sleepAdviceMap = {};
sleepAdviceMap[constants.ELECTRONICS] = 'You should be avoiding the use of electronic devices before bedtime.';
sleepAdviceMap[constants.STRESSED] = 'Stress can impact on your sleep. Try some relaxation techniques to de-stress.';
sleepAdviceMap[constants.EAT] = 'You should avoid eating late, especially large heavy meals.';
sleepAdviceMap[constants.ALCOHOL] = 'You should be avoiding alcohol before going to bed.';
sleepAdviceMap[constants.NICOTINE] = 'You should be avoiding nicotine before going to bed.';
sleepAdviceMap[constants.CAFFEINE] = 'You should be avoiding caffeine before going to bed.';
sleepAdviceMap[constants.LIGHTS] = 'You should be sleeping with the lights off.';
sleepAdviceMap[constants.QUIET] = 'You should make your bedroom as quiet as possible for sleeping.';


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

        if (message === '!help') {
            var msg = 'I can assist you sleep related queries. You can ask about any of the following:' 
                        + '\n- your sleep last night'
                        + '\n- your sleep advice'
                        + '\n- general sleep advice'
                        + '\n- how something affects sleep (disturbances)'
                        + '\n- consequences of poor sleep';
            fbMessengerBotClient.sendTextMessage(fbUserId, msg);
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
                    /*await user.setMainContext(fbUserId, constants.GO_TO_BED);
                    await user.setSubContext(fbUserId, constants.QUESTION_ANSWER);
                    fbMessengerBotClient.sendTextMessage(fbUserId, backgroundQuestionsMap[constants.GO_TO_BED]);*/
                    await fbMessengerBotClient.sendTextMessage(fbUserId, 'Great. Let\'s begin.');
                    updateContextsAndAskNextQuestion(fbUserId, constants.GO_TO_BED, constants.QUESTION_ANSWER, false);
                } else {  
                    var msg = 'I would like to get an idea about your current sleep health. I only have a couple of questions, could you answer them first?';
                    fbMessengerBotClient.sendQuickReplyMessage(fbUserId, msg, constants.QUICK_REPLIES_YES_OR_NO);
                }
                break;
            case constants.GO_TO_BED:
                if (subContext === constants.QUESTION_ANSWER) {
                    if (timeRegex.test(message)) {
                        await userBackground.updateBackground(fbUserId, constants.GO_TO_BED, message);
                        var goToBedHour = dateAndTimeUtil.getHourFromTimeString(message);
                        if (goToBedHour >= 20 || goToBedHour === 0) { // acceptable go to bed hours
                            updateContextsAndAskNextQuestion(fbUserId, constants.BACKGROUND_GET_UP, constants.QUESTION_ANSWER, true);
                        } else {
                            await user.setSubContext(fbUserId, constants.LATE_GO_TO_BED_EXPECT_EXPLANATION);
                            if (goToBedHour < 3) fbMessengerBotClient.sendTextMessage(fbUserId, 'Why do you go to bed very late at night?');
                            else if (goToBedHour < 12) fbMessengerBotClient.sendTextMessage(fbUserId, 'Why do you go to bed in the morning?');
                            else if (goToBedHour < 18) fbMessengerBotClient.sendTextMessage(fbUserId, 'Why do you go to bed in the afternoon?');
                            else fbMessengerBotClient.sendTextMessage(fbUserId, 'Why do you go to bed early evening?');
                        }
                    } else {
                        repeatQuestion(fbUserId, backgroundQuestionsMap[constants.GO_TO_BED], false);
                    }
                } else if (subContext === constants.LATE_GO_TO_BED_EXPECT_EXPLANATION) {
                    await user.setSubContext(fbUserId, constants.FINISHED_OPTIONS);
                    var msg = 'I see but, depending on your situation, you should be going to bed between 8pm-12am.';
                    fbMessengerBotClient.sendQuickReplyMessage(fbUserId, msg, BUTTON_NEXT_QUESTION);
                } else if (subContext === constants.FINISHED_OPTIONS) {
                    if (message === constants.NEXT_QUESTION) {
                        updateContextsAndAskNextQuestion(fbUserId, constants.GET_UP, constants.QUESTION_ANSWER, false);
                    } else {
                        fbMessengerBotClient.sendQuickReplyMessage(fbUserId, 'Sorry, I didn\'t get that. Please press the button if you are ready for the next question.', BUTTON_NEXT_QUESTION);
                    }
                }
                break; 
            case constants.GET_UP:
                if (subContext === constants.QUESTION_ANSWER) {
                    if (timeRegex.test(message)) {
                        await userBackground.updateBackground(fbUserId, constants.GET_UP, message);
                        var getUpHour = dateAndTimeUtil.getHourFromTimeString(message);
                        if (getUpHour >= 6 && getUpHour < 9) {
                            updateContextsAndAskNextQuestion(fbUserId, constants.ELECTRONICS, constants.QUESTION_ANSWER, true);
                        } else {
                            await user.setSubContext(fbUserId, constants.LATE_WAKEUP_EXPECT_EXPLANATION);
                            if (getUpHour < 6) fbMessengerBotClient.sendTextMessage(fbUserId, 'Why do you very early in the morning?');
                            else if (getUpHour < 12) fbMessengerBotClient.sendTextMessage(fbUserId, 'Why do you get up late, in the morning?');
                            else if (getUpHour < 17) fbMessengerBotClient.sendTextMessage(fbUserId, 'Why do you get up late, in the afternoon?');
                            else fbMessengerBotClient.sendTextMessage(fbUserId, 'Why do you get up late, in the evening?');
                         } 
                    } else {
                        repeatQuestion(fbUserId, backgroundQuestionsMap[constants.GET_UP], false);
                    }
                } else if (subContext === constants.LATE_WAKEUP_EXPECT_EXPLANATION) {
                    await user.setSubContext(fbUserId, constants.FINISHED_OPTIONS);
                    var msg1 = 'I see but, depending on your situation, you should waking up between 6am-8am.';
                    var getUp = await userBackground.getGoToBed(fbUserId);
                    var goToBed = await userBackground.getGetUp(fbUserId);
                    var getUpHour = dateAndTimeUtil.getHourFromTimeString(getUp);
                    var goToBedHour = dateAndTimeUtil.getHourFromTimeString(goToBed);
                    var difference = Math.abs(getUpHour - goToBedHour) % 23;
                    var date1 = new Date(2018, 1, 1, getUpHour);
                    var date2 = new Date(2018, 1, 1, goToBedHour);
                    var diff = (new Date(date2 - date1)).getHours();
                    var msg2 = '';
                    var sleepEnough = true;
                    if (difference < 7 ) {
                        sleepEnough = false;
                        msg2 += 'You sleep for ' + difference + ' hours which is not enough. You should be sleeping for atleast 7-9 hours.'
                    }
                    if (sleepEnough === false) {
                        fbMessengerBotClient.sendTextMessage(fbUserId, msg1) ;
                        fbMessengerBotClient.sendQuickReplyMessage(fbUserId, msg2, BUTTON_NEXT_QUESTION);
                    } else {
                        fbMessengerBotClient.sendQuickReplyMessage(fbUserId, msg1, BUTTON_NEXT_QUESTION);
                    }
                } else if (subContext === constants.FINISHED_OPTIONS) {
                    if (message === constants.NEXT_QUESTION) {
                        updateContextsAndAskNextQuestion(fbUserId, constants.ELECTRONICS, constants.QUESTION_ANSWER, false);
                    }
                    else {
                        fbMessengerBotClient.sendQuickReplyMessage(fbUserId, 'Sorry, I didn\'t get that. Please press this button if you are ready for the next question.', BUTTON_NEXT_QUESTION);
                    }
                }
                break;            
            case constants.ELECTRONICS:
                handleBackgroundQuestionReply(fbUserId, event, message, constants.ELECTRONICS, constants.STRESSED, subContext);
                break;
            case constants.STRESSED:
                handleBackgroundQuestionReply(fbUserId, event, message, constants.STRESSED, constants.EAT, subContext);
                break;
            case constants.EAT:
                handleBackgroundQuestionReply(fbUserId, event, message, constants.EAT, constants.ALCOHOL, subContext);
                break;
            case constants.ALCOHOL:
                handleBackgroundQuestionReply(fbUserId, event, message, constants.ALCOHOL, constants.NICOTINE, subContext);
                break;   
            case constants.NICOTINE:
                handleBackgroundQuestionReply(fbUserId, event, message, constants.NICOTINE, constants.CAFFEINE, subContext);
                break;  
            case constants.CAFFEINE:
                handleBackgroundQuestionReply(fbUserId, event, message, constants.CAFFEINE, constants.LIGHTS, subContext);
                break; 
            case constants.LIGHTS:
                handleBackgroundQuestionReply(fbUserId, event, message, constants.LIGHTS, constants.QUIET, subContext);
                break;     
            case constants.QUIET:
                handleBackgroundQuestionReply(fbUserId, event, message, constants.QUIET, constants.EXERCISE, subContext);
                break;  
            case constants.EXERCISE:
                if (subContext === constants.QUESTION_ANSWER) {
                    if (message === 'yes' || message === 'no') {
                        await userBackground.updateBackground(fbUserId, constants.EXERCISE, message);
                        if (message === 'no') {
                            await user.setSubContext(fbUserId, constants.QUESTION_ANSWER_DONE);
                            fbMessengerBotClient.sendQuickReplyMessage(fbUserId, initialAdviceMap[constants.EXERCISE], BUTTONS_WHY_AND_NEXT_QUESTION);
                        } else {
                            updateContextsAndAskNextQuestion(fbUserId, constants.JOB, constants.QUESTION_ANSWER, true);
                        }
                    } else {           
                        repeatQuestion(fbUserId, backgroundQuestionsMap[constants.EXERCISE], true);
                    }
                } else if (subContext === constants.QUESTION_ANSWER_DONE) {
                    if (message === 'why') {
                        var explanationArray = await factor.getExplanation(constants.EXERCISE);
                        if (explanationArray.length === 1) {
                            await user.setSubContext(fbUserId, constants.FINISHED_OPTIONS);
                            fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[0], BUTTON_NEXT_QUESTION);
                        } else {
                            await user.setSubContext(fbUserId, constants.MORE_INFO);
                            fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[0], getButtonsForMoreInfo(constants.EXERCISE, 0));
                        }
                    } else if (message === constants.NEXT_QUESTION) {
                        updateContextsAndAskNextQuestion(fbUserId, constants.JOB, constants.QUESTION_ANSWER, true);
                    } else {
                        fbMessengerBotClient.sendQuickReplyMessage(fbUserId, 'Sorry, I didn\'t get that. Please choose an option.', BUTTONS_WHY_AND_NEXT_QUESTION);
                    }
                } else if (subContext === constants.MORE_INFO) {
                        if(message === 'more') {
                            var explanationNumber = parseInt(event.message.quick_reply.payload.split(' ')[2]);
                            var explanationArray = await factor.getExplanation(constants.EXERCISE);
                            var nextExplanation = explanationNumber+1;
                            if (nextExplanation >= explanationArray.length-1) {    
                                await user.setSubContext(fbUserId, constants.FINISHED_OPTIONS);   
                                fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[nextExplanation], BUTTON_NEXT_QUESTION);
                            } else {
                                fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[nextExplanation], getButtonsForMoreInfo(constants.EXERCISE, nextExplanation));
                            }
                        } else if (message === constants.NEXT_QUESTION) {
                            updateContextsAndAskNextQuestion(fbUserId, constants.JOB, constants.QUESTION_ANSWER, true);
                        } else {
                            fbMessengerBotClient.sendQuickReplyMessage(fbUserId, 'Sorry, I didn\'t get that. Please press this button if you are ready for the next question.', BUTTON_NEXT_QUESTION);
                        }
                } else if (subContext === constants.FINISHED_OPTIONS) {
                    if (message === constants.NEXT_QUESTION) updateContextsAndAskNextQuestion(fbUserId, constants.JOB, constants.QUESTION_ANSWER, true);
                    else fbMessengerBotClient.sendQuickReplyMessage(fbUserId, 'Sorry, I didn\'t get that. Please press this button if you are ready for the next question.', BUTTON_NEXT_QUESTION);
                } 
                break; 
            case constants.JOB:
                if (message === 'yes' || message === 'no') {
                    await userBackground.updateBackground(fbUserId, constants.JOB, message);
                    if (message === 'yes') {
                        await user.updateUser(fbUserId, { mainContext: constants.WORK_SCHEDULE });
                        fbMessengerBotClient.sendQuickReplyMessage(fbUserId, backgroundQuestionsMap[constants.WORK_SCHEDULE], constants.QUICK_REPLIES_YES_OR_NO);
                    } else { 
                        finishSleepBackgroundChat(fbUserId, false);
                    }
                } else { 
                    repeatQuestion(fbUserId, backgroundQuestionsMap[constants.JOB], true);
                }
                break;
            case constants.WORK_SCHEDULE:
                if (message === 'yes' || message === 'no') {
                    await userBackground.updateBackground(fbUserId, constants.WORK_SCHEDULE, message);
                    finishSleepBackgroundChat(fbUserId, true);
                } else { 
                    repeatQuestion(fbUserId, backgroundQuestionsMap[contants.WORK_SCHEDULE], true);
                }
                break;
            default:
                break;
        }
    } catch (err) {
        console.log('[ERROR]', err);
    }     
}

async function finishSleepBackgroundChat(fbUserId, hasIrregularWorkSchedule) {
    if (hasIrregularWorkSchedule) await fbMessengerBotClient.sendTextMessage(fbUserId, initialAdviceMap[constants.WORK_SCHEDULE]);
    var msg1 = 'That was the last question. Thank you for answering my questions, they will be useful in helping me analyse your sleep in the future!';
    var msg2 = 'Feel free to ask me questions about sleep! If you need a reminder of what I can assist you with, just type !help';
    await fbMessengerBotClient.sendTextMessage(fbUserId, msg1);
    fbMessengerBotClient.sendTextMessage(fbUserId, msg2);
}

async function handleBackgroundQuestionReply(fbUserId, event, message, currentMainContext, nextMainContext, subContext) {
    if (subContext === constants.QUESTION_ANSWER) {
        if (message === 'yes' || message === 'no') {
            await userBackground.updateBackground(fbUserId, currentMainContext, message);
            if (message === 'yes') {
                await user.setSubContext(fbUserId, constants.QUESTION_ANSWER_DONE);
                fbMessengerBotClient.sendQuickReplyMessage(fbUserId, initialAdviceMap[currentMainContext], BUTTONS_WHY_AND_NEXT_QUESTION);
            } else {
                updateContextsAndAskNextQuestion(fbUserId, nextMainContext, constants.QUESTION_ANSWER, true);
            }
        } else {
            repeatQuestion(fbUserId, backgroundQuestionsMap[currentMainContext], true);
        }
    } else if (subContext === constants.QUESTION_ANSWER_DONE) {
        if (message === 'why') {
            var explanationArray = await factor.getExplanation(currentMainContext);
            if (explanationArray.length === 1) {
                await user.setSubContext(fbUserId, constants.FINISHED_OPTIONS);
                fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[0], BUTTON_NEXT_QUESTION);
            } else {
                await user.setSubContext(fbUserId, constants.MORE_INFO);
                fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[0], getButtonsForMoreInfo(currentMainContext, 0));
            }
        } else if (message === constants.NEXT_QUESTION) {
            updateContextsAndAskNextQuestion(fbUserId, nextMainContext, constants.QUESTION_ANSWER, true);
        } else {
            fbMessengerBotClient.sendQuickReplyMessage(fbUserId, 'Sorry, I didn\'t get that. Please choose an option.', BUTTONS_WHY_AND_NEXT_QUESTION);
        }
    } else if (subContext === constants.MORE_INFO) {
            if(message === 'more') {
                var explanationNumber = parseInt(event.message.quick_reply.payload.split(' ')[2]);
                var explanationArray = await factor.getExplanation(currentMainContext);
                var nextExplanation = explanationNumber+1;
                if (nextExplanation >= explanationArray.length-1) {    
                    await user.setSubContext(fbUserId, constants.FINISHED_OPTIONS);   
                    fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[nextExplanation], BUTTON_NEXT_QUESTION);
                } else {
                    fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[nextExplanation], getButtonsForMoreInfo(currentMainContext, nextExplanation));
                }
            } else if (message === constants.NEXT_QUESTION) {
                updateContextsAndAskNextQuestion(fbUserId, nextMainContext, constants.QUESTION_ANSWER, true);
            } else {
                fbMessengerBotClient.sendQuickReplyMessage(fbUserId, 'Sorry, I didn\'t get that. Please press this button if you are ready for the next question.', BUTTON_NEXT_QUESTION);
            }
    } else if (subContext === constants.FINISHED_OPTIONS) {
        if (message === constants.NEXT_QUESTION) updateContextsAndAskNextQuestion(fbUserId, nextMainContext, constants.QUESTION_ANSWER, true);
        else fbMessengerBotClient.sendQuickReplyMessage(fbUserId, 'Sorry, I didn\'t get that. Please press this button if you are ready for the next question.', BUTTON_NEXT_QUESTION);
    } 
}

async function repeatQuestion(fbUserId, questionText, quickReplyMessage) {
    await fbMessengerBotClient.sendTextMessage(fbUserId, 'Sorry, I didn\'t get that. Let\'s try again.');
    if (quickReplyMessage) fbMessengerBotClient.sendQuickReplyMessage(fbUserId, questionText, constants.QUICK_REPLIES_YES_OR_NO);
    else fbMessengerBotClient.sendTextMessage(fbUserId, questionText);
}

async function chatAboutSleep(fbUserId, message, mainContext) {
    try {
        switch (mainContext) {
            case constants.NOTIFIED_SLEEP:
                if (message === 'yes') {
                    await fbMessengerBotClient.sendTextMessage(fbUserId, 'Great. I have a few questions for you.');
                    await user.setMainContext(fbUserId, constants.SLEEP_ELECTRONICS);
                    fbMessengerBotClient.sendQuickReplyMessage(fbUserId, sleepQuestionsMap[constants.ELECTRONICS], constants.QUICK_REPLIES_YES_OR_NO);
                } else {  
                    var msg = 'Sorry but it\'s important that we find out why you had a sleep disturbance. Please may we proceed?';
                    fbMessengerBotClient.sendQuickReplyMessage(fbUserId, msg, constants.QUICK_REPLIES_YES_OR_NO);
                }
                break;
            case constants.ELECTRONICS:
                handleSleepQuestionReply(fbUserId, event, message, constants.ELECTRONICS, constants.STRESSED, subContext);
                break;
            case constants.STRESSED:
                handleSleepQuestionReply(fbUserId, event, message, constants.STRESSED, constants.EAT, subContext);
                break;
            case constants.EAT:
                handleSleepQuestionReply(fbUserId, event, message, constants.ELECTRONICS, constants.ALCOHOL, subContext);
                break;
            case constants.ALCOHOL:
                handleSleepQuestionReply(fbUserId, event, message, constants.ALCOHOL, constants.NICOTINE, subContext);
                break;
            case constants.NICOTINE:
                handleSleepQuestionReply(fbUserId, event, message, constants.NICOTINE, constants.CAFFEINE, subContext);
                break;
            case constants.CAFFEINE:
                handleSleepQuestionReply(fbUserId, event, message, constants.CAFFEINE, constants.LIGHTS, subContext);
                break;
            case constants.LIGHTS:
                handleSleepQuestionReply(fbUserId, event, message, constants.LIGHTS, constants.STRESSED, subContext);
                break;
            case constants.QUIET:
                if (message === 'yes' || message === 'no') {
                    await userSleepAnswers.updateSleepAnswer(fbUserId, constants.QUIET, message);
                    await user.setMainContext(fbUserId, null);
                    presentResultsForSleep(fbUserId);
                } else { 
                    repeatQuestion(fbUserId, sleepQuestionsMap[constants.QUIET], true);
                }
                break;
            default:
                break;
        }
    } catch (err) {
        console.log('[ERROR]', err);
    }
}

async function handleSleepQuestionReply(fbUserId, event, message, currentMainContext, nextMainContext, subContext) {
    if (subContext === constants.QUESTION_ANSWER) {
        if (message === 'yes' || message === 'no') {
            await userBackground.updateBackground(fbUserId, currentMainContext, message);
            if (message === 'yes') {
                await user.setSubContext(fbUserId, constants.QUESTION_ANSWER_DONE);
                fbMessengerBotClient.sendQuickReplyMessage(fbUserId, sleepAdviceMap[currentMainContext], BUTTONS_WHY_AND_NEXT_QUESTION);
            } else {
                updateContextsAndAskNextSleepQuestion(fbUserId, nextMainContext, constants.QUESTION_ANSWER, true);
            }
        } else {
            repeatQuestion(fbUserId, sleepQuestionsMap[currentMainContext], true);
        }
    } else if (subContext === constants.QUESTION_ANSWER_DONE) {
        if (message === 'why') {
            var explanationArray = await factor.getExplanation(currentMainContext);
            if (explanationArray.length === 1) {
                await user.setSubContext(fbUserId, constants.FINISHED_OPTIONS);
                fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[0], BUTTON_NEXT_QUESTION);
            } else {
                await user.setSubContext(fbUserId, constants.MORE_INFO);
                fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[0], getButtonsForMoreInfo(currentMainContext, 0));
            }
        } else if (message === constants.NEXT_QUESTION) {
            updateContextsAndAskNextSleepQuestion(fbUserId, nextMainContext, constants.QUESTION_ANSWER, true);
        } else {
            fbMessengerBotClient.sendQuickReplyMessage(fbUserId, 'Sorry, I didn\'t get that. Please choose an option.', BUTTONS_WHY_AND_NEXT_QUESTION);
        }
    } else if (subContext === constants.MORE_INFO) {
            if(message === 'more') {
                var explanationNumber = parseInt(event.message.quick_reply.payload.split(' ')[2]);
                var explanationArray = await factor.getExplanation(currentMainContext);
                var nextExplanation = explanationNumber+1;
                if (nextExplanation >= explanationArray.length-1) {    
                    await user.setSubContext(fbUserId, constants.FINISHED_OPTIONS);   
                    fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[nextExplanation], BUTTON_NEXT_QUESTION);
                } else {
                    fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[nextExplanation], getButtonsForMoreInfo(currentMainContext, nextExplanation));
                }
            } else if (message === constants.NEXT_QUESTION) {
                updateContextsAndAskNextSleepQuestion(fbUserId, nextMainContext, constants.QUESTION_ANSWER, true);
            } else {
                fbMessengerBotClient.sendQuickReplyMessage(fbUserId, 'Sorry, I didn\'t get that. Please press this button if you are ready for the next question.', BUTTON_NEXT_QUESTION);
            }
    } else if (subContext === constants.FINISHED_OPTIONS) {
        if (message === constants.NEXT_QUESTION) updateContextsAndAskNextSleepQuestion(fbUserId, nextMainContext, constants.QUESTION_ANSWER, true);
        else fbMessengerBotClient.sendQuickReplyMessage(fbUserId, 'Sorry, I didn\'t get that. Please press this button if you are ready for the next question.', BUTTON_NEXT_QUESTION);
    } 
}

async function updateSleepAnswersandAskNextQuestion(fbUserId, mainContext, message, nextQuestion, isQuickReplyMessage) {
    await userSleepAnswers.updateSleepAnswer(fbUserId, mainContext, message);
    await user.setMainContext(fbUserId, nextQuestion);
    if (isQuickReplyMessage) fbMessengerBotClient.sendQuickReplyMessage(fbUserId, sleepQuestionsMap[nextQuestion], constants.QUICK_REPLIES_YES_OR_NO);
    else fbMessengerBotClient.sendTextMessage(fbUserId, sleepQuestionsMap[nextQuestion]);
}

async function updateContextsAndAskNextSleepQuestion(fbUserId, mainContext, subContext, isQuickReplyMessage) {
    await user.setMainContext(fbUserId, mainContext);
    await user.setSubContext(fbUserId, subContext);
    if (isQuickReplyMessage) fbMessengerBotClient.sendQuickReplyMessage(fbUserId, sleepQuestionsMap[mainContext], constants.QUICK_REPLIES_YES_OR_NO);
    else fbMessengerBotClient.sendTextMessage(fbUserId, sleepQuestionsMap[mainContext]);
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

async function updateContextsAndAskNextQuestion(fbUserId, mainContext, subContext, isQuickReplyMessage) {
    await user.setMainContext(fbUserId, mainContext);
    await user.setSubContext(fbUserId, subContext);
    if (isQuickReplyMessage) fbMessengerBotClient.sendQuickReplyMessage(fbUserId, backgroundQuestionsMap[mainContext], constants.QUICK_REPLIES_YES_OR_NO);
    else fbMessengerBotClient.sendTextMessage(fbUserId, backgroundQuestionsMap[mainContext]);
}