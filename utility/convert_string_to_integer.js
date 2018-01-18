module.exports = async (numberString) => {
	var arr = numberString.split('');
	var number = arr[0] + arr[1];
	return parseInt(number);
};