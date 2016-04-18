var fs = require('fs');
var request = require('request');

// var schedules = fs.readFileSync('data/schedules.json', "utf8");
// var schedules = fs.readFileSync('data/schedules_with_tuesdays.json', "utf8");
var password = fs.readFileSync('password.txt', "utf8");
module.exports = function(schedules) {
	console.log('Started push.js');

	request({
		// url: 'http://vgy.rocks/schema/push.php',
		// url: 'http://vgy.rocks/johnrs/schema/push.php',
		url: 'http://localhost/schema/push.php',
		// url: 'http://localhost/schema/test-push.php',
		// url: 'http://192.168.1.84/push.php',
		method: 'POST',
		formData: {
			password: password,
			schedules: JSON.stringify(schedules)
		}
	}, function(err, httpResponse, body) {
		console.log('Got response');
		console.log(err, body);
		// fs.writeFileSync("resp.json", body);
	});
};

// var schedules = fs.readFileSync('schedules.json', "utf8");
// console.log(schedules)
