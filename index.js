var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var cookieParser = require('cookie-parser');
var MongoClient = require('mongodb').MongoClient;
var path = require('path');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());

app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'), () => {
    console.log('Running on port', app.get('port'));
});

app.get('/', (req, res) => {
  	res.send('hi');
});