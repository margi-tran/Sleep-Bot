/**
 * Module for handling Facebook messages recieved from the webhook.
 */


var processMessage = require('./process_message');

module.exports = async (req, res) => {
    if (req.body.object === 'page') {
        req.body.entry.forEach(entry => {
            entry.messaging.forEach(event => {
				if (event.message)
					processMessage(event);
         	});
    	});
    	res.status(200).end();
    }
};
