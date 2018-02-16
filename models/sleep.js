var MongoClient = require('mongodb').MongoClient;

var dateAndTimeUtil = require('../utility/date_and_time_util');

exports.insertSleepData = async (fbUserId, date, sleepData) => {
    var sleepDataDoc = 
        { 
            fbUserId_: fbUserId,
            date: date,
            sleep_data: sleepData
        };
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    db.collection('sleep_data').update({ fbUserId_: fbUserId, date: date }, sleepDataDoc, { upsert : true });
    db.close();
};

exports.mainSleepExists = async (fbUserId, date) => {
    var flag = await getMainSleep(fbUserId, date);
    if (flag === null) return false;
    else return true;
};

exports.getMainSleepLevelsData = async (fbUserId, date) => {
    var mainSleep = await getMainSleep(fbUserId, date);
    return mainSleep.levels.data;
};

exports.getSleepStartTime = async (fbUserId, date) => {
    var mainSleep = await getMainSleep(fbUserId, date);
    if (mainSleep === null) return null;
    else return dateAndTimeUtil.getTimeFromDateString(mainSleep.startTime);
}

exports.getSleepEndTime = async (fbUserId, date) => {
    var mainSleep = await getMainSleep(fbUserId, date);
    if (mainSleep === null) return null;
    else return dateAndTimeUtil.getTimeFromDateString(mainSleep.endTime);
}

async function getMainSleep(fbUserId, date) {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('sleep_data').find({ fbUserId_: fbUserId, date: date }).toArray();
    db.close();
    if (result === undefined || result.length === 0) return null;
    var sleepArr = result[0].sleep_data.sleep;
    if (sleepArr === null || sleepArr === []) return null;
    for (i = 0; i < sleepArr.length; i++) {
        sleepItem = sleepArr[i];
        if (sleepItem.isMainSleep) 
            return sleepItem;
    }
}