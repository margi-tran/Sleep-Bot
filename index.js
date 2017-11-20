//https://botcube.co/blog/2017/02/23/tutorial-create-smart-facebook-messenger-chatbot-with-node-js-and-api-ai-nlp.html
const verification_handler = require('./verification.js');
const message_handler = require('./message_handler.js');

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
app.post('/webhook/', message_handler);



