/*var Fitbit = require('fitbit-node');
var client = new Fitbit(process.env.FITBIT_CLIENT_ID , process.env.FITBIT_CLIENT_SECRET);

var redirectUri = 'https://calm-scrubland-31682.herokuapp.com/fitbit_oauth_callback';
var scope = 'activity heartrate location nutrition profile settings sleep social weight';

module.exports = {
	client,
	redirectUri,
	scope
};*/

var Fitbit = require('fitbit-node');

exports.client = new Fitbit(process.env.FITBIT_CLIENT_ID , process.env.FITBIT_CLIENT_SECRET);
exports.redirectUri = 'https://calm-scrubland-31682.herokuapp.com/fitbit_oauth_callback';
exports.scope = 'activity heartrate location nutrition profile settings sleep social weight';

exports.subscribeToFoods = (accessToken) => {
    client.post("/foods/apiSubscriptions/1.json", accessToken).then((results) => {
        console.log('subscribeToFoods:', results[0]);
    }).catch((results) => {
        console.log(results[0].errors);
    })
};    

