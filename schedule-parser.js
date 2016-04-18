var novasoftware = require('./novasoftware.js');
var pdfParser = require('./next-pdf-parser.js');
var fs = require('fs');

function parseSchedule(week, classId, className, callback) {
	novasoftware.schedulePdf(week, classId, function(err, buffer) {
		// var buffer = fs.readFileSync('schedules-vgy/13esmu.pdf');
		if(err) { return callback(err, null) }

		pdfParser(buffer, function(err, schedule) {

			if(err) { return callback(err, null) }

			schedule.className = className;
			schedule.week = week;

			var incompleteLessons = schedule.lessons.filter(function(lesson) {
				return lesson.details == null;
			});

			if(incompleteLessons.length == 0) {
				removeRedundantFields(schedule);
				return callback(null, schedule);
			}

			var coords = incompleteLessons.map(function(lesson) {
				return [Math.round(lesson.cx), Math.round(lesson.cy)];
			});

			var width = Math.round(schedule.width);
			var height = Math.round(schedule.height);

			// coords = coords.slice(0, 2);

			novasoftware.clickMultiple2(week, classId, coords, width, height, function(err, lessons) {
			// novasoftware.clickMultiple(week, classId, coords, width, height, function(err, lessons) {
				// fs.writeFileSync("tt7.json", JSON.stringify(lessons, null, '\t'));
				if(err) { return callback(err, null) }

				lessons.forEach(function(lesson, i) {
					delete lesson.details.unknown;
					incompleteLessons[i].details = lesson.details;
				});

				removeRedundantFields(schedule);
				callback(null, schedule);
			});

			// fs.writeFileSync("tt6.json", JSON.stringify(incompleteLessons, null, '\t'));
			// fs.writeFileSync("tt5.json", JSON.stringify(schedule, null, '\t'));
		});
	});

	function removeRedundantFields(schedule) {
		delete schedule.width;
		delete schedule.height;
		schedule.lessons.forEach(function(lesson) {
			delete lesson.cx;
			delete lesson.cy;
			//TODO remove
			// if(lesson.details)
			lesson.details.forEach(function(detail) {
				delete detail.unknowns;
			});
		});
	}
}


module.exports = parseSchedule;