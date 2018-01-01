/**
 * Module for processing postbacks recieved from the webhook.
 * Messages recieved from users are sent a reply.
 */


var request = require('request');
var MongoClient = require('mongodb').MongoClient;

var messageSender = require('./message_sender');

module.exports = async (event) => {
    try { 
        fbUserId = event.sender.id;

        messageSender.sendTextMessage(fbUserId, '<postback received>');

        if(event.postback.payload === 'GET_STARTED_PAYLOAD') {
            // check whether the user exists in the database
            const db = await MongoClient.connect(process.env.MONGODB_URI);
            query = { fbUserId_: fbUserId };
            result = await db.collection('fitbitauths').find(query).toArray();
            db.close();

            if(result.length == 0) { // user is not in database
                const db = await MongoClient.connect(process.env.MONGODB_URI);
                var newUser = { fbUserId_: fbUserId, 
                                fitbitId_: "",
                                accessToken: "",
                                refreshAccessToken: "" };
                await db.collection('fitbitauths').insertOne(newUser);
                db.close();

                m1 = 'Hello there, I am SleepBot! I am here to help you with any sleep disturbances you may have. '
                        + 'I can also give you advice about sleep health in general.';
                m2 = 'I will need you to give me permission to access your health data on Fitbit, to help me analyze your sleep. '
                        + 'To do so click on the following link: https://calm-scrubland-31682.herokuapp.com/prepare_fitbit_auth?fbUserId='
                        + fbUserId;
                messageSender.sendMultipleTextMessages(fbUserId, [m1, m2], 0); 
            } else { // user is in database
                messageSender.sendTextMessage(fbUserId, 'Welcome back!');
            }
            return;
        }

    } catch (err) {
        console.log('[ERROR]', err);
    }
};