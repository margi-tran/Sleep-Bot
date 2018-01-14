const GET_STARTED_PAYLOAD = 'GET_STARTED_PAYLOAD';
const FITBIT_AUTH = 'fitbit auth';

const BACKGROUND_QUESTIONS = 0;
const BACKGROUND_GET_UP = 1;
const BACKGROUND_GO_TO_BED = 2;
const BACKGROUND_ELECTRONICS = 3;
const BACKGROUND_STRESSED = 4;
const BACKGROUND_EAT = 5;
const BACKGROUND_ALCOHOL_NICOTINE = 6;
const BACKGROUND_CAFFEINE = 7;
const BACKGROUND_LIGHTS = 8;
const BACKGROUND_NOISE = 9;
const BACKGROUND_EXCERCISE = 10;
const BACKGROUND_JOB = 11;
const BACKGROUND_WORK_SCHED = 12;

const BACKGROUND_GET_UP_TEXT = 'At what time do you usually get up on a weekday?';
const BACKGROUND_GO_TO_BED_TEXT = 'At what time do you usually go to bed on a weekday?';
const BACKGROUND_ELECTRONICS_TEXT = 'Are you using your phone or watching tv before going to bed (or in bed)?';
const BACKGROUND_STRESSED_TEXT = 'Are you stressed or worried about anything?';
const BACKGROUND_EAT_TEXT = 'Do you eat before going to bed?';
const BACKGROUND_ALCOHOL_NICOTINE_TEXT = 'Do you drink alcohol or take nicotine before going to bed?';
const BACKGROUND_CAFFEINE_TEXT = 'Do you drink any beverages with caffeine, such as tea, before going to bed?';
const BACKGROUND_LIGHTS_TEXT = 'Do you sleep with the lights on?';
const BACKGROUND_NOISE_TEXT = 'Is your bedroom quiet when you sleep?';
const BACKGROUND_EXCERCISE_TEXT = 'Are you exercising regularly?';
const BACKGROUND_JOB_TEXT = 'Do you have a job?';
const BACKGROUND_WORK_SCHED_TEXT = 'Is your work schedule irregular?';

const ELECTRONICS = 'electronics';
const STRESSED = 'stressed';
const EAT = 'eat';
const ALCOHOL_NICOTINE = 'alcohol nicotine';
const CAFFEINE = 'caffeine';
const LIGHTS = 'lights';
const NOISE = 'noise';
////
const JOB = 'job schedule';
const EXCERCISE = 'excercise';


var QUICK_REPLIES_YES_OR_NO = 
    [{
        "content_type":"text",
        "title":"yes",
         "payload":"yes"
    },
    {
        "content_type":"text",
        "title":"no",
        "payload":"no"
    }];

module.exports = {
	GET_STARTED_PAYLOAD,
	FITBIT_AUTH,
	BACKGROUND_QUESTIONS,
	
    BACKGROUND_GET_UP,
    BACKGROUND_GO_TO_BED,
    BACKGROUND_ELECTRONICS,
    BACKGROUND_STRESSED,
    BACKGROUND_EAT, 
    BACKGROUND_ALCOHOL_NICOTINE,
    BACKGROUND_CAFFEINE, 
    BACKGROUND_LIGHTS, 
    BACKGROUND_NOISE, 
    BACKGROUND_EXCERCISE, 
    BACKGROUND_JOB, 
    BACKGROUND_WORK_SCHED, 

    BACKGROUND_GET_UP_TEXT, 
    BACKGROUND_GO_TO_BED_TEXT,
    BACKGROUND_ELECTRONICS_TEXT, 
    BACKGROUND_STRESSED_TEXT, 
    BACKGROUND_EAT_TEXT, 
    BACKGROUND_ALCOHOL_NICOTINE_TEXT, 
    BACKGROUND_CAFFEINE_TEXT 
    BACKGROUND_LIGHTS_TEXT, 
    BACKGROUND_NOISE_TEXT, 
    BACKGROUND_EXCERCISE_TEXT, 
    BACKGROUND_JOB_TEXT, 
    BACKGROUND_WORK_SCHED_TEXT, 

    ELECTRONICS, 
    STRESSED,
    EAT,
    ALCOHOL_NICOTINE,
    CAFFEINE,
    LIGHTS,
    NOISE,
    JOB,
    EXCERCISE,

	QUICK_REPLIES_YES_OR_NO
};

