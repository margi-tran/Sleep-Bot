var path = require('path');

module.exports = (req, res) => {
  	try {
  		res.sendFile(path.join(__dirname + '/../views/home.html'));
  	} catch (err) {
  		console.log('[ERROR]', err);
  		res.send('An error occurred. Please contact admin for assistance.' + '\n[ERROR] (home) ' + err);
  	}
};