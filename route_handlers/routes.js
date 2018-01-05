var fbVerificationHandler = require('./facebook/verification_handler');
var fbWebhook = require('./facebook/webhook');
var fitbitWebhookGet = require('./fitbit/webhook_get');
var fitbitOAuthCallback = require('./fitbit/oauth_callback');
var fitbitRedirect = require('./fitbit/redirect');
var prepareFitbitAuth = require('./prepare_fitbit_auth');

module.exports = {
	fbVerificationHandler,
	fbWebhook,
	fitbitWebhookGet,
 	fitbitOAuthCallback,
 	fitbitRedirect,
 	prepareFitbitAuth
};