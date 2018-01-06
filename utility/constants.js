const GET_STARTED_PAYLOAD = 'GET_STARTED_PAYLOAD';
const FITBIT_AUTH = 'fitbit auth';

const BACKGROUND_QUESTIONS = 'background questions';
const BACKGROUND_QUESTION_ONE = 'background question one';

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
	BACKGROUND_QUESTION_ONE,
	QUICK_REPLIES_YES_OR_NO
};

