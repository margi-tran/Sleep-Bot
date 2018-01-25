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
