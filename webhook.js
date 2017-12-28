/**
 * Module for handling Facebook messages recieved from the webhook.
 */


var processMessage = require('./process_message');


module.exports = async (req, res) => {
	try {
    if (req.body.object === 'page') {
        req.body.entry.forEach(entry => {
            entry.messaging.forEach(event => {
				if (event.message)
					processMessage(event);

				if(event.postback) {
					console.log("get started was pressed");
				}
         	});
    	});
    	res.status(200).end();
    }
    } catch (err) {
    	console.log('ERROR: ', err);
    }
};





