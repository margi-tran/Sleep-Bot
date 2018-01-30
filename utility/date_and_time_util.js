/**
 * The body of this function was taken from from http://www.template-tuners.com/fitbit/
 */
exports.dateToString = (date) => {
	var yyyy = date.getFullYear().toString();
	var mm = (date.getMonth()+1).toString();
	var dd  = date.getDate().toString();
	var mmChars = mm.split('');
	var ddChars = dd.split('');
	return yyyy + '-' + (mmChars[1]?mm:"0"+mmChars[0]) + '-' + (ddChars[1]?dd:"0"+ddChars[0]);
}

exports.getHourFromTimeString = (timeString) => {
	var arr = timeString.split(':');
	return parseInt(arr[0]);
};