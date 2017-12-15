var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();

var fbVerificationHandler = require('./verification_handler');
var webhook = require('./webhook');

var Fitbit = require('fitbit-node');
var client = new Fitbit(process.env.FITBIT_CLIENT_ID , process.env.FITBIT_CLIENT_SECRET);
var redirect_uri = "https://calm-scrubland-31682.herokuapp.com/fitbit_oauth_callback";
var scope = "profile sleep activity";


var mongoose = require('mongoose');
var db = mongoose.connect(process.env.MONGODB_URI);

var firstcolSchema = mongoose.Schema({
	first: String,
	last: String
});
var Firstcol = mongoose.model('firstcol', firstcolSchema);

//var mongodb = require('mongodb');


app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'), function() {
    console.log('Running on port', app.get('port'));
});

app.get('/', function (req, res) {
  //  res.send('Chatbot is alive!');
  var result = Test.find();
  result.exec(function(err, results) {
  	res.send(results);
  });

  /*var MongoClient = mongodb.MongoClient;
  var url = process.env.MONGODB_URI;

  MongoClient.connect(url, function(err, db){ 
  	if (err) {
  		console.log('*UNABLE TO CONNECT');
  	} else {
  		var collection = db.collection('test');
  		collection.find({}).toArray(function(err, result){
  			if(err) {
  				res.send(err);
  			} else if (result.length) {
  				res.render('studentlist', {
  					"studentlist": result
  				});
  			} else {
  				res.send('No documents found');
  			}
  		})
  	}
  })*/

});

app.get('/', fbVerificationHandler);
app.post('/webhook/', webhook);

app.get('/fitbit', function(req, res) {
	res.redirect(client.getAuthorizeUrl(scope, redirect_uri));
});

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
