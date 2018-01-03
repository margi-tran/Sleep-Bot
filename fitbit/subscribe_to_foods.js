/*
 *
 */
 

module.exports = (accessToken) => {
    requestUrl = "/foods/apiSubscriptions/1.json";
    console.log(requestUrl);
    client.post(requestUrl, accessToken).then(function(results) {
        console.log('subscribeToFoods():', results);
        console.log(results[0]);
    }).catch(function(results) {
        console.log(results[0].errors);
    })
};    