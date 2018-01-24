const db = await MongoClient.connect(process.env.MONGODB_URI);

exports.updateBotRequested = async (fbUserId, nextQuestion) => {
    await db.collection('users').updateOne({ fbUserId_: fbUserId }, { $set: { botRequested: nextQuestion } });
};