var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var cookieParser = require('cookie-parser');
var MongoClient = require('mongodb').MongoClient;

var fbVerificationHandler = require('./verification_handler');
var webhook = require('./webhook');

var Fitbit = require('fitbit-node');
var client = new Fitbit(process.env.FITBIT_CLIENT_ID , process.env.FITBIT_CLIENT_SECRET);
var redirectUri = 'https://calm-scrubland-31682.herokuapp.com/fitbit_oauth_callback';
var scope = 'profile sleep activity';

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());

app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'), () => {
    console.log('Running on port', app.get('port'));
});

app.get('/', async (req, res) => {
  	try {
  		/*const db = await MongoClient.connect(process.env.MONGODB_URI);
  		const testcollection = db.collection('firstcol');
  		var query = {};
  		const result = await testcollection.find(query).toArray();

  		res.send(result);*/
  		res.send('Margi\'s project');
  	} catch (err) {
  		console.log('[ERROR] ', err);
  	}
});

app.get('/', fbVerificationHandler);

app.post('/webhook/', webhook);

app.get('/fitbit', function(req, res) {
	//res.redirect(client.getAuthorizeUrl(scope, redirectUri));

	res.redirect(client.getAuthorizeUrl('activity heartrate location nutrition profile settings sleep social weight', redirectUri));
});

app.get('/fitbit_oauth_callback', async (req, res) => {
	try {
		accessTokenPromise = await client.getAccessToken(req.query.code, redirectUri);
		//profile = await client.get("/profile.json", accessTokenPromise.access_token);
		//sleep = await client.get('/sleep/date/' + convertDate(new Date()) + '.json', accessTokenPromise.access_token);
		//water = await client.get('/foods/log/water/date/' + convertDate(new Date()) + '.json', accessTokenPromise.access_token);

		sleep = await client.get('/sleep/date/' + convertDate(new Date()) + '.json', accessTokenPromise.access_token);
		
		console.log('Cookies: ', req.cookies);
		console.log('fb user id is:', req.cookies.fbUserId);


		//res.send(water);

		res.send('ok');
	} catch (err) {
		res.send(err);
	}
});

/*
 * On the user's first time chatting to the bot, they are directed to this route.
 * This allows the user's Facebook ID to be correctly linked their Fibit ID.
 */
app.get('/prepare_fitbit_auth', (req, res) => {
	fbUserId = req.query.fbUserId;
	res.cookie('fbUserId', fbUserId);
	res.send('Hello! ' + fbUserId);
});

/*
 * This function was taken from view-source:http://www.template-tuners.com/fitbit/
 */
function convertDate(date) {
	var yyyy = date.getFullYear().toString();
	var mm = (date.getMonth()+1).toString();
	var dd  = date.getDate().toString();
	var mmChars = mm.split('');
	var ddChars = dd.split('');
	return yyyy + '-' + (mmChars[1]?mm:"0"+mmChars[0]) + '-' + (ddChars[1]?dd:"0"+ddChars[0]);
}

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

