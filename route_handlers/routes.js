var fbVerificationHandler = require('./route_handlers/facebook/verification_handler');
var fbWebhook = require('./route_handlers/facebook/webhook');
var fitbitWebhookGet = require('./route_handlers/fitbit/webhook_get');
var fitbitOAuthCallback = require('./route_handlers/fitbit/oauth_callback');
var fitbitRedirect = require('./route_handlers/fitbit/redirect');
var prepareFitbitAuth = require('./route_handlers/prepare_fitbit_auth');

module.exports = {
	fbVerificationHandler,
	fbWebhook,
	fitbitWebhookGet,
 	fitbitOAuthCallback,
 	fitbitRedirect,
 	prepareFitbitAuth
};