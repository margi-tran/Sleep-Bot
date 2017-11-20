module.exports = (req, res) => {
   /* const hubChallenge = req.query['hub.challenge'];

    const hubMode = req.query['hub.mode'];
    const verifyTokenMatches = (req.query['hub.verify_token'] === 'botcube is cool');

    if (hubMode && verifyTokenMatches) {
        res.status(200).send(hubChallenge);
    } else {
        res.status(403).end();
    }*/
	
	
	/*if (req.query['hub.verify_token'] === 'my_token') {
        //res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')*/
	
	if (req.query['hub.verify_token'] === 'my_token') 
        res.status(200).send(req.query['hub.challenge'])
    else
		res.status(403).send('Error, wrong token')
};

