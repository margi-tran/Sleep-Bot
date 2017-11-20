var request = require('request')

const token = "EAAFxZC8LaXgYBAJ9EJDT5U2XL00BnZADlH4OePZBvBO0FbR7da1ak9fgbyJ84GGje0TvTod1bH6ZCZAKYFLMJCyuB7lzzF6FFJ157zLFAkvqbQM9vZC58g2f5ZAYQZBtZAuzD9dhu7juSi0Q1cctCpZBjKvQ059P2LhzSfmgfCowifHC7SUVZBFsjCY"

// from https://chatbotsmagazine.com/have-15-minutes-create-your-own-facebook-messenger-bot-481a7db54892
exports.sendTextMessage = function(sender, text) {
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