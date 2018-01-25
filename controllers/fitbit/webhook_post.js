/**
 * Module for handling subscribed updates to users' Fitbit data. 
 */


//var MongoClient = require('mongodb').MongoClient;

var fitbitAuth = require('../../models/fitbit_auth');
var sleep = require('../../models/sleep');

var fitbitClient = require('./fitbit_client');
var dateAndTimeUlti = require('../../utility/date_and_time_util');

module.exports = async (req, res) => {
	try {
		req.body.forEach(async (notification) => {
			const fitbitId = notification.ownerId;
			const date = notification.date;

		  	//const db = await MongoClient.connect(process.env.MONGODB_URI);
		   	//onst result = await db.collection('fitbit_auths').find({ fitbitId_: fitbitId }).toArray();

			// Refresh the user's access token
			/*var oldAccessToken = result[0].accessToken;
			var oldRefreshAccessToken = result[0].refreshAccessToken;
			var refreshAccessTokenPromise = await fitbitClient.client.refreshAccessToken(oldAccessToken, oldRefreshAccessToken);
			var newAccessToken = refreshAccessTokenPromise.access_token;
			var newRefreshToken = refreshAccessTokenPromise.refresh_token;
			await db.collection('fitbit_auths').updateOne({ fitbitId_: fitbitId }, { $set: { accessToken: newAccessToken, refreshAccessToken: newRefreshToken } });
*/
			var oldAccessToken = fitbitAuth.getAccessToken(fitbitId);
			console.log('********step: 1');
			var oldRefreshAccessToken = fitbitAuth.getRefreshAccessToken(fitbitId);
			var refreshAccessTokenPromise = await fitbitClient.client.refreshAccessToken(oldAccessToken, oldRefreshAccessToken);
			console.log('********step: 2');
			var newAccessToken = refreshAccessTokenPromise.access_token;
			var newRefreshToken = refreshAccessTokenPromise.refresh_token;
			await fitbitAuth.updateFitbitTokens(fitbitId, newAccessToken, newRefreshToken);
			console.log('********step: 3');

			// Get the user's sleep data
			var fbUserId = await fitbitAuth.getFbUserIdOwner(fitbitId);
			const sleepData = await fitbitClient.client.get('/sleep/date/' + dateAndTimeUlti.dateToString(new Date()) + '.json', newAccessToken);
			console.log('********step: 4');
			/*var sleepDataDoc = 
				{ 
					fbUserId_: fbUserId,
					date: date,
					sleep_data: sleepData[1].body
				};
			db.collection('sleep_data').update({ fbUserId_: fbUserId, date: date }, sleepDataDoc, { upsert : true });
			*/
			sleep.insertSleepData(fbUserId, date, sleepData[1].body);

			res.sendStatus(204);
		});
	} catch (err) {
		console.log('[ERROR]', err);
	}
};
