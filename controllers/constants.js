const GET_STARTED_PAYLOAD = 'GET_STARTED_PAYLOAD';
const FITBIT_AUTH = 'fitbit auth';

const BACKGROUND_QUESTIONS = 'background questions';
const BACKGROUND_GET_UP = 'background question get_up';
const BACKGROUND_GO_TO_BED = 'background question go_to_bed';
const BACKGROUND_ELECTRONICS = 'background question electronics';
const BACKGROUND_STRESSED = 'background question stressed';
const BACKGROUND_EAT = 'background question eat';
const BACKGROUND_ALCOHOL_NICOTINE = 'background question alcohol nicotine';
const BACKGROUND_CAFFEINE = 'background question caffeine';
const BACKGROUND_LIGHTS = 'background question lights';
const BACKGROUND_QUIET = 'background question noise';
const BACKGROUND_EXCERCISE = 'background question excercise';
const BACKGROUND_JOB = 'background question job';
const BACKGROUND_WORK_SCHEDULE = 'background work sched';
const BACKGROUND_DONE = 'background done';

const BACKGROUND_GET_UP_TEXT = 'At what time do you usually get up on a weekday? Please give your answer in 24-hour time format (i.e. HH:MM).';
const BACKGROUND_GO_TO_BED_TEXT = 'At what time do you usually go to bed on a weekday? Please give your answer in 24-hour time format (i.e. HH:MM).';
const BACKGROUND_ELECTRONICS_TEXT = 'Do you use your phone (or any other electronic devices) before going to bed (or in bed)?';
const BACKGROUND_STRESSED_TEXT = 'Are you stressed or worried about anything?';
const BACKGROUND_EAT_TEXT = 'Do you eat before going to bed?';
const BACKGROUND_ALCOHOL_NICOTINE_TEXT = 'Do you drink alcohol or take nicotine before going to bed?';
const BACKGROUND_CAFFEINE_TEXT = 'Do you drink any beverages with caffeine, such as tea, before going to bed?';
const BACKGROUND_LIGHTS_TEXT = 'Do you sleep with the lights on?';
const BACKGROUND_QUIET_TEXT = 'Is your bedroom quiet when you sleep?';
const BACKGROUND_EXCERCISE_TEXT = 'Are you exercising regularly?';
const BACKGROUND_JOB_TEXT = 'Do you have a job?';
const BACKGROUND_WORK_SCHEDULE_TEXT = 'Is your work schedule irregular?';

const GET_UP = 'get_up';
const GO_TO_BED = 'go_to_bed';
const ELECTRONICS = 'electronics';
const STRESSED = 'stressed';
const EAT = 'eat';
const ALCOHOL_NICOTINE = 'alcohol_nicotine';
const CAFFEINE = 'caffeine';
const LIGHTS = 'lights';
const QUIET = 'quiet';
const JOB = 'job';
const WORK_SCHEDULE = 'work schedule';
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
    BACKGROUND_QUIET, 
    BACKGROUND_EXCERCISE, 
    BACKGROUND_JOB, 
    BACKGROUND_WORK_SCHEDULE, 
    BACKGROUND_DONE,

    BACKGROUND_GET_UP_TEXT, 
    BACKGROUND_GO_TO_BED_TEXT,
    BACKGROUND_ELECTRONICS_TEXT, 
    BACKGROUND_STRESSED_TEXT, 
    BACKGROUND_EAT_TEXT, 
    BACKGROUND_ALCOHOL_NICOTINE_TEXT, 
    BACKGROUND_CAFFEINE_TEXT, 
    BACKGROUND_LIGHTS_TEXT, 
    BACKGROUND_QUIET_TEXT, 
    BACKGROUND_EXCERCISE_TEXT, 
    BACKGROUND_JOB_TEXT, 
    BACKGROUND_WORK_SCHEDULE_TEXT, 

    GET_UP,
    GO_TO_BED,
    ELECTRONICS, 
    STRESSED,
    EAT,
    ALCOHOL_NICOTINE,
    CAFFEINE,
    LIGHTS,
    QUIET,
    EXCERCISE,
    JOB,
    WORK_SCHEDULE,

	QUICK_REPLIES_YES_OR_NO
};

