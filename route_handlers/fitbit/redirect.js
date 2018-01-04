var fitbitClient = require('../../utility/fitbit_client');

module.exports = (req, res) => {
	res.redirect(fitbitClient.client.getAuthorizeUrl(fitbitClient.scope, fitbitClient.redirectUri));
};