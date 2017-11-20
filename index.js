const verification_handler = require('./verification_handler');
const webhook = require('./webhook');

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'), function() {
    console.log('Running on port', app.get('port'));
});

app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot');
});

app.get('/', verification_handler);
app.post('/webhook/', webhook);



// initialize the Fitbit API client
var FitbitApiClient = require("fitbit-node"),
    client = new FitbitApiClient("22CL2K", "444721774e8d953b9fcf3cd594113a39");

// redirect the user to the Fitbit authorization page
app.get("/authorize", function (req, res) {
    // request access to the user's activity, heartrate, location, nutrion, profile, settings, sleep, social, and weight scopes
    res.redirect(client.getAuthorizeUrl('activity heartrate location nutrition profile settings sleep social weight', 'https://calm-scrubland-31682.herokuapp.com/'));
});

// handle the callback from the Fitbit authorization flow
app.get("/callback", function (req, res) {
	console.log("**************sucess***************");
    // exchange the authorization code we just received for an access token
    client.getAccessToken(req.query.code, 'https://calm-scrubland-31682.herokuapp.com/').then(function (result) {
        // use the access token to fetch the user's profile information
        client.get("/profile.json", result.access_token).then(function (results) {
            res.send(results[0]);
        });
    }).catch(function (error) {
        res.send(error);
    });
});