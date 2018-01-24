var MongoClient = require('mongodb').MongoClient;

exports.getBackground = async (fbUserId) => {
	const db = await MongoClient.connect(process.env.MONGODB_URI);
    const result = await db.collection('background').find({ fbUserId_: fbUserId }).toArray();
    db.close();
    return result;
};

exports.updateUser = async (fbUserId, context, value) => {
	const db = await MongoClient.connect(process.env.MONGODB_URI);

	var obj = {};
	obj[context] = value;
	await db.collection('background').updateOne({ fbUserId_: fbUserId }, { $set: obj });

    /*if (context == constants.BACKGROUND_GET_UP_TEXT) await db.collection('background').updateOne({ fbUserId_: fbUserId }, { $set: { get_up: value } });
    else if (context == constants.BACKGROUND_GO_TO_BED_TEXT) await db.collection('background').updateOne({ fbUserId_: fbUserId }, { $set: { go_to_bed: value } });
    else if (context == constants.BACKGROUND_ELECTRONICS_TEXT) await db.collection('background').updateOne({ fbUserId_: fbUserId }, { $set: { electrnics: value } });
    else if (context == constants.BACKGROUND_STRESSED_TEXT) await db.collection('background').updateOne({ fbUserId_: fbUserId }, { $set: { stressed: value } });
    else if (context == constants.BACKGROUND_EAT_TEXT) await db.collection('background').updateOne({ fbUserId_: fbUserId }, { $set: { eat: value } });
    else if (context == constants.BACKGROUND_ALCOHOL_NICOTINE_TEXT) await db.collection('background').updateOne({ fbUserId_: fbUserId }, { $set: { alcohol_nicotine: value } });
    else if (context == constants.BACKGROUND_CAFFEINE_TEXT) await db.collection('background').updateOne({ fbUserId_: fbUserId }, { $set: { caffeine: value } });
    else if (context == constants.BACKGROUND_LIGHTS_TEXT) await db.collection('background').updateOne({ fbUserId_: fbUserId }, { $set: { lights: value } });
    else if (context == constants.BACKGROUND_QUIET_TEXT) await db.collection('background').updateOne({ fbUserId_: fbUserId }, { $set: { quiet: value } });
    else if (context == constants.BACKGROUND_EXCERCISE_TEXT) await db.collection('background').updateOne({ fbUserId_: fbUserId }, { $set: { excercise: value } });
    else if (context == constants.BACKGROUND_JOB_TEXT) await db.collection('background').updateOne({ fbUserId_: fbUserId }, { $set: { job: value } });
    else if (context == constants.BACKGROUND_WORK_SCHEDULE_TEXT) await db.collection('background').updateOne({ fbUserId_: fbUserId }, { $set: { work_schedule: value } });
    */db.close();
};