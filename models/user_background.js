const db = await MongoClient.connect(process.env.MONGODB_URI);

exports.getBackground = async (fbUserId) => {
    const result = await db.collection('background').find({ fbUserId_: fbUserId }).toArray();
    return result;
};