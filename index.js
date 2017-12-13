var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();

var fbVerificationHandler = require('./facebook/verification_handler');
var webhook = require('./facebook/webhook');

var Fitbit = require('fitbit-node');
var client = new Fitbit(process.env.FITBIT_CLIENT_ID , process.env.FITBIT_CLIENT_SECRET);
var redirect_uri = "https://calm-scrubland-31682.herokuapp.com/fitbit_oauth_callback";
var scope = "activity profile";

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'), function() {
    console.log('Running on port', app.get('port'));
});

app.get('/', function (req, res) {
    res.send('Chatbot is alive!');
});

app.get('/', fbVerificationHandler);
app.post('/webhook/', webhook);

app.get('/fitbit', function(req, res) {
	res.redirect(client.getAuthorizeUrl(scope, redirect_uri));
});

app.get('/fitbit_oauth_callback', function(req, res) {
	client.getAccessToken(req.query.code, redirect_uri).then(function (result) {
            client.get("/profile.json", result.access_token).then(function(profile) {
                res.send('TEST: ' + profile);
            })
        })
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
});*/
