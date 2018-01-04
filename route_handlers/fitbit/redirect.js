var fitbitClient = require('../../fitbit/fitbit_client');

module.exports = (req, res) => {
	res.redirect(fitbitClient.client.getAuthorizeUrl(fitbitClient.client.scope, fitbitClient.client.redirectUri));
};