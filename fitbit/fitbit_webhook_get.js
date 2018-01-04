module.exports = (req, res) => {
	if (req.query.verify != process.env.FITBIT_VERIFICATION_CODE) {
		console.log('Cannot verify Fitbit webhook.');
		res.sendStatus(404); 
	} 
    else {
    	console.log('Fitbit webhook verified.');
        res.sendStatus(204);         
    }
}