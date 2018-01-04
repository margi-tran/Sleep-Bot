var MongoClient = require('mongodb').MongoClient;
var path = require('path');

module.exports = async (req, res) => {
	var fbUserId = req.query.fbUserId;
	// If fbUserId is not present in the URI, then assume access to this route is illegal
	if(fbUserId === undefined) {
		res.send('You may not proceed beyond this page. Please contact Margi for assistance.'
					+ '\n[ERROR] (/prepare_fitbit_auth) fbUserId is undefined.');
			return;
	}

	// Check whether or not the user has already authenticated their Fitbit with the server
	const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('fitbit_auths').find({ fbUserId_: fbUserId }).toArray();
	if(result != 0) {
        res.send('You have already authenticated Fitbit with SleepBot.');
        return;
    } 

	res.cookie('fbUserId', fbUserId);
	res.sendFile(path.join(__dirname + '/html_files/prepare_fitbit_auth.html'));
};