/**
 * Module for handling Facebook messages recieved from the webhook.
 */


var processMessage = require('./process_message');

/*

module.exports = async (req, res) => {
    if (req.body.object === 'page') {
        req.body.entry.forEach(entry => {
            entry.messaging.forEach(event => {
				if (event.message)
					processMessage(event);

				if(event.postback) {
					console.log("get started was pressed");
				}
         	});
    	});
    	res.status(200).end();
    }
};

*/


module.exports = async (req, res) => {
var data = req.body;

// Make sure this is a page subscription
if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
    var pageID = entry.id;
    var timeOfEvent = entry.time;

    // Iterate over each messaging event
    entry.messaging.forEach(function(event) {
        if (event.message) {
        //receivedMessage(event);
        processMessage(event);
        } else {
            // If the event is a postback and has a payload equals USER_DEFINED_PAYLOAD 
        if(event.postback && event.postback.payload === 'GET_STARTED_PAYLOAD' )
        {
                //present user with some greeting or call to action
                var msg = "Hi ,I'm a Bot ,and I was created to help you easily .... "
                console.log("get started was pressed!!!");
                //sendMessage(event.sender.id,msg);      
        }      

        }
    });
    });
    res.sendStatus(200);
}
}


