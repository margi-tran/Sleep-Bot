/**
 * Module for handling subscribed updates to users' Fitbit data. 
 */


var MongoClient = require('mongodb').MongoClient;

var fitbitClient = require('../../utility/fitbit_client');
var dateAndTimeUlti = require('../../utility/date_and_time_util');

module.exports = async (req, res) => {
	try {

		console.log(req.body); 
		
		var notifications = req.body;
		notifications.forEach(notification => {
			console.log(notification);

			db2 = await MongoClient.connect(process.env.MONGODB_URI);
		});
			


		
		const fitbitId = req.body[0].ownerId;
		//const fitbitId = notification.ownerId;
		const date = req.body[0].date;
		console.log('daaaaaa', fitbitId, date);

		const db = await MongoClient.connect(process.env.MONGODB_URI);
    	const result = await db.collection('fitbit_auths').find({ fitbitId_: fitbitId }).toArray();

    	// Refresh the user's access token
    	var oldAccessToken = result[0].accessToken;
    	var oldRefreshAccessToken = result[0].refreshAccessToken;
		var refreshAccessTokenPromise = await fitbitClient.client.refreshAccessToken(oldAccessToken, oldRefreshAccessToken);
		var newAccessToken = refreshAccessTokenPromise.access_token;
		var newRefreshToken = refreshAccessTokenPromise.refresh_token;
		await db.collection('fitbit_auths').updateOne({ fitbitId_: fitbitId }, { $set: { accessToken: newAccessToken, refreshAccessToken: newRefreshToken } });

		// Get the user's sleep data
		fbUserId = result[0].fbUserId_;
   		var accessToken = result[0].accessToken;
    	const sleepData = await fitbitClient.client.get('/sleep/date/' + dateAndTimeUlti.dateToString(new Date()) + '.json', newAccessToken);

    	var arr = sleepData[1].body.sleep;
    	console.log(arr);
  		var sleepDataDoc = 
  			{ 
  				fbUserId_: fbUserId,
  				date: date,
  				sleep_data: arr
            };
        db.collection('sleep_data').update({ fbUserId_: fbUserId, date: date }, sleepDataDoc, { upsert : true });

    	res.sendStatus(204);
    	db.close();
	} catch (err) {
		console.log('[ERROR]', err);
	}
};
