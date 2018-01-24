var MongoClient = require('mongodb').MongoClient;

exports.updateBotRequested = async (fbUserId, nextQuestion) => {
	const db = await MongoClient.connect(process.env.MONGODB_URI);
    await db.collection('users').updateOne({ fbUserId_: fbUserId }, { $set: { botRequested: nextQuestion } });
    db.close();
};