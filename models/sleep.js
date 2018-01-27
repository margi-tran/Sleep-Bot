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

/*exports.getMainSleep = async (fbUserId, date) => {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('sleep_data').find({ fbUserId_: fbUserId, date: date }).toArray();
    var sleepArr = result[0].sleep_data.sleep;

    if (sleepArr === null || sleepArr === []) 
    	return null;
    else 
    	sleepArr.forEach(function(sleepItem) {
    		console.log(sleepItem);
        	if(sleepItem.isMainSleep) {
        		console.log('in here');
        		return 'ok';
        	}
    	});



    return 'ok';
};*/

exports.getMainSleep = async (fbUserId, date) => {
	var arr = [];
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    const users = await db.collection('users').find().toArray();
    db.close();
    users.forEach(function(user) {
        if(user.notifiedSleep === false) arr.push(user.fbUserId_);
    });
    return arr;
};


