var MongoClient = require('mongodb').MongoClient;

exports.userIsAuthenticated = async (fbUserId) => {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('fitbit_auths').find({ fbUserId_: fbUserId }).toArray();
    db.close();
    if (result != 0) return true;
    else return false;
}

exports.getAccessToken = async (fitbitId) => {
	const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('fitbit_auths').find({ fitbitId_: fitbitId }).toArray();
    db.close();
    return result[0].accessToken;
};

exports.getRefreshAccessToken = async (fitbitId) => {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('fitbit_auths').find({ fitbitId_: fitbitId }).toArray();
    db.close();
    return result[0].refreshAccessToken;
};

exports.getFbUserId = async (fitbitId) => {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('fitbit_auths').find({ fitbitId_: fitbitId }).toArray();
    db.close();
    return result[0].fbUserId_;
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

exports.updateFitbitTokens = async (fitbitId, newAccessToken, newRefreshToken) => {
    const db = await MongoClient.connect(process.env.MONGODB_URI);
    await db.collection('fitbit_auths').updateOne({ fitbitId_: fitbitId }, { $set: { accessToken: newAccessToken, refreshAccessToken: newRefreshToken } });
    db.close();
}