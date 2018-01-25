var MongoClient = require('mongodb').MongoClient;

exports.getBackground = async (fbUserId) => {
	const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('background').find({ fbUserId_: fbUserId }).toArray();
    db.close();
    return result;
};

exports.getGetUp = async (fbUserId) => {
	const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('background').find({ fbUserId_: fbUserId }).toArray();
    db.close();
    return result[0].get_up;
};

exports.getGoToBed = async (fbUserId) => {
	const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('background').find({ fbUserId_: fbUserId }).toArray();
    db.close();
    return result[0].go_to_bed;
};

exports.updateBackground = async (fbUserId, context, value) => {
	const db = await MongoClient.connect(process.env.MONGODB_URI);
	var obj = {};
	obj[context] = value;
	await db.collection('background').updateOne({ fbUserId_: fbUserId }, { $set: obj });
	db.close();
};

exports.addNewUserBackground = async (fbUserId, age) => {
    var background = 
        { 
            fbUserId_: fbUserId, 
            age: age,                
            get_up: null,
            go_to_bed: null,
            electronics: null,
            stressed: null,
            eat: null,
            alcohol_nicotine: null,
            caffeine: null,
            lights: null,
            quiet: null,
            excercise: null,
            job: null,
            work_schedule: null
        };
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    await db.collection('background').insertOne(background);
};
