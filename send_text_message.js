/**
 * Module for sending a facebook message to a user.
 */


module.exports = (fbUserId, message) => {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.FB_PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: fbUserId},
            message: {text: message}
        }
    }, (error, response, body) => {
        if (error) {
            console.log('[ERROR] ', error);
        } else if (response.body.error) {
            console.log('[ERROR] ', response.body.error);
        }
    });
}