var MongoClient = require('mongodb').MongoClient;

exports.isUserNew = async (fbUserId) => {
	const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('users').find({ fbUserId_: fbUserId }).toArray();
    db.close();
    return result[0].userIsNew;
};

exports.isAUser = async (fbUserId) => {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('users').find({ fbUserId_: fbUserId }).toArray();

    console.log('res:  ' , result)
    db.close();
    if (result.length === 0) return false;
    else return true;
};

exports.getBotRequested = async (fbUserId) => {
	const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('users').find({ fbUserId_: fbUserId }).toArray();
    db.close();
    return result[0].botRequested;
};

exports.updateBotRequested = async (fbUserId, nextQuestion) => {
	const db = await MongoClient.connect(process.env.MONGODB_URI);
    await db.collection('users').updateOne({ fbUserId_: fbUserId }, { $set: { botRequested: nextQuestion } });
    db.close();
};

exports.updateUser = async (fbUserId, obj) => {
	const db = await MongoClient.connect(process.env.MONGODB_URI);
    await db.collection('users').updateOne({ fbUserId_: fbUserId }, { $set: obj });
    db.close();
};

exports.addUser = async (fbUserId) => {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    var newUser = 
        { 
            fbUserId_: fbUserId, 
            botRequested: constants.FITBIT_AUTH,
            userIsNew: true
        };
    await db.collection('users').insertOne(newUser);
    db.close();
};