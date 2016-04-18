var fs = require('fs');
var PDFParser = require("pdf2json/pdfparser");

module.exports.parse = function(className, buffer, callback) {

	var pdfParser = new PDFParser();
	
	function stringify(data) {
		return JSON.stringify(data, null, '\t');
	}

	function debug(data) {
		fs.writeFileSync("debug.txt", stringify(data));
	}
	function debugm(data) {
		fs.writeFileSync("debug.txt", JSON.stringify(data));
	}

	function output(data) {
		fs.writeFileSync('output/' + className + ".json", stringify(data));
	}

	pdfParser.on("pdfParser_dataError", function(err) {
		callback(err, null)
		// console.log("parseError", err)
	});

	pdfParser.on("pdfParser_dataReady", function(data) {
		// console.log("started", className)

		var page = data.data.Pages[0];

		var horizontal = page.HLines;
		var vertical = page.VLines;

		var parseError = false;

		var texts = page.Texts.map(function(text) {
			return {
				//The x and y where offsetted so i fixed them!
				x: text.x + 0.7,
				y: text.y + 0.55,
				// w: text.w,
				//These values seem to work fine
				w: 2,
				h: 0.2,
				text: decodeURIComponent(text.R[0].T)
			};
		});

		texts.sort(function(a, b) {
			return a.y - b.y;
		});

		//Remove the five topmost since they are the titles
		var titles = texts.splice(0, 5).sort(function(a, b) {
			return a.x - b.x;
		});

		var fills = page.Fills.filter(function(fill) {
			//Not an empty fill
			return fill.w > 0 && fill.h > 0
				//Not a title fill
				&& !(fill.w == 18.391 && fill.h == 2.75)
				//Not too big of a fill
				&& fill.h < 30;
		});

		var smallFills = fills.filter(function(fill) {
			//Area of 2 seems to work fine
			return fill.w * fill.h <= 2;
		});

		var lessonFills = fills.filter(function(fill) {
			return fill.w * fill.h > 2;
		});

		lessonFills = lessonFills.map(function(fill, i) {
			//Find all intersecting texts
			var within = texts.filter(function(text) {
				return intersect(fill.x + fill.w , fill.y + fill.h, fill.x, fill.y,
								 text.x + text.w, text.y + text.h, text.x, text.y);
			});

			return {fill: fill, texts: within};
		});

		var lessons = lessonFills.map(function(arg, i) {
			var fill = arg.fill;
			var lessonsTexts = arg.texts;

			lessonsTexts.sort(function(a, b) {
				return a.y - b.y;
			});

			lessonsTexts.forEach(function(el) {
				if(isIncompleteTime(el.text)) {
					var nearest = texts.filter(function(text) {
						return isTime(text.text)
					}).sort(function(a, b) {
						return dist(el.x + el.w / 2, el.y + el.h / 2, a.x, a.y) - dist(el.x + el.w / 2, el.y + el.h / 2, b.x, b.y);
					})[0];

					el.text = nearest.text.match(/^(\d{2})/)[0] + ':' + el.text;
				}
			});

			var times = lessonsTexts.filter(function(el) {
				return isTime(el.text);
			});

			times = uniqueMap(times, getText);

			lessonsTexts = lessonsTexts.filter(function(el) {
				return !isTime(el.text);
			});

			var startTimes = times.filter(function(time) {
				return time.y < fill.y;
			});
			var startTime = startTimes.length > 0 ? startTimes[0] : null;
			var endTimes = times.filter(function(time) {
				return time.y > fill.y + fill.h - 0.2; //0.1 seemed to work fine as margin
			});
			var endTime = endTimes.length > 0 ? endTimes[0] : null;

			var day = titles.indexOf(titles.filter(function(title) {
				return fill.x < title.x + 12; //12 seemed to work fine as margin
			})[0]);

			return {fill: fill, startTime: startTime, endTime: endTime, rows: lessonsTexts, day: day};
		});

		lessons = lessons.map(function(lesson) {
			var startTime = lesson.startTime;
			var endTime = lesson.endTime;
			var rows = lesson.rows;
			var fill = lesson.fill;
			var day = lesson.day;

			try {
				if(!startTime) {
					startTime = lesson.startTime = getStartTimeFromNeighbor(lesson, lessons);
				}
				if(!endTime) {
					endTime = lesson.endTime = getEndTimeFromNeighbor(lesson, lessons);
				}	
			} catch(e) {
				parseError = true;
			}
			

			if(rows.length > 0) {
				rows = rows.map(getText);
				var matches = rows[rows.length - 1].match(/(\w+)$/);
				var location = matches ? matches[0] : null;
			} else {
				location = null;
			}

			return {
				// fill: fill,
				// startTime: startTime,
				startTime: startTime == null ? null : getText(startTime),
				// endTime: endTime,
				endTime: endTime == null ? null : getText(endTime),
				rows: rows,
				location: location,
				day: day,
			};
		});

		lessons = lessons.filter(function(lesson) {
			return lesson.startTime != null && lesson.endTime != null;
		});

		var titles, lessons;

		// debug(lessons);

		// fs.writeFileSync("fills_and_texts.txt", stringify({texts: texts, fills: fills}));
		// fs.writeFileSync("lessons.txt", stringify(lessons));

		// debug({texts: texts, fills: fills});

		// debug({
		// 	className: className,
		// 	parseError: parseError,
		// 	titles: titles ? titles.map(getText) : [],
		// 	lessons: lessons ? lessons : []
		// });

		// output({
		// 	className: className,
		// 	parseError: parseError,
		// 	titles: titles ? titles.map(getText) : [],
		// 	lessons: lessons ? lessons : []
		// });

		callback && callback(null, {
			className: className,
			parseError: parseError,
			titles: titles ? titles.map(getText) : [],
			lessons: lessons ? lessons : []
		});

		// console.log("done")

		// fs.writeFileSync("debug.txt", stringify(days));
	});

	function getStartTimeFromNeighbor(lesson, lessons) {
		var neighbor = lessons.filter(function(other) {
			if(other == lesson || other.day != lesson.day) return;
			return dist(lesson.fill.x, lesson.fill.y, other.fill.x + other.fill.w, other.fill.y) < 1;
		})[0];

		if(!neighbor.startTime) {
			neighbor.startTime = getStartTimeFromNeighbor(neighbor, lessons);
		}
		return neighbor.startTime;

	}

	function getEndTimeFromNeighbor(lesson, lessons) {
		var neighbor = lessons.filter(function(other) {
			if(other == lesson || other.day != lesson.day) return;
			return dist(lesson.fill.x + lesson.fill.w, lesson.fill.y + lesson.fill.h, other.fill.x, other.fill.y + other.fill.h) < 1;
		})[0];

		if(!neighbor.endTime) {
			neighbor.endTime = getEndTimeFromNeighbor(neighbor, lessons);
		}
		return neighbor.endTime;

	}

	function uniqueMap(array, fn) {
		var unique = array.reduce(function(keys, item) {
			keys[fn(item)] = item;
			return keys;
		}, {});
		return Object.keys(unique).map(function(key) {
			return unique[key];
		});
	}

	function isIncompleteTime(string) {
		return /^\d{2}$/.test(string);
	}

	function isTime(string) {
		return /^\d{2}:\d{2}$/.test(string);
	}

	function negate(fn) {
		return function(a) {
			return !fn(a);
		};
	}

	function getText(el) {
		return el.text;
	}

	function dist(x1, y1, x2, y2) {
		var dx = x1 - x2;
		var dy = y1 - y2;
		return Math.sqrt(dx*dx + dy*dy);
	}

	function intersect(xMax1, yMax1, xMin1, yMin1, xMax2, yMax2, xMin2, yMin2) {
	    if (xMax1 < xMin2) return false; // a is left of b
	    if (xMin1 > xMax2) return false; // a is right of b
	    if (yMax1 < yMin2) return false; // a is above b
	    if (yMin1 > yMax2) return false; // a is below b
	    return true; // boxes overlap
	}

	pdfParser.parseBuffer(buffer);
};