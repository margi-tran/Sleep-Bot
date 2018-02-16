var MongoClient = require('mongodb').MongoClient;

exports.getExplanation = async (factor) => {
	const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('factors').find({ factor: factor }).toArray();
    db.close();
    return result[0].explanation;
};

exports.getConsequences = async () => {
	const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('factors').find({ type: 'consequences' }).toArray();
    db.close();
    return result[0].explanations;
}