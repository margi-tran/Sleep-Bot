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
const BACKGROUND_EXERCISE = 'background question exercise';
const BACKGROUND_JOB = 'background question job';
const BACKGROUND_WORK_SCHEDULE = 'background work sched';


const QUESTION_ANSWER = 'question answer';
const FINISHED_OPTIONS = 'finished options';
const NEXT_QUESTION = 'next question';
const LATE_WAKEUP_EXPECT_EXPLANATION = 'late wakeup expect explanation';
const LATE_GO_TO_BED_EXPECT_EXPLANATION = 'late go to bed expect explanation';

const NOTIFIED_SLEEP = 'notified sleep';
const SLEEP_ELECTRONICS = 'sleep electronics';
const SLEEP_STRESSED = 'sleep stressed';
const SLEEP_EAT = 'sleep eat';
const SLEEP_ALCOHOL_NICOTINE = 'sleep alcohol nicotine';
const SLEEP_CAFFEINE = 'sleep caffeine';
const SLEEP_LIGHTS = 'sleep lights';
const SLEEP_QUIET = 'sleep quiet';

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
const WORK_SCHEDULE = 'work_schedule';
const EXERCISE = 'exercise';
const ALCOHOL = 'alcohol';
const NICOTINE = 'nicotine';

const INTENT_EFFECTS_OF_FACTORS = 'effects-of-factors-on-sleep';

const QUICK_REPLIES_YES_OR_NO = 
    [{
        "content_type": "text",
        "title": "yes",
        "payload": "yes"
    },
    {
        "content_type": "text",
        "title": "no",
        "payload": "no"
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
    BACKGROUND_EXERCISE, 
    BACKGROUND_JOB, 
    BACKGROUND_WORK_SCHEDULE, 

    QUESTION_ANSWER,
    FINISHED_OPTIONS,
    NEXT_QUESTION,
    LATE_WAKEUP_EXPECT_EXPLANATION,
    LATE_GO_TO_BED_EXPECT_EXPLANATION,

    NOTIFIED_SLEEP,
    SLEEP_ELECTRONICS, 
    SLEEP_STRESSED,
    SLEEP_EAT,
    SLEEP_ALCOHOL_NICOTINE,
    SLEEP_CAFFEINE,
    SLEEP_LIGHTS,
    SLEEP_QUIET,

    GET_UP,
    GO_TO_BED,
    ELECTRONICS, 
    STRESSED,
    EAT,
    ALCOHOL_NICOTINE,
    CAFFEINE,
    LIGHTS,
    QUIET,
    EXERCISE,
    JOB,
    WORK_SCHEDULE,
    ALCOHOL,
    NICOTINE,

    INTENT_EFFECTS_OF_FACTORS,

	QUICK_REPLIES_YES_OR_NO
};