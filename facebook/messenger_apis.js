/*
 * Module combines some methods of fb-messenger-bot-api and messenger-bot modules
 * into a single module.
 */

var fbMessengerBot = require('fb-messenger-bot-api');
var fbMessengerBotClient = new fbMessengerBot.Client(process.env.FB_PAGE_ACCESS_TOKEN);

var MessengerBot = require('messenger-bot');
var messengerBotClient = new MessengerBot({token:process.env.FB_PAGE_ACCESS_TOKEN});

 module.exports = {
    fbMessengerBotClient,
    messengerBotClient,
 };
