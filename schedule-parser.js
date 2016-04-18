var novasoftware = require('./novasoftware.js');
var pdfParser = require('./pdf-parser.js');
var fs = require('fs');

function parseSchedule(week, classId, className, callback) {
	novasoftware.schedulePdf(week, classId, function(err, buffer) {
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

			novasoftware.clickMultiple(week, classId, coords, width, height, function(err, lessons) {
				if(err) { return callback(err, null) }

				lessons.forEach(function(lesson, i) {
					lesson.details.forEach(function(detail) {
						delete detail.unknown;
					});
					incompleteLessons[i].details = lesson.details;
				});

				removeRedundantFields(schedule);
				callback(null, schedule);
			});

		});
	});

	function removeRedundantFields(schedule) {
		delete schedule.width;
		delete schedule.height;
		schedule.lessons.forEach(function(lesson) {
			delete lesson.cx;
			delete lesson.cy;
			lesson.details.forEach(function(detail) {
				delete detail.unknowns;
			});
		});
	}
}

module.exports = parseSchedule;