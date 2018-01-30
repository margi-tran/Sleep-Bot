var schedule = require('node-schedule');

var MongoClient = require('mongodb').MongoClient;

schedule.scheduleJob('35 03 * * *', task1);
schedule.scheduleJob('11 03 * * *', task2);
schedule.scheduleJob('11 03 * * *', task3);

async function task1() {
	try {
		console.log('Scheduled Task 1');

		const db = await MongoClient.connect(process.env.MONGODB_URI);
    	const users = await db.collection('users').find().toArray();

    	console.log(users);

    	users.forEach(function(user) {
    		console.log(user.name);
    	});
	} catch (err) {
		console.log('[ERROR]', err);
	}
}

function task2() {
	console.log('Scheduled Task 2');
}

function task3() {
	console.log('Scheduled Task 3');
}



