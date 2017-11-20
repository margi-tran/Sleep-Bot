const token = "EAAFxZC8LaXgYBAJ9EJDT5U2XL00BnZADlH4OePZBvBO0FbR7da1ak9fgbyJ84GGje0TvTod1bH6ZCZAKYFLMJCyuB7lzzF6FFJ157zLFAkvqbQM9vZC58g2f5ZAYQZBtZAuzD9dhu7juSi0Q1cctCpZBjKvQ059P2LhzSfmgfCowifHC7SUVZBFsjCY"

//https://botcube.co/blog/2017/02/23/tutorial-create-smart-facebook-messenger-chatbot-with-node-js-and-api-ai-nlp.html
const verificationController = require('./verification.js');
const message_handler = require('./message_handler.js');

var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var app = express()

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded 
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot')
})

/*
// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_token') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})*/
app.get('/', verificationController);

// from https://chatbotsmagazine.com/have-15-minutes-create-your-own-facebook-messenger-bot-481a7db54892
app.post('/webhook/', function (req, res) {
	message_handler.handleMessage();
    messaging_events = req.body.entry[0].messaging
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i]
        sender = event.sender.id
        if (event.message && event.message.text) {
            text = event.message.text
            sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200))
        }
    }
    res.sendStatus(200)
})

// from https://chatbotsmagazine.com/have-15-minutes-create-your-own-facebook-messenger-bot-481a7db54892
function sendTextMessage(sender, text) {
    messageData = {
        text:text
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}
