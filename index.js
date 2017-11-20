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