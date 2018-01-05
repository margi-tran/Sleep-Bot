var fbVerificationHandler = require('./facebook/verification_handler');
var fbWebhook = require('./facebook/webhook');
var fitbitWebhookGet = require('./fitbit/webhook_get');
var fitbitWebhookPost = require('./fitbit/webhook_post');
var prepareFitbitAuth = require('./prepare_fitbit_auth');
var fitbitRedirect = require('./fitbit/redirect');
var fitbitOAuthCallback = require('./fitbit/oauth_callback');


module.exports = {
	fbVerificationHandler,
	fbWebhook,
	fitbitWebhookGet,
	fitbitWebhookPost,
	prepareFitbitAuth,
	fitbitRedirect,
 	fitbitOAuthCallback
};