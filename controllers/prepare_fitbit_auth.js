/**
 * This module serves up a webpage a user. The purpose of the webpage is to 
 * store their Facebook user ID as a cookie, so that the when they are redirected
 * to authenticate the server with Fitbit, their Facebook user ID can be 
 * stored alongside their Fitbit ID.
 */


var path = require('path');
var fitbitAuth = require('../models/fitbit_auth');

module.exports = async (req, res) => {
	try {
		const fbUserId = req.query.fbUserId;

		// If fbUserId is not present in the URL, then assume that access to this route was illegal
		if(fbUserId === undefined) {
			res.send('An error occurred. Please contact Margi for assistance.' 
						+ '\n[ERROR] (/prepare_fitbit_auth) fbUserId is undefined.');
			return;
		}

    	var userIsAuthenticated = await fitbitAuth.userIsAuthenticated(fbUserId);
    	if (userIsAuthenticated) {
    		res.send('You have already authenticated Fitbit with SleepBot.');
        	return;
    	}

		res.cookie('fbUserId', fbUserId);
		res.sendFile(path.join(__dirname + '/../views/prepare_fitbit_auth.html'));
	} catch (err) {
		console.log('[ERROR]', err);
		res.send('An error occurred. Please contact admin for assistance.' + '\n[ERROR] (/prepare_fitbit_auth) ' + err);
	}
};