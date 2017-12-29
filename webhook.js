/**
 * Module for handling Facebook messages recieved from the webhook.
 */


var processMessage = require('./process_message');
var processPostback = require('./process_postback');


module.exports = async (req, res) => {
	try {
    	if (req.body.object === 'page') {
    		if(req.body.entry === undefined) return;
       		req.body.entry.forEach(entry => {
        		if(entry.messaging === undefined) return;
            	entry.messaging.forEach(event => {
					if (event.message) {
						console.log('cookies', req.cookies);
						processMessage(event, req);
					}
					else if(event.postback) {
						res.cookie('fb_id', event.sender.id);
						processPostback(event);
					} else {
						console.log('(webhook.js) Invalid event recieved.');
					}
         		});
    		});
    		res.status(200).end();
    	}
    } catch (err) {
    	console.log('ERROR (webhook.js): ', err);
    }
};


/*
module.exports = async (req, res) => {
	try {
		var data = req.body;
  
  		// Make sure this is a page subscription
  		if (data.object == 'page') {

    		if(data.entry === undefined) {
    			console.log('ERROR: at data.entry');
    			return;
    		}

    		// Iterate over each entry
    		// There may be multiple if batched
    		data.entry.forEach(function(pageEntry) {
      			var pageID = pageEntry.id;
      			var timeOfEvent = pageEntry.time;

      			if(pageEntry.messaging === undefined) {
    				console.log('ERROR: at pageEntry.messaging');
    				return;
    			}
    
      			// Iterate over each messaging event
      			pageEntry.messaging.forEach(function(messagingEvent) {
         			if (messagingEvent.message) {
         				processMessage(messagingEvent);
        			} else if (messagingEvent.postback) {
        				console.log("WOW");
        				processPostback(messagingEvent);
        			} else {
          			console.log("Webhook received unknown messagingEvent: ", messagingEvent);
        			}
      			});
    		});

    	// Assume all went well.
    	//
    	// You must send back a 200, within 20 seconds, to let us know you've 
    	// successfully received the callback. Otherwise, the request will time out.
    	res.sendStatus(200);
		} 
	} catch (err) {
		console.log('find it:', err);
	}
}
*/



