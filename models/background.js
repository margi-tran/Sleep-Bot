var MongoClient = require('mongodb').MongoClient;

exports.getBackground = async (fbUserId) => {
	const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('background').find({ fbUserId_: fbUserId }).toArray();
    db.close();
    return result;
};

exports.updateBackground = async (fbUserId, messageObj) => {
	const db = await MongoClient.connect(process.env.MONGODB_URI);
    await db.collection('background').updateOne({ fbUserId_: fbUserId }, { $set: messageObj });
    db.close();
};