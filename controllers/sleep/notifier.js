var schedule = require('node-schedule');
var fbMessengerBot = require('fb-messenger-bot-api');
var fbMessengerBotClient = new fbMessengerBot.Client(process.env.FB_PAGE_ACCESS_TOKEN);
var MessengerBot = require('messenger-bot');
var messengerBotClient = new MessengerBot({ token: process.env.FB_PAGE_ACCESS_TOKEN });

var user = require('../../models/user');
var sleep = require('../../models/sleep');

var constants = require('../constants');
var dateAndTimeUtil = require('../../utility/date_and_time_util');

schedule.scheduleJob('56 9-22 * * *', notifySleep);
//schedule.scheduleJob('0 9-22 * * *', notifySleep);
schedule.scheduleJob('0 0 * * *', resetNotifyFlag);

async function notifySleep() {
	var usersToNotify = await user.getAllUsersWithNotifiedSleepFalse();
	console.log('notifying: ', usersToNotify);
	var numOfUsers = usersToNotify.length;
	for (var i = 0; i < numOfUsers; i++) {
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

		var minutesAsleep = await sleep.getMinutesAsleep(fbUserId, date);

		if (maxAwake >= 600) {
			await user.setMainContext(fbUserId, constants.NOTIFIED_SLEEP);
			await user.setSleepDisturbedToTrue(fbUserId);

			var minutesAwake = Math.floor(maxAwake / 60);
			var msg1 = 'Hey! I noticed a disturbance in your sleep last night: you were awake at ' + timeOfAwake
						+ ' for ' + minutesAwake + ' minutes.';
			var msg2 = 'Could we have a little chat about that?'; 

			if (minutesAsleep >= 420) {
				await fbMessengerBotClient.sendTextMessage(fbUserId, msg1);
        		fbMessengerBotClient.sendQuickReplyMessage(fbUserId, msg2, constants.QUICK_REPLIES_YES_OR_NO);
        	} else {
        		var msg = 'Also you slept for only ' + (minutesAsleep/60) + ' hours and ' + (minutesAsleep%60) 
        					+ ' minutes, which is below the recommended amount of sleep.';
        		await fbMessengerBotClient.sendTextMessage(fbUserId, msg1);
        		await fbMessengerBotClient.sendTextMessage(fbUserId, msg);
        		fbMessengerBotClient.sendQuickReplyMessage(fbUserId, msg2, constants.QUICK_REPLIES_YES_OR_NO);
        	}
        } else if (minutesAsleep < 420) {
        	await user.setMainContext(fbUserId, constants.NOTIFIED_SLEEP);
        	var msg1 = 'Hey! I analysed your sleep last night and you did not appear to have any sleep disturbances, which is great!';
        	var msg2 = 'But you slept for only ' + (minutesAsleep/60) + ' hours and ' + (minutesAsleep%60) 
        					+ ' minutes, which is below the recommended amount of sleep.';
        	var msg3 = 'Could we have a little chat about that?'; 
        	await fbMessengerBotClient.sendTextMessage(fbUserId, msg1);
        	await fbMessengerBotClient.sendTextMessage(fbUserId, msg2);
        	fbMessengerBotClient.sendQuickReplyMessage(fbUserId, msg3, constants.QUICK_REPLIES_YES_OR_NO);
        } else {
        	var msg = 'Hey! I analysed your sleep last night and you did not appear to have any sleep disturbances, which is great!';
        	await user.setNotifiedSleepToTrue(fbUserId);
        	fbMessengerBotClient.sendTextMessage(fbUserId, msg);
        }
	}
}

async function resetNotifyFlag() {
	user.reset();
}