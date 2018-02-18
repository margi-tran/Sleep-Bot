var MongoClient = require('mongodb').MongoClient;

exports.updateSleepAnswer = async (fbUserId, context, value, date) => {
	const db = await MongoClient.connect(process.env.MONGODB_URI);
	var obj = {};
	obj[context] = value;
	await db.collection('sleep_answers').updateOne({ fbUserId_: fbUserId, date: date }, { $set: obj });
	db.close();
};

exports.addNewUser = async (fbUserId, date) => {
    var user = 
        { 
            fbUserId_: fbUserId, 
            date: date,
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

exports.addNewEntry = async (fbUserId, date) => {
    var user = 
        { 
            fbUserId_: fbUserId, 
            date: date,
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

exports.getAnswersEntry = async (fbUserId, date) => {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('sleep_answers').find({ fbUserId_: fbUserId, date: date }).toArray();
    db.close();
    console.log('results', result);
    if (result.length === 0) return null;
    else return result[0];
}

exports.getAnswer = async (fbUserId, factor, date) => {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('sleep_answers').find({ fbUserId_: fbUserId, date: date }).toArray();
    db.close();
    var obj = result[0];
    return obj[factor];
}

exports.getElectronicsAnswer = async (fbUserId, date) => {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('sleep_answers').find({ fbUserId_: fbUserId, date: date }).toArray();
    db.close();
    return result[0].electronics;
}

exports.getStressedAnswer = async (fbUserId, date) => {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('sleep_answers').find({ fbUserId_: fbUserId, date: date }).toArray();
    db.close();
    return result[0].stressed;
}

exports.getEatAnswer = async (fbUserId, date) => {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('sleep_answers').find({ fbUserId_: fbUserId, date: date }).toArray();
    db.close();
    return result[0].eat;
}

exports.getAlcoholAnswer = async (fbUserId, date) => {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('sleep_answers').find({ fbUserId_: fbUserId, date: date }).toArray();
    db.close();
    return result[0].alcohol;
}

exports.getNicotineAnswer = async (fbUserId, date) => {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('sleep_answers').find({ fbUserId_: fbUserId, date: date }).toArray();
    db.close();
    return result[0].nicotine;
}

exports.getCaffeineAnswer = async (fbUserId, date) => {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('sleep_answers').find({ fbUserId_: fbUserId, date: date }).toArray();
    db.close();
    return result[0].caffeine;
}

exports.getLightsAnswer = async (fbUserId, date) => {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('sleep_answers').find({ fbUserId_: fbUserId, date: date }).toArray();
    db.close();
    return result[0].lights;
}

exports.getQuietAnswer = async (fbUserId, date) => {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('sleep_answers').find({ fbUserId_: fbUserId, date: date }).toArray();
    db.close();
    return result[0].quiet;
}
