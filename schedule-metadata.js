var cheerio = require('cheerio');
var fs = require('fs');
var parser = require('./parser.js');
var async = require('async');

var novasoftware = require('./novasoftware.js');

module.exports.fetch = function fetch(callback) {
	novasoftware.view(0, function(err, body) {
		var $ = cheerio.load(body);
		// fs.writeFileSync('output.html', body, "utf8");

		var weekOptions = $('#WeekDropDownList option');
		var weeks = weekOptions.map(function(i, element) {
			return $(element).val();
		}).get();

		//Remove empty option
		weeks.splice(0, 1);

		var idOptions = $('#ScheduleIDDropDownList option');
		var classes = idOptions.map(function(i, element) {
			var $element = $(element);
			var value = $element.val();
			var text = $element.text();

			return {
				id: value,
				name: text
			};
		}).get();

		//Remove empty option
		classes.splice(0, 1);

		callback(err, {
			weeks: weeks,
			classes: classes
		});
	});
};