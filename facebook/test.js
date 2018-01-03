var fbMessengerBot = require('fb-messenger-bot-api');
var fbMessengerBotClient = new fbMessengerBot.Client(process.env.FB_PAGE_ACCESS_TOKEN);

exports.sendTextMessage = async (fbUserId, message) {
	return new Promise(function(resolve, reject) => {
		try {
			result = await fbMessengerBotClient.sendTextMessage(fbUserId, message);
			resolve(result);
		} catch (err) {
			reject(err);
		}
	};
};

