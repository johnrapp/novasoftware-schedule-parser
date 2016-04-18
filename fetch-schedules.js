var novasoftware = require('./novasoftware.js');
var parser = require('./parser.js');
var timeoutQueue = require('./timeout-queue.js');

var queue = timeoutQueue.create(15);

module.exports = function fetchSchedules(weeks, classes) {
	queue.start();

	var start = Date.now();

	var schedules = Promise.all(weeks.map(function(week) {
		var weekStart = Date.now();
		console.log('started week', week)
		var schedules = Promise.all(classes.map(function(classItem) {
			var classStart = Date.now();
			return new Promise(function(resolve, reject) {
				queue(function() {
					console.log('started class', week, classItem.name);
					novasoftware.schedulePdf(week, classItem.id, function(err, pdfBuffer) {
						if(err) { return reject(err) }
						parser.parse(classItem.name, pdfBuffer, function(err, data) {
							if(err) { return reject(err) }
							resolve(data);
						});
					});
				});
			}).then(function(x) {
				console.log('finished class', week, classItem.name, Date.now() - classStart);
				return x;
			});
		})).then(function(x) {
			console.log('finished week', week, Date.now() - weekStart);
			return x;
		});
		schedules.catch(function(err) {
			console.log('SCHEDULE ERROR!!!')
		});
		return schedules.then(function(schedules) {
			return {
				week: week,
				schedules: schedules
			};
		});
	}));
	schedules.catch(function(err) {
		console.log('SCHEDULE ERROR!!!')
	});

	schedules.then(queue.done);

	return schedules;
}