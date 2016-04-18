var request = require('request');
var fs = require('fs');
var async = require('async');
var parseClickedLesson = require('./parse-clicked-lesson.js');

var schoolId = 99810; //vgy
var schoolCode = 945537;
// var schoolId = 59150; //Östra Real
// var schoolCode = 522626;
// var schoolId = 27820; //Tyresö gy
// var schoolCode = 519876;
// var schoolId = 18200; //Sundsta-Älvkullegymnasiet
// var schoolCode = 993161;

// var schoolId = 81530; //Norra
// var schoolCode = 123489;
// var schoolId = 68600; //Katedral uppsala
// var schoolCode = 12689;
// var schoolId = 83670; //Duveholmsgymnasiet
// var schoolCode = 685283;
// var schoolId = 80710; //Thorildsplan
// var schoolCode = 211677;


function buildBaseUrl(schoolId, schoolCode) {
	return 'http://www.novasoftware.se/WebViewer//MZDesign1.aspx?schoolid=' + schoolId + '&code=' + schoolCode;
}
var baseUrl = buildBaseUrl(schoolId, schoolCode);
var pdfUrl = 'http://www.novasoftware.se/ImgGen/schedulegenerator.aspx';
var pngUrl = 'http://www.novasoftware.se/ImgGen/schedulegenerator.aspx';

module.exports.setup = function(config) {
	schoolId = withDefault(config.schoolId, schoolId);
	schoolCode = withDefault(config.schoolCode, schoolCode);
	baseUrl = buildBaseUrl(schoolId, schoolCode);

	requestTimeout = withDefault(config.requestTimeout, requestTimeout);
}

function withDefault(value, defaultValue) {
	return typeof value === 'undefined' ? defaultValue : value;
}

var performRequest = function(options, callback) {
	async.retry({times: 5, interval: requestTimeout}, function(callback) {
		request(options, function(err, httpResponse, body) {
			if(err) {
				callback(err, null);
			} else if(httpResponse.statusCode == 500) {
				callback(new Error('Server error'), null);
			} else {
				callback(null, arguments);
			}
		});
	}, function(err, args) {
		if(err) { callback(err, null); }
		callback.apply(null, args);
	});
};

var requestTimeout = 100;

var promiseChain = Promise.resolve();
function queue(fn) {
	var finished = promiseChain.then(function() {
		return new Promise(function(resolve, reject) {
			fn(resolve);
		});
	});
	promiseChain = finished.then(function() {
		return $timeout(requestTimeout);
	});
	return finished;
}

function $timeout(time) {
	return new Promise(function(resolve, reject) {
		setTimeout(resolve, time);
	});
}

function queuedRequest(options, callback/* arguments */) {
	// var args = arguments; 
	return new Promise(function(resolveReturned) {
		queue(function() {
			return new Promise(function(resolve, reject) {
				var returned = request(options, function(/* arguments */) {
					resolve();
					callback.apply(this, arguments);
				});
				resolveReturned(returned);
			});
		});
	});
	
}

module.exports.view = function(week, callback) {
	new Promise(function(resolve, reject) {
		performRequest({
			url: baseUrl,
			method: 'GET',
			followRedirect: false
		}, function(err, httpResponse, body) {
			var path = httpResponse.headers.location;
			resolve('http://www.novasoftware.se' + path);
		});
	})
	.then(function(url) {
		return new Promise(function(resolve, reject) {
			performRequest({
				url: url,
				method: 'GET',
				followRedirect: false
			}, function(err, httpResponse, body) {
				resolve(url);
			});
		});
	})
	.then(function(url) {
		performRequest({
			url: url,
			method: 'POST',
			followRedirect: true,
			form: {
				__VIEWSTATE: '',
				__EVENTTARGET: 'TypeDropDownList',
				TypeDropDownList: 1,
				ScheduleIDDropDownList: 0,
				PeriodDropDownList: 8,
				WeekDropDownList: week,
			}
		}, function(err, httpResponse, body) {
			callback(err, body);
		});
	});
};

module.exports.schedulePdf = function(week, classId, callback) {
	queue(function(done) {
		performRequest({
			url: pdfUrl,
			method: 'GET',
			encoding: null,
			qs: {
				format: 'pdf',
				schoolid: schoolId,
				id: classId,
				period: null,
				week: week,
				width: 1,
				height: 1,
			},
		}, function(err, res, body) {
			done();
			callback(err, body);
		})
	});
};

module.exports.schedulePng = function(week, classId, w, h, callback) {
	performRequest({
		url: pngUrl,
		method: 'GET',
		encoding: null,
		qs: {
			format: 'png',
			schoolid: schoolId,
			id: classId,
			period: null,
			week: week,
			width: w,
			height: h,
		},
	}, function(err, res, body) {
		callback(err, body);
	});
};

module.exports.clickMultiple = function(week, classId, coords, w, h, callback) {

	var cookieJar = request.jar();


	async.waterfall([
		function fetchId(callback) {
			queue(function(done) {
				performRequest({
					url: baseUrl,
					method: 'GET',
					followRedirect: false
				}, function(err, httpResponse, body) {
					done();
					var path = httpResponse.headers.location;
					callback(null, path);
				});
			});
		},
		function activate(path, callback) {
			queue(function(done) {
				performRequest({
					url: path,
					baseUrl: 'http://www.novasoftware.se',
					qs: {
						id: classId
					},
					method: 'GET',
					followRedirect: false
				}, function(err, httpResponse, body) {
					done();
					callback(null, path);
				});
			});
		},
		function fetchPng(path, callback) {
			queue(function(done) {
				performRequest({
					url: pngUrl,
					method: 'GET',
					qs: {
						format: 'png',
						schoolid: schoolId,
						id: classId,
						period: null,
						week: week,
						width: 1,
						height: 1,
					},
					jar: cookieJar,
				}, function(err, httpResponse, body) {
					done();
					if(err) { return callback(err, null); }
					callback(null, path);
				});
			});
		},
		function fetchLessons(path, callback) {
			async.series(coords.map(function(coord) {
				return function(callback) {
					async.waterfall([
						function click(callback) {
							queue(function(done) {
								performRequest({
									url: path,
									baseUrl: 'http://www.novasoftware.se',
									method: 'POST',
									jar: cookieJar,
									form: {
										__EVENTTARGET: 'NovaschemWebViewer2',
										__EVENTARGUMENT: 'MapClick|' + coord[0] + '|' + coord[1] + '|' + w + '|' + h,
										ScheduleIDDropDownList: '0',
										FreeTextBox: classId,
										PeriodDropDownList: '8',
										WeekDropDownList: week,
									}
								}, function(err, httpResponse, body) {
									done();
									
									if(err) {
										return callback(err, null);
									}

									if(!httpResponse.headers.location) {
										return callback(new Error('No Location header'), null);
									}

									callback(null, httpResponse.headers.location);
								});
							});
						},
						function navigate(path, callback) {
							queue(function(done) {
								performRequest({
									url: path,
									baseUrl: 'http://www.novasoftware.se',
									method: 'GET',
								}, function(err, httpResponse, body) {
									done();

									if(err) {
										return callback(err, null)
									}

									var lesson = parseClickedLesson(body);

									callback(null, lesson);
								});
							});
						}
					], callback);
				};
			}), callback);
		}
	], function(err, lesson) {
		callback(err, lesson);
	});

};

