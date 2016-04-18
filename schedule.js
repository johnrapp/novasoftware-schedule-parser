var cheerio = require('cheerio');
var fs = require('fs');
var parser = require('./parser.js');
var async = require('async');

var novasoftware = require('./novasoftware.js');

module.exports.fetch = function(week, callback) {

	novasoftware.view(week, function(err, body) {
		var $ = cheerio.load(body);
		// fs.writeFileSync('output.html', body, "utf8");

		var weekList = $('#WeekDropDownList');
		var weeks = weekList.find('option').map(function(i, element) {
			var week = $(element).val();
			return week || null;
		}).get();

		var weekExists = weeks.indexOf(week) !== -1;

		if(!weekExists) {
			return callback(new Error('Invalid week'), null);
		}

		var idList = $('#ScheduleIDDropDownList');
		var options = idList.find('option').map(function(i, element) {
			var $element = $(element);
			var value = $element.val();
			var text = $element.text();

			return value == 1 ? null : {
				id: value,
				name: text
			};
		}).get();

		var parseShedules = options.map(function(option) {
			return function(callback) {
				novasoftware.schedulePdf(week, option.id, function(err, pdfBuffer) {
					parser.parse(option.name, pdfBuffer, function(data) {
						callback(null, data);
					});
				});
			};
		});

		async.parallel(parseShedules, callback);
	});

};