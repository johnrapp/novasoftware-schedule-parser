var cheerio = require('cheerio');

module.exports = function parseClickedLesson(body) {
	var $ = cheerio.load(body);

	var rows = $('tr').get();

	//The time is usually in the first row
	var timeElement = rows.shift();
	var time = getText(timeElement);

	if(/^Block:/.test(time)) {
		//Take the next row
		time = getText(rows.shift());
	}

	var times = time.split(' - ');
	var startTime = times[0];
	var endTime = times[1];

	//There is always one redundant row in the end
	rows.pop();

	var details = rows.map(function(element) {
		var columns = $(element).children().get().map(getText);
		var course = columns[0];
		var teacher = columns[1];
		var unknown = columns[2];
		var location = columns[3];

		return {
			course: course,
			teacher: teacher,
			unknown: unknown,
			location: location,
		}
	});

	function getText(element) {
		return $(element).text();
	}

	return {
		startTime: startTime,
		endTime: endTime,
		details: details
	};
}