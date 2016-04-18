var novasoftware = require('./novasoftware.js');
var pdfParser = require('./next-pdf-parser.js');
var fs = require('fs');
var async = require('async');

function parseSchedule(week, classId, callback) {
	novasoftware.schedulePdf(week, classId, function(err, buffer) {
		pdfParser(buffer, function(schedule) {
			
			schedule.className = className;

			var incompleteLessons = schedule.lessons.filter(function(lesson) {
				return lesson.details == null;
			});

			fs.writeFileSync("tt6.json", JSON.stringify(incompleteLessons, null, '\t'));
			// fs.writeFileSync("tt5.json", JSON.stringify(schedule, null, '\t'));
		});
	});
}
module.exports = parseSchedule;

var weeks = [6, 8];
var classId = '{ECFB8E2F-7291-415A-B102-96DAF243319B}' //13esmu
var className = '13ESMU' //13esmu

var PDFParser = require("pdf2json/pdfparser");

function parsePdf(buffer, callback) {
	var pdfParser = new PDFParser();

	pdfParser.on("pdfParser_dataError", function(err) {
		callback(err, null)
		// console.log("parseError", err)
	});

	pdfParser.on("pdfParser_dataReady", function(result) {

		var pdfData = result.data;

		callback(null, pdfData);
	});

	pdfParser.parseBuffer(buffer);
}


async.parallel(weeks.map(function(week) {
	return function(callback) {
		novasoftware.schedulePdf(week, classId, function(err, buffer) {
			parsePdf(buffer, callback);
		});
	};
}), function(err, pdfDatas) {
	pdfDatas = pdfDatas.map(function(data) {
		return data.Pages[0].Fills;
	})
	console.log(!!equal(pdfDatas[0], pdfDatas[1]))
});


//equal.js

//Returns the object's class, Array, Date, RegExp, Object are of interest to us
var getClass = function(val) {
	return Object.prototype.toString.call(val)
		.match(/^\[object\s(.*)\]$/)[1];
};

//Defines the type of the value, extended typeof
var whatis = function(val) {

	if (val === undefined)
		return 'undefined';
	if (val === null)
		return 'null';

	var type = typeof val;

	if (type === 'object')
		type = getClass(val).toLowerCase();

	if (type === 'number') {
		if (val.toString().indexOf('.') > 0)
			return 'float';
		else
			return 'integer';
	}

	return type;
};

var compareObjects = function(a, b) {
	if (a === b)
		return true;
	for (var i in a) {
		if (b.hasOwnProperty(i)) {
			if (!equal(a[i],b[i])) return false;
		} else {
			return false;
		}
	}

	for (var i in b) {
		if (!a.hasOwnProperty(i)) {
			return false;
		}
	}
	return true;
};

var compareArrays = function(a, b) {
	if (a === b)
		return true;
	if (a.length !== b.length)
		return false;
	for (var i = 0; i < a.length; i++){
		if(!equal(a[i], b[i])) return false;
	};
	return true;
};

var _equal = {};
_equal.array = compareArrays;
_equal.object = compareObjects;
_equal.date = function(a, b) {
	return a.getTime() === b.getTime();
};
_equal.regexp = function(a, b) {
	return a.toString() === b.toString();
};
//	uncoment to support function as string compare
//	_equal.fucntion =  _equal.regexp;



/*
 * Are two values equal, deep compare for objects and arrays.
 * @param a {any}
 * @param b {any}
 * @return {boolean} Are equal?
 */
var equal = function(a, b) {
	if (a !== b) {
		var atype = whatis(a), btype = whatis(b);

		if (atype === btype)
			return _equal.hasOwnProperty(atype) ? _equal[atype](a, b) : a==b;

		return false;
	}

	return true;
};