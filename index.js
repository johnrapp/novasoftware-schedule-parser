var scheduleParser = require('./schedule-parser.js');
var scheduleMeta = require('./schedule-metadata.js');
var novasoftware = require('./novasoftware.js');
var async = require('async');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');

var config = require('./config-example.json');

delete config.schoolId;
delete config.schoolCode;
delete config.requestTimeout;

novasoftware.setup(config);

scheduleMeta.fetch(function(err, meta) {
	var weeks = config.weeks;
	var classes = meta.classes;

	if(weeks === '*') {
		weeks = meta.weeks;
	}

	if(config.classes !== '*') {
		classes = meta.classes.filter(function(classItem) {
			return config.classes.indexOf(classItem.name) !== -1;
		});
	}

	parseSchedules(weeks, classes);
});

function parseSchedules(weeks, classes) {
	var start = Date.now();
	async.series(weeks.map(function(week) {
		return function(callback) {
			async.series(classes.map(function(classItem) {
				return function(callback) {
					console.log('Started', week, classItem.name)
					scheduleParser(week, classItem.id, classItem.name, function(err, schedule) {
						if(err == null) {
							console.log('Finished', week, classItem.name)
							outputSchedule(schedule, week, classItem.name);
						}
						callback(err, schedule);
					});
				};
			}), callback);
		};
	}),
	function(err, weeks) {
		if(err) { console.error(err); }
		console.log(Date.now() - start);
	});
}

function outputSchedule(schedule, week, className) {
	var dir = path.join('schedules', week.toString());
	var file = path.join(dir, className + '.json');

	mkdirp(dir, function(err) {
		if(err) { return console.error('Failed to create directory', dir); }

		fs.writeFile(file, JSON.stringify(schedule, null, '\t'));
	});
}