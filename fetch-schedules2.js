var novasoftware = require('./novasoftware.js');
var parser = require('./next-parser.js');
var async = require('async');

module.exports = function fetchSchedules(weeks, classes) {

	var start = Date.now();

	return new Promise(function(resolve, reject) {
		async.series(weeks.filter(limit(2)).map(function(week) {
			return function(weekCallback) {
				async.series(classes.filter(limit(2)).map(function(classItem) {
					return function(classCallback) {
						parser.parse(week, classItem.id, classItem.name, function(err, schedule) {
							classCallback(err, schedule);
						});
					};
				}),
				function(err, schedules) {
					weekCallback(err, schedules);
				});
			};
		}),
		function(err, schedules) {
			if(err) { return reject(err); }
			resolve(schedules);
		})
	});




	// var schedules = Promise.all(weeks.filter(limit(2)).map(function(week) {
	// 	var weekStart = Date.now();
	// 	console.log('started week', week)
	// 	var schedules = Promise.all(classes.filter(limit(2)).map(function(classItem) {
	// 		var classStart = Date.now();
	// 		return new Promise(function(resolve, reject) {
	// 			console.log('started class', week, classItem.name);

	// 			parser.parse(week, classItem.id, classItem.name, function(err, schedule) {
	// 				if(err) { return reject(err) }
	// 				resolve(schedule);
	// 			});
	// 		}).then(function(x) {
	// 			console.log('finished class', week, classItem.name, Date.now() - classStart);
	// 			return x;
	// 		});
	// 	})).then(function(x) {
	// 		console.log('finished week', week, Date.now() - weekStart);
	// 		return x;
	// 	});
	// 	schedules.catch(function(err) {
	// 		console.log('SCHEDULE ERROR!!!')
	// 	});
	// 	return schedules.then(function(schedules) {
	// 		return {
	// 			week: week,
	// 			schedules: schedules
	// 		};
	// 	});
	// }));
	// schedules.catch(function(err) {
	// 	console.log('SCHEDULE ERROR!!!')
	// });

	// return schedules;
}

function limit(n) {
	return function(x, i) {
		return i < n;
	}
}