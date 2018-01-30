var MongoClient = require('mongodb').MongoClient;

exports.updateSleepAnswer = async (fbUserId, context, value) => {
	const db = await MongoClient.connect(process.env.MONGODB_URI);
	var obj = {};
	obj[context] = value;
	await db.collection('sleep_answers').updateOne({ fbUserId_: fbUserId }, { $set: obj });
	db.close();
};

exports.addNewUser = async (fbUserId) => {
    var user = 
        { 
            fbUserId_: fbUserId, 
            electronics: null,
            stressed: null,
            eat: null,
            alcohol_nicotine: null,
            caffeine: null,
            lights: null,
            quiet: null,
        };
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    await db.collection('sleep_answers').insertOne(user);
    db.close();
};