var schedule = require('node-schedule');
var fbMessengerBot = require('fb-messenger-bot-api');
var fbMessengerBotClient = new fbMessengerBot.Client(process.env.FB_PAGE_ACCESS_TOKEN);
var MessengerBot = require('messenger-bot');
var messengerBotClient = new MessengerBot({ token: process.env.FB_PAGE_ACCESS_TOKEN });

var user = require('../../models/user');
var sleep = require('../../models/sleep');

var constants = require('../constants');
var dateAndTimeUtil = require('../../utility/date_and_time_util');

schedule.scheduleJob('45 5-23 * * *', notifySleep);
schedule.scheduleJob('0 0 * * *', resetNotifyFlag);

async function notifySleep() {
	var usersToNotify = await user.getAllUsersWithNotifiedSleepFalse();
	var numOfUsers = usersToNotify.length;
	for (var i = 0; i < numOfUsers; i++) {
		var flag = false;
		var date = dateAndTimeUtil.dateToString(new Date());
		var fbUserId = usersToNotify[i];

		var mainSleepExists = await sleep.mainSleepExists(fbUserId, date);
		if (mainSleepExists === false) continue;
		
		var mainSleepLevelsData = await sleep.getMainSleepLevelsData(fbUserId, date);
		var lengthOfData = mainSleepLevelsData.length;
		if (lengthOfData === 0) { // User does not have break down of their sleep (i.e. they manually added a sleep log)
			return;
		}

		var maxAwake = 0; // Time awake in seconds
		var tmp = 0;
		var timeOfAwake = 0;
		for (var j = 0; j < lengthOfData; j++) {
			timeOfAwake = dateAndTimeUtil.getTimeFromDateString(mainSleepLevelsData[j].dateTime);
			for (var k = j; k < lengthOfData; k++) {
				var data = mainSleepLevelsData[k];
				if (data.level === 'awake' || data.level === 'restless') tmp += data.seconds;
				else break;
			}
			if (tmp > maxAwake) maxAwake = tmp;
			tmp = 0;
		}

		if (maxAwake >= 600) flag = true;
		
		if (flag) {
			await user.updateBotRequested(fbUserId, constants.NOTIFIED_SLEEP);
			var minutesAwake = Math.floor(maxAwake / 60);
			var msg1 = 'Hey! I noticed a disturbance in your sleep last night: you were awake at ' + timeOfAwake
						+ ' for ' + minutesAwake + ' minutes.';
			var msg2 = 'Could we have a little chat about that?'; 
			await fbMessengerBotClient.sendTextMessage(fbUserId, msg1);
        	fbMessengerBotClient.sendQuickReplyMessage(fbUserId, msg2, constants.QUICK_REPLIES_YES_OR_NO);
        } else {
        	var button =
        		[{
        			"content_type": "text",
        			"title": "got it",
        			"payload": "got it"
        		}];
        	var msg = 'Hey! I analysed your sleep and you had no sleep disturbances last night, which is great!';
        	await user.setNotifiedSleepToTrue(fbUserId);
        	fbMessengerBotClient.sendQuickReplyMessage(fbUserId, msg, button);
        }
	}
}

async function resetNotifyFlag() {
	user.reset();
}