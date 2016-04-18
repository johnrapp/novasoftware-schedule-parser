var fs = require('fs');
var PDFParser = require("pdf2json/pdfparser");
var parseLessons = require('./parse-lessons.js');

module.exports = function parsePdf(buffer, callback) {
	var pdfParser = new PDFParser();

	pdfParser.on("pdfParser_dataError", function(err) {
		callback(err, null)
		// console.log("parseError", err)
	});

	pdfParser.on("pdfParser_dataReady", function(result) {

		var pdfData = result.data;

		fs.writeFileSync("next-pdf-parser.json", JSON.stringify(pdfData));

		var schedule = parseLessons(pdfData);

		callback(null, schedule);
	});

	pdfParser.parseBuffer(buffer);
}

// function parseSchedule(pdfData) {
// 	var sw = 0.995;
// 	var width = Math.round(pdfData.Width * 6) * sw;

// 	var page = pdfData.Pages[0];

// 	var height = Math.round(page.Height * 6);

// 	var texts = page.Texts

// 	var lessonFills = page.Fills.filter(function(fill) {
// 		//Not an empty fill
// 		return fill.w > 0 && fill.h > 0
// 		//Not a title fill
// 		&& !(fill.w == 18.391 && fill.h == 2.75)
// 		//Not too big of a fill
// 		&& fill.h < 30
// 		//Not too small of a fill
// 		&& fill.w * fill.h > 2;
// 	});

// 	var sx = 1.1;
// 	var sy = 1.07;
// 	var tx = -30.5;
// 	var ty = -12;

// 	lessonFills = lessonFills.map(function(fill) {
// 		var cx = (fill.x + fill.w / 2) * 6 * sx + tx;
// 		return {
// 			x: fill.x * 6 * sx + tx,
// 			y: fill.y * 6 * sy + ty,
// 			w: fill.w * 6 * sx,
// 			h: fill.h * 6 * sy,
// 			oc: fill.oc,
// 			cx: cx,
// 			cy: (fill.y + fill.h / 2) * 6 * sy + ty,
// 			day: Math.floor(cx / width * 5)
// 		}
// 	});

// 	//Remove the five last texts since they are the titles
// 	//They are always in the right order
// 	var titles = texts.splice(texts.length - 5, 5).map(function(text) {
// 		return decodeURIComponent(text.R[0].T);
// 	});

// 	texts = texts.map(function(text) {
// 		//The x and y where offsetted so i fixed them!
// 		text.x = text.x + 0.7; 
// 		text.y = text.y + 0.42;
// 		//These values seem to work fine
// 		text.w = 1.5;
// 		text.h = 0.5;

// 		var cx = (text.x + text.w / 2) * 6 * sx + tx;
// 		return {
// 			x: text.x * 6 * sx + tx,
// 			y: text.y * 6 * sy + ty,
// 			w: text.w * 6,
// 			h: text.h * 6,
// 			cx: cx,
// 			cy: (text.y + text.h / 2) * 6 * sy + ty,
// 			day: Math.floor(cx / width * 5),
// 			text: decodeURIComponent(text.R[0].T)
// 		}
// 	});

// 	var lessonTexts = [], timeTexts = [];

// 	texts.forEach(function(text) {
// 		if(isTime(text.text)) {
// 			timeTexts.push(text);
// 		} else if(isPartialTime(text.text)) {
// 			timeTexts.push(completePartialTime(text));
// 		} else {
// 			lessonTexts.push(text);
// 		}
// 	});

// 	function day() { return { lessonFills: [], lessonTexts: [], timeTexts: [] } }
// 	var days = [day(), day(), day(), day(), day()];
// 	// var days = [day(), day(), day(), day(), day()];
// 	lessonFills.forEach(function(fill) {
// 		days[fill.day].lessonFills.push(fill);
// 	});
// 	lessonTexts.forEach(function(text) {
// 		days[text.day].lessonTexts.push(text);
// 	});
// 	timeTexts.forEach(function(text) {
// 		days[text.day].timeTexts.push(text);
// 	});

// 	days.forEach(function(day, i) {
// 		day.lessonFills.forEach(function(lessonFill, j) {

// 			var startTime = day.timeTexts.filter(function(timeText) {
// 				return intersectHorizontalLine(
// 					timeText.y,
// 					timeText.y + timeText.h,
// 					lessonFill.y
// 				);
// 			})[0].text;

// 			var endTime = day.timeTexts.filter(function(timeText) {
// 				return intersectHorizontalLine(
// 					timeText.y,
// 					timeText.y + timeText.h,
// 					lessonFill.y + lessonFill.h
// 				);
// 			})[0].text;

// 			lessonFill.startTime = startTime;
// 			lessonFill.endTime = endTime;

// 			var rows = day.lessonTexts.filter(function(lessonText) {
// 				return intersectRectangles(
// 					lessonFill.x + lessonFill.w,
// 					lessonFill.y + lessonFill.h,
// 					lessonFill.x,
// 					lessonFill.y,
// 					lessonText.x + lessonText.w,
// 					lessonText.y + lessonText.h,
// 					lessonText.x,
// 					lessonText.y
// 				);
// 			});

// 			lessonFill.rows = rows;

// 			lessonFill.details = parseRows(rows, lessonFill);
// 		});

// 	});

// 	function parseRows(rows, lessonFill) {
// 		if(!rows.length) { return null }

// 		var separator = '|||';
// 		var rowTexts = rows.map(function(row) {
// 			return row.text;
// 		});
		
// 		var parts = rowTexts
// 			.join(separator)
// 			.replace(/  /g, separator)
// 			.replace(/  /g, separator)
// 			.replace(/ /g, separator)
// 			.replace(',' + separator, ',')
// 			.split(separator);

// 		var onlyWords = parts.every(function(string) {
// 			return /^[a-zåäö.]+$/i.test(string);
// 		});
// 		if(onlyWords) {
// 			return [{
// 				course: rowTexts.join(' '),
// 				unknowns: [],
// 				teacher: null,
// 				location: null
// 			}];
// 		}

// 		var details = [];

// 		while(parts.length) {
// 			var course = parts.shift();
// 			var unknowns = [];
// 			while(parts[0] && isUnknown(parts[0])) {
// 				unknowns.push(parts.shift());
// 			}
// 			var teacher = null;
// 			if(parts[0] && isTeacher(parts[0])) {
// 				teacher = parts.shift();
// 			}
// 			var location = null;
// 			if(parts[0] && isLocation(parts[0])) {
// 				location = parts.shift();
// 			}
// 			details.push({
// 				course: course,
// 				unknowns: unknowns,
// 				teacher: teacher,
// 				location: location
// 			});
// 		}

// 		return details;
// 	}

// 	function completePartialTime(partialText) {
// 		var timeText = timeTexts.filter(function(timeText) {
// 			return timeText.y < partialText.y;
// 		})
// 		.sort(function(a, b) {
// 			return b.y - a.y;
// 		})[0];

// 		partialText.text = timeText.text.split(':')[0] + ':' + partialText.text;

// 		return partialText;
// 	}
	
// 	function isOneOrMore(string, fn) {
// 		var parts = string.split(',');
// 		return parts.filter(fn).length == parts.length;
// 	}
// 	function isLocation(string) {
// 		var regex = /^[a-z]\d{1,3}(-skrivsalen)?$/i;
// 		return isOneOrMore(string, function(string) {
// 			return regex.test(string);
// 		});
// 	}
// 	function isTeacher(string) {
// 		var regex = /^[a-zåäö]{2,5}$/i;
// 		return isOneOrMore(string, function(string) {
// 			return regex.test(string);
// 		});
// 	}
// 	function isCourse(string) {
// 		var regex = /(^[a-zåäö]{3,}\d{1,2}\w?$)|(^gyar[a-zåäö]{2,3}$)|(^tisdag$)|(^mentorsråd$)|(^[a-z]\d{1,3}(-skrivsalen)?$)/i;
// 		return regex.test(string);
// 	}
// 	function isUnknown(string) {
// 		return !isLocation(string) && !isTeacher(string) && !isCourse(string);
// 	}
// 	function isTime(string) {
// 		return /^\d{2}:\d{2}$/.test(string);
// 	}
// 	function isPartialTime(string) {
// 		return /^\d{2}$/.test(string);
// 	}
// 	function stringStartsWith(string, test) {
// 		return test.lastIndexOf(string, 0) === 0;
// 	}

// 	var lessons = lessonFills.map(function(lessonFill) {
// 		return {
// 			startTime: lessonFill.startTime,
// 			endTime: lessonFill.endTime,
// 			details: lessonFill.details,
// 			day: lessonFill.day,
// 			cx: lessonFill.cx,
// 			cy: lessonFill.cy
// 		};
// 	});

// 	function intersectHorizontalLine(yMin, yMax, yLine) {
// 		return yLine >= yMin && yLine <= yMax;
// 	}
// 	function intersectRectangles(xMax1, yMax1, xMin1, yMin1, xMax2, yMax2, xMin2, yMin2) {
// 		if (xMax1 < xMin2) return false; // a is left of b
// 		if (xMin1 > xMax2) return false; // a is right of b
// 		if (yMax1 < yMin2) return false; // a is above b
// 		if (yMin1 > yMax2) return false; // a is below b
// 		return true; // boxes overlap
// 	}

// 	return {
// 		titles: titles,
// 		lessons: lessons
// 	};
// }