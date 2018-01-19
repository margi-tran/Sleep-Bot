/**
 * Module for handling Facebook messages recieved from the webhook.
 */


var processMessage = require('../../event_handlers/process_message');
var processPostback = require('../../event_handlers/process_postback');

module.exports = async (req, res) => {
	try {
    	if (req.body.object === 'page') {
    		if (req.body.entry === undefined) return;
       		req.body.entry.forEach(entry => {
        		if (entry.messaging === undefined) return;
            	entry.messaging.forEach(event => {
					if (event.message) {
						processMessage(event);
					} else if (event.postback) {
						res.cookie('fb_id', event.sender.id);
						processPostback(event);
					} else {
						console.log('Invalid event recieved.');
					}
         		});
    		});
    		res.status(200).end();
    	}
    } catch (err) {
    	console.log('[ERROR]', err);
    }
};