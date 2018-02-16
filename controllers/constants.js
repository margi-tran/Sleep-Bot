const GET_STARTED_PAYLOAD = 'GET_STARTED_PAYLOAD';
const FITBIT_AUTH = 'fitbit auth';

const BACKGROUND_QUESTIONS = 'background questions';
const QUESTION_ANSWER = 'question answer';
const FINISHED_OPTIONS = 'finished options';
const QUESTION_ANSWER_DONE = 'question answer done';
const MORE_INFO = 'more info';
const NEXT_QUESTION = 'next question';
const LATE_WAKEUP_EXPECT_EXPLANATION = 'late wakeup expect explanation';
const LATE_GO_TO_BED_EXPECT_EXPLANATION = 'late go to bed expect explanation';

const NOTIFIED_SLEEP = 'notified sleep';

const GET_UP = 'get_up';
const GO_TO_BED = 'go_to_bed';
const ELECTRONICS = 'electronics';
const STRESSED = 'stressed';
const EAT = 'eat';
const ALCOHOL = 'alcohol';
const NICOTINE = 'nicotine';
const CAFFEINE = 'caffeine';
const LIGHTS = 'lights';
const QUIET = 'quiet';
const JOB = 'job';
const WORK_SCHEDULE = 'work_schedule';
const EXERCISE = 'exercise';

const INTENT_EFFECTS_OF_FACTORS = 'effects-of-factors-on-sleep';
const INTENT_GENERAL_SLEEP_ADVICE = 'general-sleep-advice';
const INTENT_HOW_WAS_SLEEP_LAST_NIGHT = 'how-was-sleep-last-night';
const INTENT_PERSONAL_SLEEP_ADVICE = 'personal-sleep-advice';
const INTENT_CONSEQUENCES_OF_POOR_SLEEP = 'consequences-of-poor-sleep';

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

const SLEEP_CONSEQUENCES = 
    [
        'a',
        'b'
    ];

module.exports = {
	GET_STARTED_PAYLOAD,
	FITBIT_AUTH,

	BACKGROUND_QUESTIONS,

    QUESTION_ANSWER,
    FINISHED_OPTIONS,
    NEXT_QUESTION,
    QUESTION_ANSWER_DONE,
    MORE_INFO,
    LATE_WAKEUP_EXPECT_EXPLANATION,
    LATE_GO_TO_BED_EXPECT_EXPLANATION,

    NOTIFIED_SLEEP,

    GET_UP,
    GO_TO_BED,
    ELECTRONICS, 
    STRESSED,
    EAT,
    ALCOHOL,
    NICOTINE,
    CAFFEINE,
    LIGHTS,
    QUIET,
    EXERCISE,
    JOB,
    WORK_SCHEDULE,

    INTENT_EFFECTS_OF_FACTORS,
    INTENT_GENERAL_SLEEP_ADVICE,
    INTENT_HOW_WAS_SLEEP_LAST_NIGHT,
    INTENT_PERSONAL_SLEEP_ADVICE,
    INTENT_CONSEQUENCES_OF_POOR_SLEEP,

	QUICK_REPLIES_YES_OR_NO,

    SLEEP_CONSEQUENCES
};