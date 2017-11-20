const verificationHandler = require('./verification_handler');
const webhook = require('./webhook');

var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'), function() {
    console.log('Running on port', app.get('port'));
});

app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot');
});

app.get('/', verificationHandler);
app.post('/webhook/', webhook);