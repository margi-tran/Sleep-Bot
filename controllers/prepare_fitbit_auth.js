/**
 * This module serves up a webpage a user. The purpose of the webpage is to 
 * store their Facebook user ID as a cookie, so that the when they are redirected
 * to authenticate the server with Fitbit, their Facebook user ID can be 
 * stored alongside their Fitbit ID.
 */


var path = require('path');
var MongoClient = require('mongodb').MongoClient;

module.exports = async (req, res) => {
	try {
		const fbUserId = req.query.fbUserId;

		// If fbUserId is not present in the URL, then assume that access to this route was illegal
		if(fbUserId === undefined) {
			res.send('An error occurred. Please contact Margi for assistance.' 
						+ '\n[ERROR] (/prepare_fitbit_auth) fbUserId is undefined.');
			return;
		}

		// Check whether or not the user has already authenticated Fitbit with the server
		const db = await MongoClient.connect(process.env.MONGODB_URI);
   	 	const result = await db.collection('fitbit_auths').find({ fbUserId_: fbUserId }).toArray();
   	 	db.close();
		if(result != 0) {
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