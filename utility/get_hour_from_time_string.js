module.exports = (numberString) => {
	var arr = numberString.split('');
	return parseInt(arr[0] + arr[1]);
};