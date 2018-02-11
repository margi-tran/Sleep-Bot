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

exports.getMainContext = async (fbUserId) => {
	const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('users').find({ fbUserId_: fbUserId }).toArray();
    db.close();
    return result[0].mainContext;
};

exports.setMainContext = async (fbUserId, mainContext) => {
	const db = await MongoClient.connect(process.env.MONGODB_URI);
    await db.collection('users').updateOne({ fbUserId_: fbUserId }, { $set: { mainContext: mainContext } });
    db.close();
};

exports.getSubContext = async (fbUserId) => {
	const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('users').find({ fbUserId_: fbUserId }).toArray();
    db.close();
    return result[0].subContext;
};

exports.setSubContext = async (fbUserId, subContext) => {
	const db = await MongoClient.connect(process.env.MONGODB_URI);
    await db.collection('users').updateOne({ fbUserId_: fbUserId }, { $set: { subContext: subContext } });
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
            mainContext: constants.FITBIT_AUTH,
            subContext: null,
            userIsNew: true,
            notifiedSleep: null,
        };

    const db = await MongoClient.connect(process.env.MONGODB_URI);
    await db.collection('users').insertOne(newUser);
    db.close();
};

exports.setNotifiedSleepToTrue = async (fbUserId) => {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    await db.collection('users').updateOne({ fbUserId_: fbUserId }, { $set: { notifiedSleep: true } });
    db.close();
};

exports.setNotifiedSleepToFalse = async (fbUserId) => {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    await db.collection('users').updateOne({ fbUserId_: fbUserId }, { $set: { notifiedSleep: false } });
    db.close();
};

exports.reset = async () => {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    await db.collection('users').updateMany({ notifiedSleep: true }, { $set: { notifiedSleep: false, botRequested: null } });
    db.close();
};

exports.getNotifiedSleep = async (fbUserId) => {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('users').find({ fbUserId_: fbUserId }).toArray();
    db.close();
    return result[0].notifiedSleep;
};

exports.getAllUsersWithNotifiedSleepTrue = async () => {
    var arr = [];
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    const users = await db.collection('users').find().toArray();
    db.close();
    await users.forEach(function(user) {
        if (user.notifiedSleep) arr.push(user.fbUserId_);
    });
    return arr;
};

exports.getAllUsersWithNotifiedSleepFalse = async () => {
    var arr = [];
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    const users = await db.collection('users').find().toArray();
    db.close();
    await users.forEach(function(user) {
        if (user.notifiedSleep === false) arr.push(user.fbUserId_);
    });
    return arr;
};

