var MongoClient = require('mongodb').MongoClient;

var constants = require('../controllers/constants');

exports.isUserNew = async (fbUserId) => {
	const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('users').find({ fbUserId_: fbUserId }).toArray();
    db.close();
    return result[0].userIsNew;
};

exports.isAUser = async (fbUserId) => {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('users').find({ fbUserId_: fbUserId }).toArray();
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

exports.updateBotRequested = async (fbUserId, context) => {
	const db = await MongoClient.connect(process.env.MONGODB_URI);
    await db.collection('users').updateOne({ fbUserId_: fbUserId }, { $set: { botRequested: context } });
    db.close();
};


exports.updateUser = async (fbUserId, obj) => {
	const db = await MongoClient.connect(process.env.MONGODB_URI);
    await db.collection('users').updateOne({ fbUserId_: fbUserId }, { $set: obj });
    db.close();
};

exports.updateUserIsNew = async (fbUserId, value) => {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    await db.collection('users').updateOne({ fbUserId_: fbUserId }, { $set: { userIsNew: value } });
    db.close();
};

exports.addUser = async (fbUserId) => {
    var newUser = 
        { 
            fbUserId_: fbUserId, 
            botRequested: constants.FITBIT_AUTH,
            userIsNew: true
        };
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    await db.collection('users').insertOne(newUser);
    db.close();
};