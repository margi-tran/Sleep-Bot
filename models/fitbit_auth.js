var MongoClient = require('mongodb').MongoClient;

exports.isUserNew = async (fbUserId) => {
	const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('users').find({ fbUserId_: fbUserId }).toArray();
    db.close();
    return result[0].userIsNew;
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

exports.addNewFitbitAuth = async (fbUserId, fitbitId, accessToken, refreshAccessToken) => {
    var newFitbitAuth = 
        { 
            fbUserId_: fbUserId, 
            fitbitId_: fitbitId,
            accessToken: accessToken,
            refreshAccessToken: refreshAccessToken
        };
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    await db.collection('fitbit_auths').insertOne(newFitbitAuth);
    db.close();
};
