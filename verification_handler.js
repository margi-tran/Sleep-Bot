/**
 * Module for Facebook verification.
 */

module.exports = (req, res) => {
	if (req.query['hub.verify_token'] === process.env.FB_VERIFY_TOKEN) 
        res.status(200).send(req.query['hub.challenge']);
    else
		res.status(403).send('Error: wrong token');
};

