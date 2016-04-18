var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var parser = require('./parser.js');
var async = require('async');
// var replay = require('request-replay');

const schoolId = 99810; //vgy
const schoolCode = 945537;
// const schoolId = 81530; //Norra
// const schoolCode = 123489;
// const schoolId = 59150; //Östra
// const schoolCode = 522626;
// const schoolId = 68600; //Katedral uppsala
// const schoolCode = 12689;

const baseUrl = 'http://www.novasoftware.se/WebViewer//MZDesign1.aspx?schoolid=' + schoolId + '&code=' + schoolCode;
// const baseUrl = 'http://www.novasoftware.se/WebViewer/(S(310b0lvc2tbhmb451vdk4c2v))/MZDesign1.aspx?schoolid=99810&code=945537';
const pdfUrl = 'http://www.novasoftware.se/ImgGen/schedulegenerator.aspx';
// const pdfUrl = 'http://www.novasoftware.se/ImgGen/schedulegenerator.aspx?format=pdf&schoolid=99810&id={ECFB8E2F-7291-415A-B102-96DAF243319B}&period=&week=46&width=1&height=1';

const pngUrl = 'http://www.novasoftware.se/ImgGen/schedulegenerator.aspx';
// const pngUrl = 'http://www.novasoftware.se/ImgGen/schedulegenerator.aspx?format=png&schoolid=99810/sv-se&type=-1&id={7468BC19-9F7C-49F9-84F2-2D3D76F579E1}&period=&week=3&mode=0&printer=0&colors=32&head=0&clock=0&foot=0&day=0&width=1883&height=548&maxwidth=1883&maxheight=548';

// var timeoutQueue = require('./timeout-queue.js');

// var queue = timeoutQueue.create(500);

// queue.start();
var performTheRequest = request
// .defaults({
// 		headers: {
// 			'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.37 Safari/537.36',
// 			'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
// 			'Accept-Encoding': 'gzip, deflate, sdch',
// 			'Accept-Language': 'sv,en-US;q=0.8,en;q=0.6,nb;q=0.4,en-GB;q=0.2',
// 			'Cache-Control': 'no-cache',
// 			'Connection': 'keep-alive',
// 			'Pragma': 'no-cache',
// 			'Referer': 'https://www.google.se/',
// 			'Upgrade-Insecure-Requests': '1'
// 		}
// 	});
var performRequest = function(options, callback) {

	//  async.retry({times: 3, interval: requestTimeout}, function(callback) {

	//  	var isDone = false;
	//  	var done = function(err, args) {
	//  		if(!isDone) {
	//  			isDone = true;
	//  			callback(err, args);
	//  		}
	//  	}

	//  	var request = performTheRequest(options, function(err, httpResponse, body) {
	// 		if(err) {
	// 			done(err, null);
	// 		} else if(httpResponse.statusCode == 500) {
	// 			done('Server error', null);
	// 		} else {
	// 			done(null, arguments);
	// 		}
	// 	});


	//  	$timeout(10000).then(function() {
	//  		if(!isDone) {
	// 	 		request.abort();
	// 	 		done('Took too long', null);
	//  		}
	//  	});

	// }, function(err, args) {
	// 	if(err) { callback(err, null); }
	// 	callback.apply(null, args);
	// });

	async.retry({times: 3, interval: requestTimeout}, function(callback) {
		// async.race([
			// function(callback) {
				performTheRequest(options, function(err, httpResponse, body) {
					if(err) {
						callback(err, null);
					} else if(httpResponse.statusCode == 500) {
						callback(new Error('Server error'), null);
					} else {
						callback(null, arguments);
					}
				});
			// },
			// function(callback) {
		// 		setTimeout(function() {
		// 			callback(new Error('Took too long'), null);
		// 		}, 5000);
		// 	}
		// ], function(err, data) {
		// 	callback.apply(null, args);
		// });
	}, function(err, args) {
		if(err) { callback(err, null); }
		callback.apply(null, args);
	});
};

// performRequest({url: 'https://httpbin.org/status/500'}, function(err, httpResponse, body) {
// 	console.log(arguments);
// });

//delay 300
//379 225096 ~ 3.8 min
//379 240912 ~ 4.0 min
//378 277316 ~ 4.6 min
//380 325882 ~ 5.4 min
//378 217953 ~ 3.6 min
//378 217893 ~ 3.6 min

//delay 50
//379 348248 ~ 5.8 min
//379 188326 ~ 3.1 min


// var requestTimeout = 50;
var requestTimeout = 100;
// var requestTimeout = 300;
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
			fs.writeFileSync('output.html', body, "utf8");
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
		// .pipe(fs.createWriteStream('schedule.pdf'));
	});
};

module.exports.schedulePng = function(week, classId, w, h, callback) {
	performRequest({
		url: pngUrl,
		// url: 'http://www.novasoftware.se/ImgGen/schedulegenerator.aspx?format=png&schoolid=99810/sv-se&type=0&id={7468BC19-9F7C-49F9-84F2-2D3D76F579E1}&period=&week=7&mode=0&printer=0&colors=32&head=0&clock=0&foot=0&day=0&width=907&height=513&maxwidth=907&maxheight=513',
		method: 'GET',
		encoding: null,
		qs: {
			format: 'png',
			// schoolid: '81530',
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
	// .then(function(stream) {
	// 	stream.pipe(fs.createWriteStream('test.png'));
	// });
};

// module.exports.click = function(week, classId, x, y, w, h, callback) {

// 	new Promise(function(resolve, reject) {
// 		request({
// 			url: baseUrl,
// 			method: 'GET',
// 			qs: {
// 				id: classId
// 			},
// 			followRedirect: false
// 		}, function(err, httpResponse, body) {
// 			var path = httpResponse.headers.location;
// 			$timeout(timeout).then(function() {
// 				resolve(path);
// 			})
// 		});
// 	})
// 	.then(function(path) {
// 		return new Promise(function(resolve, reject) {
// 			request({
// 				url: path,
// 				baseUrl: 'http://www.novasoftware.se',
// 				method: 'GET',
// 				followRedirect: false
// 			}, function(err, httpResponse, body) {
// 				// fs.writeFileSync('output.html', body, "utf8");
// 				$timeout(timeout).then(function() {
// 					resolve(path);
// 				})
// 			});	
// 		});
// 	})
// 	.then(function(path) {
// 		return new Promise(function(resolve, reject) {
// 			request({
// 				url: pngUrl,
// 				method: 'GET',
// 				qs: {
// 					format: 'png',
// 					schoolid: 99810,
// 					id: classId,
// 					period: null,
// 					week: 7,
// 					// width: 1,
// 					width: 200,
// 					// height: 1,
// 					height: 200,
// 				},
// 				jar: true,
// 			}, function(err, httpResponse, body) {
// 				$timeout(timeout).then(function() {
// 					resolve(path);
// 				})

// 			}).pipe(fs.createWriteStream('test2.png'));
// 		});
// 	})
// 	.then(function(path) {
// 		return new Promise(function(resolve, reject) {
// 			request({
// 				url: path,
// 				baseUrl: 'http://www.novasoftware.se',
// 				// url: 'http://www.novasoftware.se/WebViewer/(S(beg0nt455a53htrw5kd3ue45))/MZDesign1.aspx?schoolid=99810&code=945537&id=13te',
// 				method: 'POST',
// 				jar: true,
// 				form: {
// 					__EVENTTARGET:'NovaschemWebViewer2',
// 					// __EVENTARGUMENT:'MapClick|440|200|907|583',
// 					__EVENTARGUMENT:'MapClick|' + x + '|' + y + '|' + w + '|' + h,
// 					// ScheduleIDDropDownList:'{7468BC19-9F7C-49F9-84F2-2D3D76F579E1}',
// 					ScheduleIDDropDownList:'0',
// 					FreeTextBox:classId,
// 					PeriodDropDownList:'8',
// 					WeekDropDownList:'7',
// 				}
// 			}, function(err, httpResponse, body) {
// 				// fs.writeFileSync('output.html', body, "utf8");
// 				fs.writeFileSync('output.html', body, "utf8");
// 				$timeout(timeout).then(function() {
// 					resolve(httpResponse.headers.location);
// 				})
// 			});
// 		});
// 	})
// 	.then(function(path) {
// 		return new Promise(function(resolve, reject) {
// 			request({
// 				url: 'http://www.novasoftware.se' + path,
// 				method: 'GET',
// 			}, function(err, httpResponse, body) {
// 				console.log(httpResponse.headers)
// 				fs.writeFileSync('output.html', body, "utf8");
// 				// request({
// 				// 	method: 'GET',
// 				// 	url: 'http://www.novasoftware.se/WebViewer/(S(gvl52z45assbu045rec3fmfe))/LessonInfo.aspx'
// 				// }, function(err, httpResponse, body) {
// 				// 	fs.writeFileSync('output.html', body, "utf8");
// 				// })
// 				callback(err, body);
// 			});
// 		});
// 	});
// };

var indexPagePromise = null;
function getIndexPagePath() {
	// if(indexPagePromise == null) {
		indexPagePromise = new Promise(function(resolve, reject) {
			queue(function(done) {
				request({
					url: baseUrl,
					method: 'GET',
					followRedirect: false
				}, function(err, httpResponse, body) {
					done();
					if(err) { return reject(err); }
					var path = httpResponse.headers.location;
					resolve(path);
				});
			});
		});
	// }
	return indexPagePromise;
}

var activateIndexPageCache = {};
function activateIndexPage(classId) {
	return function(path) {
		if(!activateIndexPageCache[classId]) {
			activateIndexPageCache[classId] = new Promise(function(resolve, reject) {
				queue(function(done) {
					request({
						url: path,
						qs: {
							id: classId
						},
						baseUrl: 'http://www.novasoftware.se',
						method: 'GET',
						followRedirect: false
					}, function(err, httpResponse, body) {
						done();
						if(err) { return reject(err); }
						// fs.writeFileSync('output.html', body, "utf8");
						resolve(path);
					});	
				});
			});
		}
		return activateIndexPageCache[classId];
	}
}

// function requestPromise(options, callback) {
// 	request(options, function() {

// 	});
// }

// module.exports.setDelay = function(delay) {
// 	requestTimeout = delay;
// }

module.exports.clickMultiple2 = function(week, classId, coords, w, h, callback) {

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
				// .then(function(stream) {
				// 	stream.pipe(fs.createWriteStream('test2.png'));
				// });
			});
		},
		function fetchLessons(path, callback) {
			async.series(coords.map(function(coord) {
				return function(callback) {
					async.waterfall([
						function click(callback) {
							queue(function(done) {
								performRequest({
									// url: 'http://www.novasoftware.se/WebViewer//MZDesign1.aspx?schoolid=99810&code=945537&id=13te',
									url: path,
									baseUrl: 'http://www.novasoftware.se',
									method: 'POST',
									jar: cookieJar,
									form: {
										__EVENTTARGET: 'NovaschemWebViewer2',
										// __EVENTARGUMENT:'MapClick|440|200|907|583',
										__EVENTARGUMENT: 'MapClick|' + coord[0] + '|' + coord[1] + '|' + w + '|' + h,
										// ScheduleIDDropDownList:'{7468BC19-9F7C-49F9-84F2-2D3D76F579E1}',
										ScheduleIDDropDownList: '0',
										FreeTextBox: classId,
										PeriodDropDownList: '8',
										WeekDropDownList: week,
									}
								}, function(err, httpResponse, body) {
									done();
									
									fs.writeFileSync('output.html', body, "utf8");

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

									var lesson = scrapeClickedLesson(body);

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


	// return new Promise(function(resolve, reject) {
	// 		queue(function(done) {
	// 			request({
	// 				url: pngUrl,
	// 				method: 'GET',
	// 				qs: {
	// 					format: 'png',
	// 					schoolid: schoolId,
	// 					id: classId,
	// 					period: null,
	// 					week: week,
	// 					width: 1,
	// 					height: 1,
	// 				},
	// 				jar: cookieJar,
	// 			}, function(err, httpResponse, body) {
	// 				done();
	// 				if(err) { return reject(err); }
	// 				resolve(path);
	// 			});
	// 			// .then(function(stream) {
	// 			// 	stream.pipe(fs.createWriteStream('test2.png'));
	// 			// });
	// 		});
	// 	});
};



//Det finns 22 veckor och 41 klasser => 22*41 = 902
module.exports.clickMultiple = function(week, classId, coords, w, h, callback) {

	var cookieJar = request.jar();

	// queue.start();
	getIndexPagePath()
	.then(activateIndexPage(classId))
	.then(function(path) {
		return new Promise(function(resolve, reject) {
			queue(function(done) {
				request({
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
					if(err) { return reject(err); }
					resolve(path);
				});
				// .then(function(stream) {
				// 	stream.pipe(fs.createWriteStream('test2.png'));
				// });
			});
		});
	})
	.then(function(path) {
		return new Promise(function(resolve, reject) {
			async.series(coords.map(function(coord, i) {
				return function(callback) {
					new Promise(function(resolve, reject) {
						queue(function(done) {
							request({
								url: path,
								baseUrl: 'http://www.novasoftware.se',
								// url: 'http://www.novasoftware.se/WebViewer/(S(beg0nt455a53htrw5kd3ue45))/MZDesign1.aspx?schoolid=99810&code=945537&id=13te',
								method: 'POST',
								jar: cookieJar,
								form: {
									__EVENTTARGET: 'NovaschemWebViewer2',
									// __EVENTARGUMENT:'MapClick|440|200|907|583',
									__EVENTARGUMENT: 'MapClick|' + coord[0] + '|' + coord[1] + '|' + w + '|' + h,
									// ScheduleIDDropDownList:'{7468BC19-9F7C-49F9-84F2-2D3D76F579E1}',
									ScheduleIDDropDownList: '0',
									FreeTextBox: classId,
									PeriodDropDownList: '8',
									WeekDropDownList: week,
								}
							}, function(err, httpResponse, body) {
								done();
								if(err) {
									return reject(err);
								}

								if(!httpResponse.headers.location) {
									return reject(new Error('No Location header'));
								}
								// fs.writeFileSync('output.html', body, "utf8");
								resolve(httpResponse.headers.location);
							});
						});
					})
					.then(function(path) {
						queue(function(done) {
							request({
								url: path,
								baseUrl: 'http://www.novasoftware.se',
								method: 'GET',
							}, function(err, httpResponse, body) {
								done();
								// if(err) { return reject(err); }
								// fs.writeFileSync('output_1.html', body, "utf8");
								// fs.writeFileSync('output_' + i + '.html', body, "utf8");

								if(err) {
									return callback(err, null)
								}

								var lesson = scrapeClickedLesson(body);

								// resolve(lesson);
								callback(null, lesson);

								// var tbody = $('table tbody');

								// var time = $('table tbody tr:first-child td:first-child').text();
								// var lesson = $('table tbody tr:nth-child(2) td').map(function(i, element) {
								// 	return $(element).text();
								// }).get();
								// console.log($('table tbody tr:first-child td:first-child'));
								// console.log($('table tbody tr:nth-child(2) td'));
								
								// resolve({time: time, lesson: lesson});
							});
						});
					});
					
				};
			}),
			function(err, lessons) {
				if(err) { return reject(err); }
				resolve(lessons);
			});
		});
	}).then(function(body) {
		callback(null, body);
	})
	.catch(function(err) {
		callback(err, null);
	})
	// .then(queue.done);

};

function scrapeClickedLesson(body) {
	var $ = cheerio.load(body);

	var rows = $('tr').get();

	//The time is usually in the first row
	var timeElement = rows.shift();
	var time = getText(timeElement);

	if(/^Block:/.test(time)) {
		//Take the next row
		time = getText(rows.shift());
	}

	var times = time.split(' - ');
	var startTime = times[0];
	var endTime = times[1];

	//There is always one redundant row in the end
	rows.pop();

	var details = rows.map(function(element) {
		var columns = $(element).children().get().map(getText);
		var course = columns[0];
		var teacher = columns[1];
		var unknown = columns[2];
		var location = columns[3];

		return {
			course: course,
			teacher: teacher,
			unknown: unknown,
			location: location,
		}
	});

	function getText(element) {
		return $(element).text();
	}

	return {
		startTime: startTime,
		endTime: endTime,
		details: details
	};
}