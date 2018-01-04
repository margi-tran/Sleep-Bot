var Fitbit = require('fitbit-node');
var client = new Fitbit(process.env.FITBIT_CLIENT_ID , process.env.FITBIT_CLIENT_SECRET);

var redirectUri = 'https://calm-scrubland-31682.herokuapp.com/fitbit_oauth_callback';
var scope = 'activity heartrate location nutrition profile settings sleep social weight';

module.exports = {
	client,
	redirectUri,
	scope
};