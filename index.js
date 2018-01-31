var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var cookieParser = require('cookie-parser');
var MongoClient = require('mongodb').MongoClient;
var fbMessengerBot = require('fb-messenger-bot-api');
var fbMessengerBotClient = new fbMessengerBot.Client(process.env.FB_PAGE_ACCESS_TOKEN);
var MessengerBot = require('messenger-bot');
var messengerBotClient = new MessengerBot({ token:process.env.FB_PAGE_ACCESS_TOKEN });

var routeHandlers = require('./controllers/route_handlers');
var sleepNotifier = require('./controllers/sleep/notifier');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());
app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'), () => {
    console.log('Running on port', app.get('port'));
});

app.get('/', routeHandlers.rootHandler);
app.get('/', routeHandlers.fbVerification);
app.post('/webhook/', routeHandlers.fbWebhook);
app.get('/fitbit_webhook', routeHandlers.fitbitWebhookGet);
app.post('/fitbit_webhook', routeHandlers.fitbitWebhookPost);
app.get('/prepare_fitbit_auth', routeHandlers.prepareFitbitAuth);
app.get('/fitbit', routeHandlers.fitbitRedirect);
app.get('/fitbit_oauth_callback', routeHandlers.fitbitOAuthCallback);
