var MongoClient = require('mongodb').MongoClient;

var fbMessengerBot = require('fb-messenger-bot-api');
var fbMessengerBotClient = new fbMessengerBot.Client(process.env.FB_PAGE_ACCESS_TOKEN);
var MessengerBot = require('messenger-bot');
var messengerBotClient = new MessengerBot({token:process.env.FB_PAGE_ACCESS_TOKEN});

var fitbitClient = require('../../utility/fitbit_client');
var convertDate = require('../../utility/convert_date');

module.exports = async (req, res) => {
	console.log('WAS CALLED YEP');
	try {
		fbUserId = req.cookies.fbUserId;

		// If this cookie is not set then this route is being accessed illegally
		if(fbUserId === undefined) {
			res.send('You may not proceed beyond this page. Please contact Margi for assistance.'
						+ '\n[ERROR] (/fitbit_oauth_callback) fbUserId is undefined.');
			return;
		} 

		// Check whether or not the user has already authenticated their Fitbit with the server
		const db = await MongoClient.connect(process.env.MONGODB_URI);
        const result = await db.collection('fitbit_auths').find({ fbUserId_: fbUserId }).toArray();   
        if(result != 0) {
        	res.send('You have already authenticated Fitbit with SleepBot.');
        	return;
        }

		const accessTokenPromise = await fitbitClient.client.getAccessToken(req.query.code, fitbitClient.redirectUri);
		const sleepData = await fitbitClient.client.get('/sleep/date/' + convertDate(new Date()) + '.json', accessTokenPromise.access_token);

        var newUser = { fbUserId_: fbUserId, 
                    fitbitId_: accessTokenPromise.user_id,
                    accessToken: accessTokenPromise.access_token,
                    refreshAccessToken: accessTokenPromise.refresh_token };
        await db.collection('fitbit_auths').insertOne(newUser);
        db.close();

        fitbitClient.client.post("/foods/apiSubscriptions/1.json", accessTokenPromise.access_token).then( (results) => {
       		console.log('subscribeToFoods:', results[0]);
    	}).catch( (results) => {
        	console.log(results[0].errors);
    	});

        res.send(sleepData);
		//res.send("You have successfully authenticated your Fitbit with me. Please go back and talk to SleepBot, he is waiting for you.");
		
		fbMessengerBotClient.sendTextMessage(fbUserId, 'Great, you have given me permission to access to your health data on Fitbit.');
		fbMessengerBotClient.sendTextMessage(fbUserId, 
			'First, I would like to get an idea about your current sleep health so I\'m going to ask you a few questions.');
	} catch (err) {
		console.log(err);
		res.send('[ERROR]: ' + err);
	}
};