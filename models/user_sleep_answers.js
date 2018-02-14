var MongoClient = require('mongodb').MongoClient;

exports.updateSleepAnswer = async (fbUserId, context, value) => {
	const db = await MongoClient.connect(process.env.MONGODB_URI);
	var obj = {};
	obj[context] = value;
	await db.collection('sleep_answers').updateOne({ fbUserId_: fbUserId }, { $set: obj });
	db.close();
};

exports.addNewUser = async (fbUserId) => {
    var user = 
        { 
            fbUserId_: fbUserId, 
            electronics: null,
            stressed: null,
            eat: null,
            alcohol: null,
            nicotine: null,
            caffeine: null,
            lights: null,
            quiet: null
        };
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    await db.collection('sleep_answers').insertOne(user);
    db.close();
};

exports.getElectronicsAnswer(fbUserId, factor) {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('sleep_answers').find({ fbUserId_: fbUserId }).toArray();
    db.close();
    return result[0].electronics;
}

exports.getStressedAnswer(fbUserId, factor) {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('sleep_answers').find({ fbUserId_: fbUserId }).toArray();
    db.close();
    return result[0].stressed;
}

exports.getEatAnswer(fbUserId, factor) {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('sleep_answers').find({ fbUserId_: fbUserId }).toArray();
    db.close();
    return result[0].eat;
}

exports.getAlcoholAnswer(fbUserId, factor) {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('sleep_answers').find({ fbUserId_: fbUserId }).toArray();
    db.close();
    return result[0].alcohol;
}

exports.getNicotineAnswer(fbUserId, factor) {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('sleep_answers').find({ fbUserId_: fbUserId }).toArray();
    db.close();
    return result[0].nicotine;
}

exports.getCaffeineAnswer(fbUserId, factor) {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('sleep_answers').find({ fbUserId_: fbUserId }).toArray();
    db.close();
    return result[0].caffeine;
}

exports.getLightsAnswer(fbUserId, factor) {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('sleep_answers').find({ fbUserId_: fbUserId }).toArray();
    db.close();
    return result[0].lights;
}

exports.getQuietAnswer(fbUserId, factor) {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('sleep_answers').find({ fbUserId_: fbUserId }).toArray();
    db.close();
    return result[0].quiet;
}
