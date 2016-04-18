var fs = require('fs');
var PDFParser = require("pdf2json/pdfparser");

module.exports = function(buffer) {

}

function parsePdf(buffer, callback) {
	var pdfParser = new PDFParser();

	pdfParser.on("pdfParser_dataError", function(err) {
		callback(err, null)
		// console.log("parseError", err)
	});

	pdfParser.on("pdfParser_dataReady", function(result) {

		var data = result.data;

		// var page = data.Pages[0];

		// var horizontal = page.HLines;
		// var vertical = page.VLines;

		// var texts = page.Texts.map(function(text) {
		// 	return {
		// 		//The x and y where offsetted so i fixed them!
		// 		x: text.x + 0.7,
		// 		y: text.y + 0.55,
		// 		// w: text.w,
		// 		//These values seem to work fine
		// 		w: 2,
		// 		h: 0.2,
		// 		text: decodeURIComponent(text.R[0].T)
		// 	};
		// });

		// texts.sort(function(a, b) {
		// 	return a.y - b.y;
		// });

		// //Remove the five topmost since they are the titles
		// var titles = texts.splice(0, 5).sort(function(a, b) {
		// 	return a.x - b.x;
		// });

		// var fills = page.Fills.filter(function(fill) {
		// 	//Not an empty fill
		// 	return fill.w > 0 && fill.h > 0
		// 		//Not a title fill
		// 		&& !(fill.w == 18.391 && fill.h == 2.75)
		// 		//Not too big of a fill
		// 		&& fill.h < 30;
		// });

		// var smallFills = fills.filter(function(fill) {
		// 	//Area of 2 seems to work fine
		// 	return fill.w * fill.h <= 2;
		// });

		// var lessonFills = fills.filter(function(fill) {
		// 	return fill.w * fill.h > 2;
		// });

		// fs.writeFileSync("next-pdf-parser.json", JSON.stringify(data));
		// fs.writeFileSync('next-pdf-parser.json', JSON.stringify(data, null, '\t'));

		callback(data);
	});

	// var buffer = fs.readFileSync('schedule.pdf');

	pdfParser.parseBuffer(buffer);
}


var glob = require("glob")
var async = require("async")

// glob("shedules/*.pdf", {}, function (er, files) {
glob("schedules2/*.pdf", {}, function (er, files) {
	// files = [files[5]]
	// console.log(files[0])
	async.parallel(files.map(function(fileName) {
		return function(callback) {
			var buffer = fs.readFileSync(fileName);
			// console.log(files[0]);
			parsePdf(buffer, function(data) {
				// fs.writeFileSync(fileName.replace('.pdf', '.json'), JSON.stringify(data));
				var lessons = parseLessons(data);
				callback(null, lessons);
				// console.log(lessons)
				// fs.writeFileSync("tt.json", JSON.stringify(lessons, null, '\t'));
			});
		};
	}), function(err, allLessons) {
		var lessons = allLessons.reduce(function(lessons, l) {
			return lessons.concat(l);
		}, []);

		// lessons = lessons.map(function(lesson) {
		// 	return lesson.rows
		// });

		var nullLessons = [];
		lessons = lessons.map(function(lesson) {
			for(var i in lesson.details) {
				var details = lesson.details[i];
				if(details.course == null || details.teacher == null || details.location == null) {
					nullLessons.push(lesson);
					break;
				}
			}

			return {
				details: lesson.details,
				rows: lesson.rows
			}
		});

		var courses = lessons.map(function(lesson) {
			return lesson.details.map(function(detail) {
				return detail.course;
			});
		}).reduce(function(courses, c) {
			return courses.concat(c);
		}, []);

		fs.writeFileSync("tt2.json", JSON.stringify(lessons, null, '\t'));
		fs.writeFileSync("tt3.json", JSON.stringify(nullLessons, null, '\t'));
		fs.writeFileSync("tt4.json", JSON.stringify(courses, null, '\t'));
	});
})



function parseLessons(data) {
	var sw = 0.995;
	var width = Math.round(data.Width * 6) * sw;

	var page = data.Pages[0];

	var height = Math.round(page.Height * 6);

	var texts = page.Texts

	var lessonFills = page.Fills.filter(function(fill) {
		//Not an empty fill
		return fill.w > 0 && fill.h > 0
		//Not a title fill
		&& !(fill.w == 18.391 && fill.h == 2.75)
		//Not too big of a fill
		&& fill.h < 30
		//Not too small of a fill
		&& fill.w * fill.h > 2;
	});

	var sx = 1.1;
	var sy = 1.07;
	var tx = -30.5;
	var ty = -12;

	lessonFills = lessonFills.map(function(fill) {
		var cx = (fill.x + fill.w / 2) * 6 * sx + tx;
		return {
			x: fill.x * 6 * sx + tx,
			y: fill.y * 6 * sy + ty,
			w: fill.w * 6 * sx,
			h: fill.h * 6 * sy,
			oc: fill.oc,
			cx: cx,
			cy: (fill.y + fill.h / 2) * 6 * sy + ty,
			day: Math.floor(cx / width * 5)
		}
	});

	//Remove the five last texts since they are the titles
	//They are always in the right order
	var titles = texts.splice(texts.length - 5, 5).map(function(text) {
		return decodeURIComponent(text.R[0].T);
	});

	texts = texts.map(function(text) {
		//The x and y where offsetted so i fixed them!
		text.x = text.x + 0.7; 
		text.y = text.y + 0.42;
		//These values seem to work fine
		text.w = 1.5;
		text.h = 0.5;

		var cx = (text.x + text.w / 2) * 6 * sx + tx;
		return {
			x: text.x * 6 * sx + tx,
			y: text.y * 6 * sy + ty,
			w: text.w * 6,
			h: text.h * 6,
			cx: cx,
			cy: (text.y + text.h / 2) * 6 * sy + ty,
			day: Math.floor(cx / width * 5),
			text: decodeURIComponent(text.R[0].T)
		}
	});

	var lessonTexts = [], timeTexts = [];

	texts.forEach(function(text) {
		if(isTime(text.text)) {
			timeTexts.push(text);
		} else if(isPartialTime(text.text)) {
			timeTexts.push(completePartialTime(text));
		} else {
			lessonTexts.push(text);
		}
	});

	// function day() { return { title: null, objects: []} }
	function day() { return { title: null, lessonFills: [], lessonTexts: [], timeTexts: [] } }
	var days = [day(), day(), day(), day(), day()];
	lessonFills.forEach(function(fill) {
		days[fill.day].lessonFills.push(fill);
	});
	lessonTexts.forEach(function(text) {
		days[text.day].lessonTexts.push(text);
	});
	timeTexts.forEach(function(text) {
		days[text.day].timeTexts.push(text);
	});

	var days = days.slice(0, 5);
	
	days.forEach(function(day, i) {
		day.lessonFills.forEach(function(lessonFill, j) {

			if(lessonFills.indexOf(lessonFill) == 14) {
				var alsdsa = 0;
			}

			var startTime = day.timeTexts.filter(function(timeText) {
				return intersectHorizontalLine(
					timeText.y,
					timeText.y + timeText.h,
					lessonFill.y
				);
			})[0].text;

			var endTime = day.timeTexts.filter(function(timeText) {
				return intersectHorizontalLine(
					timeText.y,
					timeText.y + timeText.h,
					lessonFill.y + lessonFill.h
				);
			})[0].text;

			lessonFill.startTime = startTime;
			lessonFill.endTime = endTime;

			var rows = day.lessonTexts.filter(function(lessonText) {
				return intersectRectangles(
					lessonFill.x + lessonFill.w,
					lessonFill.y + lessonFill.h,
					lessonFill.x,
					lessonFill.y,
					lessonText.x + lessonText.w,
					lessonText.y + lessonText.h,
					lessonText.x,
					lessonText.y
				);
			});

			lessonFill.rows = rows;

			lessonFill.details = parseRows(rows, lessonFill);
		});

	});

	function parseRows(rows, lessonFill) {
		if(!rows.length) { return [] }

		var separator = '|||';
		var rowTexts = rows.map(function(row) {
			return row.text;
		});
		
		var parts = rowTexts
			.join(separator)
			.replace(/  /g, separator)
			.replace(/  /g, separator)
			.replace(/ /g, separator)
			.replace(',' + separator, ',')
			.split(separator);

		var onlyWords = parts.every(function(string) {
			return /^[a-zåäö.]+$/i.test(string);
		});
		if(onlyWords) {
			return [{
				course: rowTexts.join(' '),
				unknowns: [],
				teacher: null,
				location: null
			}];
		}

		var details = [];

		while(parts.length) {
			var course = parts.shift();
			var unknowns = [];
			while(parts[0] && isUnknown(parts[0])) {
				unknowns.push(parts.shift());
			}
			var teacher = null;
			if(parts[0] && isTeacher(parts[0])) {
				teacher = parts.shift();
			}
			var location = null;
			if(parts[0] && isLocation(parts[0])) {
				location = parts.shift();
			}
			details.push({
				course: course,
				unknowns: unknowns,
				teacher: teacher,
				location: location
			});
		}

		return details;

		// if(rows.length == 2) {
		// 	var parts = rows[1].text.split('  ');
		// 	return [{
		// 		course: rows[0].text,
		// 		unknown: parts[0],
		// 		teacher: parts[1],
		// 		location: null
		// 	}];
		// } else if(rows.length == 3) {
		// 	var parts = rows[2].text.split('  ');
		// 	return [{
		// 		course: rows[0].text,
		// 		unknown: rows[1].text,
		// 		teacher: parts[0],
		// 		location: parts[1] ? parts[1] : null
		// 	}]
		// } else if(rows.length > 3) {
		// 	return [];
		// }
	}

	function completePartialTime(partialText) {
		var timeText = timeTexts.filter(function(timeText) {
			return timeText.y < partialText.y;
		})
		.sort(function(a, b) {
			return b.y - a.y;
		})[0];

		partialText.text = timeText.text.split(':')[0] + ':' + partialText.text;

		return partialText;
	}
	
	function isOneOrMore(string, fn) {
		var parts = string.split(',');
		return parts.filter(fn).length == parts.length;
	}
	function isLocation(string) {
		var regex = /^[a-z]\d{1,3}(-skrivsalen)?$/i;
		return isOneOrMore(string, function(string) {
			return regex.test(string);
		});
	}
	function isTeacher(string) {
		var regex = /^[a-zåäö]{2,5}$/i;
		return isOneOrMore(string, function(string) {
			return regex.test(string);
		});
	}
	function isCourse(string) {
		var regex = /(^[a-zåäö]{3,}\d{1,2}\w?$)|(^gyar[a-zåäö]{2,3}$)|(^tisdag$)|(^mentorsråd$)|(^[a-z]\d{1,3}(-skrivsalen)?$)/i;
		return regex.test(string);
	}
	function isUnknown(string) {
		return !isLocation(string) && !isTeacher(string) && !isCourse(string);
	}
	function isTime(string) {
		return /^\d{2}:\d{2}$/.test(string);
	}
	function isPartialTime(string) {
		return /^\d{2}$/.test(string);
	}
	function stringStartsWith(string, test) {
		return test.lastIndexOf(string, 0) === 0;
	}
	// console.log(lessonFills.map(x => x.rows.map(y => y.text)))
	// console.log(lessonFills.map(x => x.rows.map(y => y.text).join('|').replace(/  /g, '|').replace(/ /g, '|').split('|')))

	var lessons = lessonFills.map(function(lessonFill) {
		return {
			startTime: lessonFill.startTime,
			endTime: lessonFill.endTime,
			details: lessonFill.details,
			rows: lessonFill.rows.map(x => x.text)
		};
	});

	// console.log(lessonFills.map(x => {
	// 	// return x.details[0].location;
	// 	// return x.details;
	// 	return x.details.map(x => x.unknowns);
	// }));

	// var details = lessonFills.reduce(function(details, lessonFill) {
	// 	return details.concat(lessonFill.details);
	// }, [])
	// console.log(details.map(x => {
	// 	// return x.details[0].location;
	// 	return x.location;
	// }));

	function intersectHorizontalLine(yMin, yMax, yLine) {
		return yLine >= yMin && yLine <= yMax;
	}
	function intersectRectangles(xMax1, yMax1, xMin1, yMin1, xMax2, yMax2, xMin2, yMin2) {
		if (xMax1 < xMin2) return false; // a is left of b
		if (xMin1 > xMax2) return false; // a is right of b
		if (yMax1 < yMin2) return false; // a is above b
		if (yMin1 > yMax2) return false; // a is below b
		return true; // boxes overlap
	}

	return lessons;
}