var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var async = require('async');
var MongoClient = require('mongodb').MongoClient;

var fbVerificationHandler = require('./verification_handler');
var webhook = require('./webhook');

var Fitbit = require('fitbit-node');
var client = new Fitbit(process.env.FITBIT_CLIENT_ID , process.env.FITBIT_CLIENT_SECRET);
var redirect_uri = "https://calm-scrubland-31682.herokuapp.com/fitbit_oauth_callback";
var scope = "profile sleep activity";

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'), function() {
    console.log('Running on port', app.get('port'));
});

app.get('/', async function (req, res) {
  	try {
  		//mongodb://admin_margi:pw_margi@ds139436.mlab.com:39436/honours_proj
  		const db = await MongoClient.connect("mongodb://admin_margi:pw_margi@ds139436.mlab.com:39436/honours_proj");
  		const testcollection = db.collection('firstcol');

  		var query = {};
  		const res1 = await testcollection.find(query).toArray();
  		res.send(res1);
  	} catch (err) {
  		console.log("ERROR: " + err);
  	}
});

app.get('/', fbVerificationHandler);

app.get('/fitbit', function(req, res) {
	res.redirect(client.getAuthorizeUrl(scope, redirect_uri));
});

app.get("/fitbit_oauth_callback", async function (req, res) {
	try {
		accessToken = await client.getAccessToken(req.query.code, redirect_uri);
		profile = await client.get("/profile.json", access_token);
		res.send(profile);
	} catch (err) {
		res.send(err);
	}
});

/*
app.get("/fitbit_oauth_callback", function (req, res) { // this line from lynda
    // exchange the authorization code we just received for an access token
    client.getAccessToken(req.query.code, redirect_uri).then(function (result) {
        // use the access token to fetch the user's profile information
        client.get("/profile.json", result.access_token).then(function (profile) {
            res.send(profile);
        });
    }).catch(function (error) {
        res.send(error);
    });
});
*/

app.post('/webhook/', webhook);