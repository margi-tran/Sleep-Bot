/**
 * Module for handling Facebook messages recieved from the webhook.
 */

 
const processMessage = require('./process_message');
 
 /*
// This function was adapted from
// https://chatbotsmagazine.com/have-15-minutes-create-your-own-facebook-messenger-bot-481a7db54892
module.exports = (req, res) => {
    messaging_events = req.body.entry[0].messaging;
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i];
        sender = event.sender.id;
        if (event.message && event.message.text) {
            text = event.message.text;
			processMessage(sender, text);
		}
    }
    res.sendStatus(200);
};*/

module.exports = (req, res) => {
    if (req.body.object === 'page') {
        req.body.entry.forEach(entry => {
            entry.messaging.forEach(event => {
                //if (event.message && event.message.text) {
                //    processMessage(event);
                //}
				if(event.message)
					processMessage(event);
            });
        });

        res.status(200).end();
    }
};