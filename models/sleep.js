var MongoClient = require('mongodb').MongoClient;

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

exports.getMainSleep = async (fbUserId, date) => {
	var sleepData = null;
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('sleep_data').find({ fbUserId_: fbUserId, date: date }).toArray();
    db.close();
	var sleepArr = result[0].sleep_data.sleep;

	/*
    sleepArr.forEach(function(sleepItem) {
        if(sleepItem.isMainSleep) {sleepData = sleepItem;
        	return 'xDDD';
        }
    });*/

    for(i = 0; i < sleepArr.length; i++) {
    	sleepItem = sleepArr[i];
    	if(sleepItem.isMainSleep) {
    		console.log('here');
        	return 'xDDD';
        }
    }

    return sleepData;
};


