var rootHandler = require('./root');
var fbVerification = require('./facebook/verification');
var fbWebhook = require('./facebook/webhook');
var fitbitWebhookGet = require('./fitbit/webhook_get');
var fitbitWebhookPost = require('./fitbit/webhook_post');
var prepareFitbitAuth = require('./prepare_fitbit_auth');
var fitbitRedirect = require('./fitbit/redirect');
var fitbitOAuthCallback = require('./fitbit/oauth_callback');

module.exports = {
	rootHandler,
	fbVerification,
	fbWebhook,
	fitbitWebhookGet,
	fitbitWebhookPost,
	prepareFitbitAuth,
	fitbitRedirect,
 	fitbitOAuthCallback
};