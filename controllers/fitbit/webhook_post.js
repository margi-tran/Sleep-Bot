/**
 * Module for handling subscribed updates to users' Fitbit data. 
 */


var fitbitAuth = require('../../models/fitbit_auth');
var sleep = require('../../models/sleep');

var fitbitClient = require('./fitbit_client');
var dateAndTimeUlti = require('../../utility/date_and_time_util');

module.exports = async (req, res) => {
	try {
		req.body.forEach(async (notification) => {
			const fitbitId = notification.ownerId;
			const date = notification.date;

			var oldAccessToken = await fitbitAuth.getAccessToken(fitbitId);
			var oldRefreshAccessToken = await fitbitAuth.getRefreshAccessToken(fitbitId);
			var refreshAccessTokenPromise = await fitbitClient.client.refreshAccessToken(oldAccessToken, oldRefreshAccessToken);
			var newAccessToken = refreshAccessTokenPromise.access_token;
			var newRefreshToken = refreshAccessTokenPromise.refresh_token;
			await fitbitAuth.updateFitbitTokens(fitbitId, newAccessToken, newRefreshToken);

			// Get the user's sleep data from Fitbit and put it into the database
			var fbUserId = await fitbitAuth.getFbUserId(fitbitId);
			const sleepData = await fitbitClient.client.get('/sleep/date/' + dateAndTimeUlti.dateToString(new Date()) + '.json', newAccessToken);
			sleep.insertSleepData(fbUserId, date, sleepData[1].body);

			res.sendStatus(204);
		});
	} catch (err) {
		console.log('[ERROR]', err);
	}
};
