var scheduleParser = require('./schedule-parser.js');
var scheduleMeta = require('./schedule-metadata.js');
var async = require('async');
var fs = require('fs');

var week = 11;
var classId = '{7468BC19-9F7C-49F9-84F2-2D3D76F579E1}'; //13te
var className = '13TE' //13te
// var classId = '{ECFB8E2F-7291-415A-B102-96DAF243319B}' //13esmu
// var className = '13ESMU' //13esmu

scheduleMeta.fetch(function(err, meta) {

	var week = 11;
	// meta.classes = [meta.classes[16], meta.classes[3]];
	// meta.classes = [meta.classes[3], meta.classes[16]];

	// var weeks = [11];
	var weeks = [11, 12];

	var delays = [50, 100];
	// var delays = [0, 100, 250, 400];

	async.series(delays.map(function(delay) {
		return function(callback) {
			novasoftware.setDelay(delay);
			console.log('Delay set', delay);
			var i = 0;
			async.whilst(countTo(10), function(callback) {
				console.log('Started attempt', ++i);
				var start = Date.now();
				async.series(weeks.map(function(week) {
					return function(callback) {
						async.series(meta.classes.map(function(classItem) {
							return function(callback) {
								scheduleParser(week, classItem.id, classItem.name, callback);
							};
						}), callback);
					};
				}),
				function(err, weeks) {
					console.log('Finished attempt', i);
					if(err) {
						callback(err, null);
						return console.error(err);
					}
					// weeks.forEach(function(schedules) {
					// 	schedules.forEach(function(schedule) {
					// 		fs.writeFileSync('parsed-schedules/' + schedule.className + '_' + schedule.week + '.json', JSON.stringify(schedule, null, '\t'));
					// 	});
					// });
					var time = Date.now() - start;
					console.log(time);
					callback(null, {delay: delay, time: time, weeks: weeks});
				});
			}, callback);
		};
	}),
	function(err, tests) {
		console.log('Finished!');
		console.log(err, tests);
	});


	




	// async.series(weeks.map(function(week) {
	// 	return function(callback) {
	// 		async.series(meta.classes.map(function(classItem) {
	// 			return function(callback) {
	// 				scheduleParser(week, classItem.id, classItem.name, callback);
	// 			};
	// 		}), callback);
	// 	};
	// }),
	// function(err, weeks) {
	// 	console.log(Date.now() - start);
	// 	if(err) { return console.error(err); }
	// 	weeks.forEach(function(schedules) {
	// 		schedules.forEach(function(schedule) {
	// 			fs.writeFileSync('parsed-schedules/' + schedule.className + '_' + schedule.week + '.json', JSON.stringify(schedule, null, '\t'));
	// 		});
	// 	});
	// })

});

function countTo(n) {
	var i = 0;

	return function() {
		return i++ < n;
	}
}

var novasoftware = require('./novasoftware.js');
// var classes = [
// 	{name: '13ESMU', id: '{ECFB8E2F-7291-415A-B102-96DAF243319B}', coord: [16, 135]},
// 	{name: '14ESMU', id: '{55756A9A-F5F8-471B-96CA-E0C9CCEA1165}', coord: [13, 48]}
// ]

// var width = 611, height = 315;

// classes = [classes[0]];

// async.series(classes.map(function(classItem) {
// 	return function(callback) {
// 		novasoftware.click(week, classItem.id, classItem.coord, width, height, callback);
// 		// novasoftware.clickMultiple(week, classItem.id, [classItem.coord], width, height, callback);
// 	};
// }),
// function(err, lessons) {
// 	console.log(err, lessons);
// });
