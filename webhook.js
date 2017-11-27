/**
 * Module for handling Facebook messages recieved from the webhook.
 */

 
const processMessage = require('./process_message');

module.exports = (req, res) => {
    if (req.body.object === 'page') {
        req.body.entry.forEach(entry => {
            entry.messaging.forEach(event => {
				if(event.message)
					processMessage(event);
            });
        });
        res.status(200).end();
    }
};