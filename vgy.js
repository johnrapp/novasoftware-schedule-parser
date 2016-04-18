var later = require('later');
var fs = require('fs');
var scheduleMeta = require('./schedule-metadata.js');
var fetchSchedules = require('./fetch-schedules2.js');
var fetchTuesdays = require('./fetch-tuesdays.js');
var combineWithTuesdays = require('./combine-with-tuesdays.js');

var pushToServer = require('./push.js');

later.date.localTime();
//06:00 varje måndag
// var scheduleTime = later.parse.text('at 06:00am every monday');
var scheduleTime = later.parse.text('every 3 min');
//17:00 varje vardag
// var tuesdayTime = later.parse.text('at 05:00pm every weekday');
var tuesdayTime = later.parse.text('every 3 min');
// var tuesdayTime = later.parse.text('every 1 min');

// var testTime = later.parse.text('every 2 min');

// later.setInterval(function() {

// 	console.log('Started with schedules')

// 	scheduleMeta.fetch(function(err, meta) {
// 		var start = Date.now();

// 		// var schedules = Promise.resolve({});
// 		// var tuesdays = Promise.resolve({});

// 		var schedules = fetchSchedules(meta.weeks, meta.classes);
// 		var tuesdays = fetchTuesdays(meta.weeks);

// 		Promise.all([schedules, tuesdays]).then(function(data) {

// 			var schedules = data[0];
// 			var tuesdays = data[1];

// 			combineWithTuesdays(schedules, tuesdays);

// 			console.log('Pushed schedules',  Date.now() - start)
// 			pushToServer(schedules);

// 			fs.writeFileSync("data/schedules.json", JSON.stringify(schedules, null, '\t'));
			
// 			fs.writeFileSync("data/schedules_with_tuesdays.json", JSON.stringify(schedules, null, '\t'));
// 			fs.writeFileSync("data/tuesdays.json", JSON.stringify(tuesdays, null, '\t'));

// 		}, function(err) {
// 			console.log('Error!', err);
// 		});
// 	});

// }, scheduleTime);

// later.setInterval(function() {

	console.log('Started with tuesdays');
	
	scheduleMeta.fetch(function(err, meta) {

		// var scheduleData = JSON.parse(fs.readFileSync("data/schedules.json"), 'utf8');
		// var schedules = Promise.resolve(scheduleData);

		var tuesdayData = JSON.parse(fs.readFileSync("data/tuesdays.json"), 'utf8');
		var tuesdays = Promise.resolve(tuesdayData);

		// var tuesdays = Promise.resolve({});

		var schedules = fetchSchedules(meta.weeks, meta.classes);
		// var tuesdays = fetchTuesdays(meta.weeks);

		Promise.all([schedules, tuesdays]).then(function(data) {

			console.log('Sup');
			var schedules = data[0];
			var tuesdays = data[1];

			fs.writeFileSync("test-schedules.json", JSON.stringify(schedules, null, '\t'));
			// fs.writeFileSync("data/schedules.json", JSON.stringify(schedules, null, '\t'));
			// fs.writeFileSync("data/tuesdays.json", JSON.stringify(tuesdays, null, '\t'));

			// combineWithTuesdays(schedules, tuesdays);

			// console.log('Pushing to server!');
			// pushToServer(schedules);

			// fs.writeFileSync("data/schedules_with_tuesdays.json", JSON.stringify(schedules, null, '\t'));

			console.log('Done!');

		}, function(err) {
			console.log('Error!', err);
		});
	});

// }, tuesdayTime);


// later.setInterval(function() {


// }, testTime);