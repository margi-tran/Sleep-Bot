/**
 * Module for handling Facebook messages recieved from the webhook.
 */

 
const message_handler = require('./message_handler');
const process_message = require('./process_message');
 
// from https://chatbotsmagazine.com/have-15-minutes-create-your-own-facebook-messenger-bot-481a7db54892
module.exports = (req, res) => {
    messaging_events = req.body.entry[0].messaging;
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i];
        sender = event.sender.id;
        if (event.message && event.message.text) {
            text = event.message.text;
           // message_handler.sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200));
        process_message(sender, text);
		}
    }
    res.sendStatus(200);
};