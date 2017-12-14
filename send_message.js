const send = (userId, messageData)  => {
    return new Promise((resolve, reject) => {
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {access_token: process.env.FB_PAGE_ACCESS_TOKEN},
            method: "POST",
            json: {
                 recipient: {id: userId },
                message: messageData,
            }
        }, (error, response, body) => {
                if (error) { 
                    console.log("Error sending message: " + response.error); return reject(response.error); 
                }
                else if (response.body.error) { 
                    console.log('Response body Error: ' + response.body.error); return reject(response.body.error); 
                }

                console.log("Message sent successfully to " + userId); 
                return resolve(response);
            }
        );    
    });
};

function sendMessage(sender, text) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.FB_PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: sender},
            message: {text: text}
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
}