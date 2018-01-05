module.exports = (req, res) => {
  	try {
  		res.send('Margi\'s project');
  	} catch (err) {
  		console.log('[ERROR]', err);
  	}
};