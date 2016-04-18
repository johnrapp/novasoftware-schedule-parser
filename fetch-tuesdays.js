var classlistScraper = require('./tuesday/classlist-scraper.js');
var classMonthScraper = require('./tuesday/class-monthview-scraper.js');
var classWeekScraper = require('./tuesday/class-weekview-scraper.js');
var lessonScraper = require('./tuesday/lesson-scraper.js');
var timeoutQueue = require('./timeout-queue.js');

var queue = timeoutQueue.create(50);

module.exports = function fetchTuesdays(weeks) {
	queue.start();
	
	var start = Date.now();

	var tuesdays = new Promise(function(resolve, reject) {
		console.log('started classlist')
		classlistScraper.scrape(function(err, data) {
			if(err) { return reject(err) }
			resolve(data);
		});
	})
	.then(function(classes) {
		console.log('finished classlist')
		return Promise.all(weeks.map(function(week, i) {
			var tuesdays = Promise.all(classes.map(function(classItem, j) {
				var classUrl = classItem.url;
				var className = classItem.name;
				return new Promise(function(resolve, reject) {
					queue(function() {
						console.log('started tuesday', week, className);
						classWeekScraper.scrape(week, classUrl, function(err, data) {
							if(err) { return reject(err) }
							resolve(data);
						});
					});
				})
				.then(function(lessons) {
					console.log('finished tuesday', week, className);
					return {
						className: className,
						lessons: lessons
					}
				});
			}));
			tuesdays.catch(function(err) {
				console.log('TUESDAY ERROR!!!')
			});
			return tuesdays.then(function(tuesdays) {
				return {
					week: week,
					tuesdays: tuesdays
				}
			});
		}));
	});
	tuesdays.catch(function(err) {
		console.log('TUESDAY ERROR!!!')
	});

	tuesdays.then(queue.done);

	return tuesdays;
}