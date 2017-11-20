const verification_handler = require('./verification_handler.js');
const webhook = require('./webhook.js');

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

app.get('/', verification_handler);
app.post('/webhook/', webhook);



