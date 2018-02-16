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
var sleep = require('../../../models/sleep');

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
backgroundQuestionsMap[constants.NICOTINE] = 'Do you smoke (or take nicotine) before going to bed?';
backgroundQuestionsMap[constants.CAFFEINE] = 'Do you drink any beverages with caffeine, such as tea, before going to bed?';
backgroundQuestionsMap[constants.LIGHTS] = 'Do you sleep with the lights on?';
backgroundQuestionsMap[constants.QUIET] = 'Is your bedroom quiet when you sleep?';
backgroundQuestionsMap[constants.EXERCISE] = 'Are you exercising regularly?';
backgroundQuestionsMap[constants.JOB] = 'Do you have a job?';
backgroundQuestionsMap[constants.WORK_SCHEDULE] = 'Does your job involve shifts at irregular hours (e.g. night shifts)?';

var initialAdviceMap = {};
initialAdviceMap[constants.ELECTRONICS] = 'You should be avoiding the use of electronic devices before bedtime.';
initialAdviceMap[constants.STRESSED] = 'Stress can impact on your sleep. Try some relaxation techniques to de-stress.';
initialAdviceMap[constants.EAT] = 'You should avoid eating late, especially large or heavy meals.';
initialAdviceMap[constants.ALCOHOL] = 'You should be avoiding alcohol before going to bed.';
initialAdviceMap[constants.NICOTINE] = 'You should be avoiding smoking (or nicotine) before going to bed.';
initialAdviceMap[constants.CAFFEINE] = 'You should be avoiding caffeine before going to bed.';
initialAdviceMap[constants.LIGHTS] = 'You should be sleeping with the lights off.';
initialAdviceMap[constants.QUIET] = 'You should make your bedroom as quiet as possible for sleeping.';
initialAdviceMap[constants.EXERCISE] = 'You should be exercising regularly.';
initialAdviceMap[constants.WORK_SCHEDULE] = 'Your shifts at irregular hours may be interferring with your sleep.';

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
sleepQuestionsMap[constants.NICOTINE] = 'Did you smoke (or take nicotine) before going to bed?';
sleepQuestionsMap[constants.CAFFEINE] = 'Did you drink any beverages with caffeine, such as tea, before going to bed?';
sleepQuestionsMap[constants.LIGHTS] = 'Did you sleep with the lights on?';
sleepQuestionsMap[constants.QUIET] = 'Was your bedroom quiet when you went to sleep?';

var sleepAdviceMap = {};
sleepAdviceMap[constants.ELECTRONICS] = 'Avoid using electronic devices before bedtime.';
sleepAdviceMap[constants.STRESSED] = 'Stress can impact on your sleep. Try some relaxation techniques to de-stress.';
sleepAdviceMap[constants.EAT] = 'Avoid eating late, especially large heavy meals.';
sleepAdviceMap[constants.ALCOHOL] = 'Avoiding alcohol before going to bed.';
sleepAdviceMap[constants.NICOTINE] = 'Avoiding smoking (or nicotine) before going to bed.';
sleepAdviceMap[constants.CAFFEINE] = 'Avoiding caffeine before going to bed.';
sleepAdviceMap[constants.LIGHTS] = 'You should sleep with the lights off.';
sleepAdviceMap[constants.QUIET] = 'Your bedroom should be as quiet as possible for sleeping.';

var personalSleepAdviceMap = {};
personalSleepAdviceMap[constants.ELECTRONICS] = 'You should avoid using electronic devices before bedtime.';
personalSleepAdviceMap[constants.STRESSED] = 'You should try some relaxation techniques to de-stress as stress can impact on yor sleep.';
personalSleepAdviceMap[constants.EAT] = 'You should avoid eating late, especially large heavy meals.';
personalSleepAdviceMap[constants.ALCOHOL] = 'You should avoid alcohol before going to bed.';
personalSleepAdviceMap[constants.NICOTINE] = 'You should avoid smoking (or nicotine) before going to bed.';
personalSleepAdviceMap[constants.CAFFEINE] = 'You should avoid caffeine before going to bed.';
personalSleepAdviceMap[constants.LIGHTS] = 'You should sleep with the lights off.';
personalSleepAdviceMap[constants.QUIET] = 'You should try to keep your bedroom as quiet as possible for sleeping.';


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

const BUTTON_NEXT_QUESTION = 
    [{
        "content_type": "text",
        "title": "next question",
        "payload": "next question"
    }];

const BUTTONS_WHY_AND_DONE = 
    [{
        "content_type": "text",
        "title": "why",
        "payload": "why"
    },
    {
        "content_type": "text",
        "title": "done",
        "payload": "done"
    }];

const BUTTON_DONE = 
    [{
        "content_type": "text",
        "title": "done",
        "payload": "done"
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
            chatAboutSleep(fbUserId, message, event, mainContext);
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
        } else if (intent === constants.INTENT_GENERAL_SLEEP_ADVICE) {
            giveGeneralSleepAdvice();
        } else if (intent === constants.INTENT_HOW_WAS_SLEEP_LAST_NIGHT) {
            answerAboutSleepLastNight(fbUserId);
        } else if (intent === constants.INTENT_PERSONAL_SLEEP_ADVICE) {
            givePersonalSleepAdvice(fbUserId);
        } else if (intent === constants.INTENT_CONSEQUENCES_OF_POOR_SLEEP) {
            answerAboutConsequencesOfPoorSleep();
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
                var msg = 'You haven\'t given me permission to access your Fitbit yet. Please do that first before we proceed with anything else.'
                                + 'To do so click on the following link:\nhttps://calm-scrubland-31682.herokuapp.com/prepare_fitbit_auth?fbUserId='
                                + fbUserId;
                fbMessengerBotClient.sendTextMessage(fbUserId, msg);
                break;
            case constants.BACKGROUND_QUESTIONS:
                if (message === 'yes') {
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
                            updateContextsAndAskNextQuestion(fbUserId, constants.GET_UP, constants.QUESTION_ANSWER, true);
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
                    var msg = 'I see but you should be going to bed between 8pm-12am.';
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
                            if (getUpHour < 6) fbMessengerBotClient.sendTextMessage(fbUserId, 'Why do you wake up very early in the morning?');
                            else if (getUpHour < 12) fbMessengerBotClient.sendTextMessage(fbUserId, 'Why do you get up late, in the morning?');
                            else if (getUpHour < 17) fbMessengerBotClient.sendTextMessage(fbUserId, 'Why do you get up late, in the afternoon?');
                            else fbMessengerBotClient.sendTextMessage(fbUserId, 'Why do you get up late, in the evening?');
                         } 
                    } else {
                        repeatQuestion(fbUserId, backgroundQuestionsMap[constants.GET_UP], false);
                    }
                } else if (subContext === constants.LATE_WAKEUP_EXPECT_EXPLANATION) {
                    await user.setSubContext(fbUserId, constants.FINISHED_OPTIONS);
                    var msg1 = 'I see but you should waking up between 6am-8am.';
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
                        msg2 += 'You sleep for ' + difference + ' hours which is not enough. The recommended amount of sleep (by the National Sleep Foundation) for adults is 7-8 hours).';
                    }
                    if (sleepEnough === false) {
                        await fbMessengerBotClient.sendTextMessage(fbUserId, msg1) ;
                        fbMessengerBotClient.sendQuickReplyMessage(fbUserId, msg2, BUTTON_NEXT_QUESTION);
                    } else {
                        fbMessengerBotClient.sendQuickReplyMessage(fbUserId, msg1, BUTTON_NEXT_QUESTION);
                    }
                } else if (subContext === constants.FINISHED_OPTIONS) {
                    if (message === constants.NEXT_QUESTION) {
                        updateContextsAndAskNextQuestion(fbUserId, constants.ELECTRONICS, constants.QUESTION_ANSWER, true);
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
                if (subContext === constants.QUESTION_ANSWER) {
                    if (message === 'yes' || message === 'no') {
                        await userBackground.updateBackground(fbUserId, constants.EXERCISE, message);
                        if (message === 'no') {
                            await user.setSubContext(fbUserId, constants.QUESTION_ANSWER_DONE);
                            fbMessengerBotClient.sendQuickReplyMessage(fbUserId, initialAdviceMap[constants.QUIET], BUTTONS_WHY_AND_NEXT_QUESTION);
                        } else {
                            updateContextsAndAskNextQuestion(fbUserId, constants.EXERCISE, constants.QUESTION_ANSWER, true);
                        }
                    } else {           
                        repeatQuestion(fbUserId, backgroundQuestionsMap[constants.QUIET], true);
                    }
                } else if (subContext === constants.QUESTION_ANSWER_DONE) {
                    if (message === 'why') {
                        var explanationArray = await factor.getExplanation(constants.QUIET);
                        if (explanationArray.length === 1) {
                            await user.setSubContext(fbUserId, constants.FINISHED_OPTIONS);
                            fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[0], BUTTON_NEXT_QUESTION);
                        } else {
                            await user.setSubContext(fbUserId, constants.MORE_INFO);
                            fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[0], getButtonsForMoreInfo(constants.EXERCISE, 0));
                        }
                    } else if (message === constants.NEXT_QUESTION) {
                        updateContextsAndAskNextQuestion(fbUserId, constants.EXERCISE, constants.QUESTION_ANSWER, true);
                    } else {
                        fbMessengerBotClient.sendQuickReplyMessage(fbUserId, 'Sorry, I didn\'t get that. Please choose an option.', BUTTONS_WHY_AND_NEXT_QUESTION);
                    }
                } else if (subContext === constants.MORE_INFO) {
                        if(message === 'more') {
                            var explanationNumber = parseInt(event.message.quick_reply.payload.split(' ')[2]);
                            var explanationArray = await factor.getExplanation(constants.QUIET);
                            var nextExplanation = explanationNumber+1;
                            if (nextExplanation >= explanationArray.length-1) {    
                                await user.setSubContext(fbUserId, constants.FINISHED_OPTIONS);   
                                fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[nextExplanation], BUTTON_NEXT_QUESTION);
                            } else {
                                fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[nextExplanation], getButtonsForMoreInfo(constants.EXERCISE, nextExplanation));
                            }
                        } else if (message === constants.NEXT_QUESTION) {
                            updateContextsAndAskNextQuestion(fbUserId, constants.EXERCISE, constants.QUESTION_ANSWER, true);
                        } else {
                            fbMessengerBotClient.sendQuickReplyMessage(fbUserId, 'Sorry, I didn\'t get that. Please press this button if you are ready for the next question.', BUTTON_NEXT_QUESTION);
                        }
                } else if (subContext === constants.FINISHED_OPTIONS) {
                    if (message === constants.NEXT_QUESTION) updateContextsAndAskNextQuestion(fbUserId, constants.EXERCISE, constants.QUESTION_ANSWER, true);
                    else fbMessengerBotClient.sendQuickReplyMessage(fbUserId, 'Sorry, I didn\'t get that. Please press this button if you are ready for the next question.', BUTTON_NEXT_QUESTION);
                } 
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
                if (subContext === constants.QUESTION_ANSWER) {
                    if (message === 'yes' || message === 'no') {
                        await userBackground.updateBackground(fbUserId, constants.EXERCISE, message);
                        if (message === 'yes') {
                            await user.updateUser(fbUserId, { mainContext: constants.WORK_SCHEDULE });
                            fbMessengerBotClient.sendQuickReplyMessage(fbUserId, backgroundQuestionsMap[constants.WORK_SCHEDULE], constants.QUICK_REPLIES_YES_OR_NO);
                        } else {
                            finishSleepBackgroundChat(fbUserId, false);
                        }
                    } else {           
                        repeatQuestion(fbUserId, backgroundQuestionsMap[constants.JOB], true);
                    }
                }
                break;
            case constants.WORK_SCHEDULE:
                if (subContext === constants.QUESTION_ANSWER) {
                    if (message === 'yes' || message === 'no') {
                        await userBackground.updateBackground(fbUserId, constants.WORK_SCHEDULE, message);
                        if (message === 'yes') {
                            await user.setSubContext(fbUserId, constants.QUESTION_ANSWER_DONE);
                            fbMessengerBotClient.sendQuickReplyMessage(fbUserId, initialAdviceMap[constants.WORK_SCHEDULE], BUTTONS_WHY_AND_DONE);
                        } else {
                           finishSleepBackgroundChat(fbUserId);
                        }
                    } else {           
                        repeatQuestion(fbUserId, backgroundQuestionsMap[constants.WORK_SCHEDULE], true);
                    }
                } else if (subContext === constants.QUESTION_ANSWER_DONE) {
                    if (message === 'why') {
                        var explanationArray = await factor.getExplanation(constants.WORK_SCHEDULE);
                        if (explanationArray.length === 1) {
                            await user.setSubContext(fbUserId, constants.FINISHED_OPTIONS);
                            fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[0], BUTTON_DONE);
                        } else {
                            await user.setSubContext(fbUserId, constants.MORE_INFO);
                            fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[0], getButtonsForMoreInfo(constants.WORK_SCHEDULE, 0));
                        }
                    } else if (message === 'done') {
                        finishSleepBackgroundChat(fbUserId);
                    } else {
                        fbMessengerBotClient.sendQuickReplyMessage(fbUserId, 'Sorry, I didn\'t get that. Please choose an option.', BUTTONS_WHY_AND_DONE);
                    }
                } else if (subContext === constants.MORE_INFO) {
                        if(message === 'more') {
                            var explanationNumber = parseInt(event.message.quick_reply.payload.split(' ')[2]);
                            var explanationArray = await factor.getExplanation(constants.WORK_SCHEDULE);
                            var nextExplanation = explanationNumber+1;
                            if (nextExplanation >= explanationArray.length-1) {    
                                await user.setSubContext(fbUserId, constants.FINISHED_OPTIONS);   
                                fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[nextExplanation], BUTTON_DONE);
                            } else {
                                fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[nextExplanation], getButtonsForMoreInfo(constants.WORK_SCHEDULE, nextExplanation));
                            }
                        } else if (message === 'done') {
                            finishSleepBackgroundChat(fbUserId);
                        } else {
                            fbMessengerBotClient.sendQuickReplyMessage(fbUserId, 'Sorry, I didn\'t get that. Please press this button if you are done.', BUTTON_DONE);
                        }
                } else if (subContext === constants.FINISHED_OPTIONS) {
                    if (message === 'done') finishSleepBackgroundChat(fbUserId);
                    else fbMessengerBotClient.sendQuickReplyMessage(fbUserId, 'Sorry, I didn\'t get that. Please press this button if you are done.', BUTTON_DONE);
                } 
            break; 
        }
    } catch (err) {
        console.log('[ERROR]', err);
    }     
}

async function finishSleepBackgroundChat(fbUserId, hasIrregularWorkSchedule) {
    var msg1 = 'That was the last question. Thank you for answering my questions, they will be useful in helping me analyse your sleep in the future!';
    var msg2 = 'Feel free to ask me any questions about sleep. If you need a reminder of what I can assist you with, just type !help';
    user.setMainContext(fbUserId, null);
    user.updateUserIsNew(fbUserId, false);
    user.setNotifiedSleepToFalse(fbUserId);
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

async function chatAboutSleep(fbUserId, message, event, mainContext) {
    const subContext = await user.getSubContext(fbUserId);
    try {
        switch (mainContext) {
            case constants.NOTIFIED_SLEEP:
                if (message === 'yes') {
                    await fbMessengerBotClient.sendTextMessage(fbUserId, 'Great. I have a few questions for you.');
                    await user.setMainContext(fbUserId, constants.ELECTRONICS);
                    await user.setSubContext(fbUserId, constants.QUESTION_ANSWER);
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
                handleSleepQuestionReply(fbUserId, event, message, constants.EAT, constants.ALCOHOL, subContext);
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
                handleSleepQuestionReply(fbUserId, event, message, constants.LIGHTS, constants.QUIET, subContext);
                break;
            case constants.QUIET:
                if (subContext === constants.QUESTION_ANSWER) {
                    if (message === 'yes' || message === 'no') {
                        var date = dateAndTimeUtil.dateToString(new Date());
                        userSleepAnswers.updateSleepAnswer(fbUserId, constants.QUIET, message, date);
                        if (message === 'no') {
                            await user.setSubContext(fbUserId, constants.QUESTION_ANSWER_DONE);
                            fbMessengerBotClient.sendQuickReplyMessage(fbUserId, sleepAdviceMap[constants.QUIET], BUTTONS_WHY_AND_DONE);
                        } else {
                           finishSleepChat(fbUserId);
                        }
                    } else {           
                        repeatQuestion(fbUserId, sleepQuestionsMap[constants.QUIET], true);
                    }
                } else if (subContext === constants.QUESTION_ANSWER_DONE) {
                    if (message === 'why') {
                        var explanationArray = await factor.getExplanation(constants.QUIET);
                        if (explanationArray.length === 1) {
                            await user.setSubContext(fbUserId, constants.FINISHED_OPTIONS);
                            fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[0], BUTTON_DONE);
                        } else {
                            await user.setSubContext(fbUserId, constants.MORE_INFO);
                            fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[0], getButtonsForMoreInfo(constants.QUIET, 0));
                        }
                    } else if (message === 'done') {
                        finishSleepChat(fbUserId);
                    } else {
                        fbMessengerBotClient.sendQuickReplyMessage(fbUserId, 'Sorry, I didn\'t get that. Please choose an option.', BUTTONS_WHY_AND_DONE);
                    }
                } else if (subContext === constants.MORE_INFO) {
                        if(message === 'more') {
                            var explanationNumber = parseInt(event.message.quick_reply.payload.split(' ')[2]);
                            var explanationArray = await factor.getExplanation(constants.QUIET);
                            var nextExplanation = explanationNumber+1;
                            if (nextExplanation >= explanationArray.length-1) {    
                                await user.setSubContext(fbUserId, constants.FINISHED_OPTIONS);   
                                fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[nextExplanation], BUTTON_DONE);
                            } else {
                                fbMessengerBotClient.sendQuickReplyMessage(fbUserId, explanationArray[nextExplanation], getButtonsForMoreInfo(constants.WORK_SCHEDULE, nextExplanation));
                            }
                        } else if (message === 'done') {
                            finishSleepChat(fbUserId);
                        } else {
                            fbMessengerBotClient.sendQuickReplyMessage(fbUserId, 'Sorry, I didn\'t get that. Please press this button if you are done.', BUTTON_DONE);
                        }
                } else if (subContext === constants.FINISHED_OPTIONS) {
                    if (message === 'done') finishSleepChat(fbUserId);
                    else fbMessengerBotClient.sendQuickReplyMessage(fbUserId, 'Sorry, I didn\'t get that. Please press this button if you are done.', BUTTON_DONE);
                } 
            break;
        }
    } catch (err) {
        console.log('[ERROR]', err);
    }
}

async function finishSleepChat(fbUserId) {
    user.setMainContext(fbUserId, null);
    var date = dateAndTimeUtil.dateToString(new Date());

    const sleepQuestions = [constants.ELECTRONICS, constants.STRESSED, constants.EAT, constants.ALCOHOL, constants.NICOTINE, constants.CAFFEINE, constants.LIGHTS];
    var factorsConcerned = [];
    var numberOfSleepQuestions = sleepQuestions.length;
    for (var i = 0; i < numberOfSleepQuestions; i++) {
        var factor = sleepQuestions[i];
        var answer = await userSleepAnswers.getAnswer(fbUserId, factor, date);
        if (answer === 'yes') factorsConcerned.push(factor);
    }   
    var quietAnswer = await userSleepAnswers.getAnswer(fbUserId, constants.QUIET, date);
    if (quietAnswer === 'no') factorsConcerned.push(constants.QUIET);
    var exerciseAnswer = await userBackground.getExerciseAnswer(fbUserId);
    if (exerciseAnswer === 'no') factorsConcerned.push(constants.EXERCISE);
    var workScheduleAnswer = await userBackground.getWorkScheduleAnswer(fbUserId);
    if (workScheduleAnswer === 'yes') factorsConcerned.push(constants.WORK_SCHEDULE);

    await fbMessengerBotClient.sendTextMessage(fbUserId, 'Thank you that was the last question.');
    if (factorsConcerned.length === 0) {
        var msg1 = 'Unfortunately I could not determine what lifestyle or environmental factors caused your sleep disturbance.';
        var msg2 = 'If you feel that your sleep disturbances are affecting you, then I would suggest you'
                        + ' go see your doctor. Your doctor may be able to determine the causes of your sleep disturbances.' 
                        + ' Your sleep disturbances could be caused by some medical condition or another factor'
                        + ' (which I was not programmed to identify).';
        var msg3 = 'This concludes our chat. Thank you for talking to me about your sleep. Also don\'t forget to come back later to talk to me about your sleep!';
        await fbMessengerBotClient.sendTextMessage(fbUserId, msg1);
        await fbMessengerBotClient.sendTextMessage(fbUserId, msg2);
        await fbMessengerBotClient.sendTextMessage(fbUserId, msg3);
    } else {
        var msg = 'This concludes our chat. Please keep in mind the advice I have given you to improve your sleep disturbances. Also don\'t forget to come back later to talk to me about your sleep!';
        fbMessengerBotClient.sendTextMessage(fbUserId, msg);
    }
}

async function handleSleepQuestionReply(fbUserId, event, message, currentMainContext, nextMainContext, subContext) {
    var date = dateAndTimeUtil.dateToString(new Date());
    if (subContext === constants.QUESTION_ANSWER) {
        if (message === 'yes' || message === 'no') {
            await userSleepAnswers.updateSleepAnswer(fbUserId, currentMainContext, message, date);
            if (message === 'yes') {
                await user.setSubContext(fbUserId, constants.QUESTION_ANSWER_DONE);
                fbMessengerBotClient.sendQuickReplyMessage(fbUserId, initialAdviceMap[currentMainContext], BUTTONS_WHY_AND_NEXT_QUESTION);
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

async function updateContextsAndAskNextSleepQuestion(fbUserId, mainContext, subContext, isQuickReplyMessage) {
    await user.setMainContext(fbUserId, mainContext);
    await user.setSubContext(fbUserId, subContext);
    if (isQuickReplyMessage) fbMessengerBotClient.sendQuickReplyMessage(fbUserId, sleepQuestionsMap[mainContext], constants.QUICK_REPLIES_YES_OR_NO);
    else fbMessengerBotClient.sendTextMessage(fbUserId, sleepQuestionsMap[mainContext]);
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
    var title = (factor === constants.WORK_SCHEDULE) ? 'done' : 'next question';
    var payload = (factor === constants.WORK_SCHEDULE) ? 'done' : 'next question';

    var buttons = 
        [{
            "content_type": "text",
            "title": "more",
            "payload": 'FACTORS ' + factor + ' ' + index
        },
        {
            "content_type": "text",
            "title": title,
            "payload": payload
        }];
    return buttons;
}

async function updateContextsAndAskNextQuestion(fbUserId, mainContext, subContext, isQuickReplyMessage) {
    await user.setMainContext(fbUserId, mainContext);
    await user.setSubContext(fbUserId, subContext);
    if (isQuickReplyMessage) fbMessengerBotClient.sendQuickReplyMessage(fbUserId, backgroundQuestionsMap[mainContext], constants.QUICK_REPLIES_YES_OR_NO);
    else fbMessengerBotClient.sendTextMessage(fbUserId, backgroundQuestionsMap[mainContext]);
}

async function answerAboutSleepLastNight(fbUserId) {
    var date = dateAndTimeUtil.dateToString(new Date());
    var noSleepDataMsg = 'Sorry I couldn\'t find any sleep data of your sleep last night. Perhaps try asking me again later.';

    var mainSleepExists = await sleep.mainSleepExists(fbUserId, date);
    if (mainSleepExists === false) {
        fbMessengerBotClient.sendTextMessage(fbUserId, noSleepDataMsg);
        return;
    }
        
    var mainSleepLevelsData = await sleep.getMainSleepLevelsData(fbUserId, date);
    var lengthOfData = mainSleepLevelsData.length;
    if (lengthOfData === 0) { // User does not have break down of their sleep (i.e. they manually added a sleep log)
        fbMessengerBotClient.sendTextMessage(fbUserId, noSleepDataMsg);
        return;
    }

    var maxAwake = 0; // Time awake in seconds
    var tmp = 0;
    var timeOfAwake = 0;
    for (var j = 0; j < lengthOfData; j++) {
        timeOfAwake = dateAndTimeUtil.getTimeFromDateString(mainSleepLevelsData[j].dateTime);
        for (var k = j; k < lengthOfData; k++) {
            var data = mainSleepLevelsData[k];
            if (data.level === 'awake' || data.level === 'restless') tmp += data.seconds;
            else break;
        }
        if (tmp > maxAwake) maxAwake = tmp;
        tmp = 0;
    }

    if (maxAwake >= 600) flag = true;
            
    if (flag) {
        const sleepQuestions = [constants.ELECTRONICS, constants.STRESSED, constants.EAT, constants.ALCOHOL, constants.NICOTINE, constants.CAFFEINE, constants.LIGHTS];
        var minutesAwake = Math.floor(maxAwake / 60);
        var factorsConcerned = [];
        var numberOfSleepQuestions = sleepQuestions.length;
        for (var i = 0; i < numberOfSleepQuestions; i++) {
            var factor = sleepQuestions[i];
            var answer = await userSleepAnswers.getAnswer(fbUserId, factor, date);
            if (answer === 'yes') factorsConcerned.push(factor);
        }   
        var quietAnswer = await userSleepAnswers.getAnswer(fbUserId, constants.QUIET, date);
        if (quietAnswer === 'no') factorsConcerned.push(constants.QUIET);
        var exerciseAnswer = await userBackground.getExerciseAnswer(fbUserId);
        if (exerciseAnswer === 'no') factorsConcerned.push(constants.EXERCISE);
        var workScheduleAnswer = await userBackground.getWorkScheduleAnswer(fbUserId);
        if (workScheduleAnswer === 'yes') factorsConcerned.push(constants.WORK_SCHEDULE);

        var msg1 = 'You had a sleep disturbance last night: you were awake at ' + timeOfAwake + ' for ' + minutesAwake + ' minutes.';
        await fbMessengerBotClient.sendTextMessage(fbUserId, msg1);
                
        if (factorsConcerned.length === 0) {
            var msg2 = 'Earlier we had a chat about your sleep last night. Unfortunately I could not determine'
                        + ' what lifestyle or environmental factors caused your sleep disturbance.';
            var msg3 = 'If you feel that your sleep disturbances are affecting you, then I would suggest you'
                        + ' go see your doctor. Your doctor may be able to determine the causes of your sleep disturbances.' 
                        + ' Your sleep disturbances could be caused by some medical condition or another factor'
                        + ' (which I was not programmed to identify).';

            await fbMessengerBotClient.sendTextMessage(fbUserId, msg2);
            fbMessengerBotClient.sendTextMessage(fbUserId, msg3);
        } else {
            if (factorsConcerned.length === 1) {
                var msg = 'Earlier we had a chat about your sleep last night. I determined that a possible cause for your sleep disturbance was due to you ';
                if (factorsConcerned[0] === constants.ELECTRONICS) msg += 'using your phone (or any other electronic devices) before going to bed (or in bed)';
                else if (factorsConcerned[0] === constants.STRESSED) msg += 'being stressed or worried.';
                else if (factorsConcerned[0] === constants.EAT) msg += 'eating before going to bed.';
                else if (factorsConcerned[0] === constants.ALCOHOL) msg += 'drinking alcohol before going to bed.';
                else if (factorsConcerned[0] === constants.NICOTINE) msg += 'smoking (or taking nicotine) before going to bed.';
                else if (factorsConcerned[0] === constants.CAFFEINE) msg += 'drinking any beverages with caffeine, such as tea, before going to bed.';
                else if (factorsConcerned[0] === constants.LIGHTS) msg += 'sleeping with the lights on.';
                else if (factorsConcerned[0] === constants.QUIET) msg += 'sleeping while your bedroom was\n  noisy.';
                else if (factorsConcerned[0] === constants.EXERCISE) msg += 'not exercising regularly.';
                else if (factorsConcerned[0] === constants.WORK_SCHEDULE) msg += 'doing shifts at irregular hours.';
                fbMessengerBotClient.sendTextMessage(fbUserId, msg);
            } else {
                var msg = 'Earlier we had a chat about your sleep last night. I determined that possible causes for your sleep disturbance was due to you:'
                var numberOfFactorsConcerned = factorsConcerned.length;
                for (var i = 0; i < numberOfFactorsConcerned; i++) {
                    if (factorsConcerned[i] === constants.ELECTRONICS) msg += '\n- using your phone (or any other\n  electronic devices) before\n  going to bed (or in bed)';
                    else if (factorsConcerned[i] === constants.STRESSED) msg += '\n- being stressed or worried.';
                    else if (factorsConcerned[i] === constants.EAT) msg += '\n- eating before going to bed.';
                    else if (factorsConcerned[i] === constants.ALCOHOL) msg += '\n- drinking alcohol\n  before going to bed.';
                    else if (factorsConcerned[i] === constants.NICOTINE) msg += '\n- smoking (or taking\n  nicotine) before\n  going to bed.';
                    else if (factorsConcerned[i] === constants.CAFFEINE) msg += '\n- drinking any beverages with\n  caffeine, such as tea,before\n  going to bed.';
                    else if (factorsConcerned[i] === constants.LIGHTS) msg += '\n- sleeping with the lights on.';
                    else if (factorsConcerned[i] === constants.QUIET) msg += '\n- sleeping while your bedroom was noisy.';
                }              
                if (exerciseAnswer === 'no') msg += '\n- not exercising regularly.';
                if (workScheduleAnswer === 'yes') msg += '\n- doing shifts at irregular hours.';
                fbMessengerBotClient.sendTextMessage(fbUserId, msg);
            }
        }
    } else {
        var msg = 'From your sleep data last night, you did not appear to have any sleep disturbances.';
        fbMessengerBotClient.sendTextMessage(fbUserId, msg);
    }
}

async function givePersonalSleepAdvice(fbUserId) {
    var dateArr = [];
    var todaysDate = new Date();
    for (var i = 0; i < 7; i++) {
        var tmp = new Date(todaysDate.getTime());
        tmp.setDate(tmp.getDate()-i);
        dateArr.push(dateAndTimeUtil.dateToString(tmp));
    }

 
    var factorsConcerned = {}; 
    factorsConcerned[constants.ELECTRONICS] = 0;
    factorsConcerned[constants.STRESSED] = 0;
    factorsConcerned[constants.EAT] = 0;
    factorsConcerned[constants.ALCOHOL] = 0;
    factorsConcerned[constants.NICOTINE] = 0;
    factorsConcerned[constants.CAFFEINE] = 0;
    factorsConcerned[constants.LIGHTS] = 0;
    factorsConcerned[constants.QUIET] = 0;
    var sleepStartTimes = [];
    var sleepEndTimes = [];
     
    for (var i = 0; i < 7; i++) {
        var answerEntry = await userSleepAnswers.getAnswersEntry(fbUserId, dateArr[i]);
        if (answerEntry)
            if (answerEntry.electronics === 'yes') factorsConcerned[constants.ELECTRONICS] += 1;
            if (answerEntry.stressed === 'yes') factorsConcerned[constants.STRESSED] += 1;
            if (answerEntry.eat === 'yes') factorsConcerned[constants.EAT] += 1;
            if (answerEntry.alcohol === 'yes') factorsConcerned[constants.ALCOHOL] += 1;
            if (answerEntry.nicotine === 'yes') factorsConcerned[constants.NICOTINE] += 1;
            if (answerEntry.caffeine === 'yes') factorsConcerned[constants.CAFFEINE] += 1;
            if (answerEntry.lights === 'yes') factorsConcerned[constants.LIGHTS] += 1;
            if (answerEntry.quiet === 'yes') factorsConcerned[constants.QUIET] += 1;
        
        var date = dateAndTimeUtil.dateToString(new Date());
        var mainSleepExists = await sleep.mainSleepExists(fbUserId, date);
        if (mainSleepExists) {
            var sleepStartTime = await sleep.getSleepStartTime(fbUserId, dateArr[i]);
            var sleepEndTime = await sleep.getSleepEndTime(fbUserId, dateArr[i]);
            sleepStartTimes.push(sleepStartTime);
            sleepEndTimes.push(sleepEndTime);
        }
    }

    
    var concerned = false;
    var factorsToAdvise = [];
    if (factorsConcerned[constants.ELECTRONICS] > 1) {
        concerned = true;
        factorsToAdvise.push(constants.ELECTRONICS);
    }
    if (factorsConcerned[constants.STRESSED] > 1) {
        concerned = true;
        factorsToAdvise.push(constants.STRESSED);
    }
    if (factorsConcerned[constants.EAT] > 1) {
        concerned = true;
        factorsToAdvise.push(constants.EAT);
    }
    if (factorsConcerned[constants.ALCOHOL] > 1) {
        concerned = true;
        factorsToAdvise.push(constants.ALCOHOL);
    }
    if (factorsConcerned[constants.NICOTINE] > 1) {
        concerned = true;
        factorsToAdvise.push(constants.NICOTINE);
    }
    if (factorsConcerned[constants.CAFFEINE] > 1) {
        concerned = true;
        factorsToAdvise.push(constants.CAFFEINE);
    }
    if (factorsConcerned[constants.LIGHTS] > 1) {
        concerned = true;
        factorsToAdvise.push(constants.LIGHTS);
    }
    if (factorsConcerned[constants.QUIET] > 1) {
        concerned = true;
        factorsToAdvise.push(constants.QUIET);
    }

    console.log(factorsToAdvise);


    if (concerned) {
        var msg = 'Looking at the available data of your sleep for the last seven days, I recommend that...';
        var numberOfFactorsToAdvise = factorsToAdvise.length;
        for (var i = 0; i < numberOfFactorsToAdvise; i++) await fb.sendTextMessage(fbUserId, personalSleepAdviceMap[factorsToAdvise[i]]);
    } else {

    }
}

async function giveGeneralSleepAdvice(fbUserId) {

}

async function answerAboutConsequencesOfPoorSleep(fbUserId) {

}
