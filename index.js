var express = require('express');
var app = express();
var async = require('async');

const PORT = 8080;

var schedule = require('./schedule.js');
var tuesday = require('./tuesday/tuesday.js');
var scheduleMetadata = require('./schedule-metadata.js');

app.use(function(req, res, next) {
	if(req.query.tuesdays === 'true') {
		req.tuesdays = true;
	}
	next();
});

app.get('/s/schedule/:week', function(req, res) {
	var week = req.params.week;
	schedule.fetch(week, function(err, data) {
		if(data) {
			res.json(data);
		} else {
			res.status(400).end(err.message);
		}
	});		
});

app.get('/s/tuesday/:week', function(req, res) {
	var week = req.params.week;
	tuesday.fetch(week, function(data) {
		res.json(data);
	});
});

app.get('/s/metadata', function(req, res) {
	if(req.tuesdays) {

	}
	scheduleMetadata.fetch(function(err, metadata) {
			
	});
});

app.get('/s/schedule/withtuesday/:week', function(req, res) {
	var week = req.params.week;

	async.parallel([
		schedule.fetch.bind(null, week),
		tuesday.fetch.bind(null, week)
	], function(err, data) {
		if(err) { return res.status(400).end(err.message); }

		var scheduleData = data[0];
		var tuesdayData = data[1];

		var schedules = {};
		scheduleData.forEach(function(classSchedule) {
			schedules[classSchedule.className] = {
				parseError: classSchedule.parseError,
				titles: classSchedule.titles,
				lessons: classSchedule.lessons
			};
		});
		tuesdayData.forEach(function(classTuesday, i) {
			var schedule = schedules[classTuesday.className];
			schedule.lessons = schedule.lessons
			.filter(function(lesson) {
				return lesson.day != 1;
			})
			.concat(classTuesday.lessons.map(function(lesson) {
				return {
					startTime: lesson.startTime,
					endTime: lesson.endTime,
					rows: [lesson.description],
					day: 1
				};
			}));
		});

		var scheduleArray = [];

		for(var className in schedules) {
			var schedule = schedules[className];
			schedule.className = className;
			scheduleArray.push(schedule);
		}

		res.json(scheduleArray);
	})
});

var server = app.listen(PORT, function () {
	console.log('Server listening at http://localhost:%s', PORT);
});