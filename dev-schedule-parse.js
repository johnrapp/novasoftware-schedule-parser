var novasoftware = require('./novasoftware.js');
var pdfParser = require('./next-pdf-parser.js');
var fs = require('fs');
var PDFParser = require("pdf2json/pdfparser");
var parseLessons = require("./parse-lessons.js");

function parseSchedule(week, classId, className, callback) {
	// novasoftware.schedulePdf(week, classId, function(err, buffer) {
	// 	// var buffer = fs.readFileSync('schedule.pdf');
	// 	pdfParser(buffer, function(schedule) {
			
	// 		schedule.className = className;

	// 		var incompleteLessons = schedule.lessons.filter(function(lesson) {
	// 			return lesson.details == null;
	// 		});

	// 		fs.writeFileSync("tt6.json", JSON.stringify(incompleteLessons, null, '\t'));
	// 		// fs.writeFileSync("tt5.json", JSON.stringify(schedule, null, '\t'));
	// 	});
	// });
}
module.exports = parseSchedule;

var week = 11;
// var classId = '{ECFB8E2F-7291-415A-B102-96DAF243319B}' //13esmu
// var className = '13ESMU' //13esmu
var classId = '{55756A9A-F5F8-471B-96CA-E0C9CCEA1165}' //14esmu
var className = '13ESMU' //14esmu

var coords = [[13,  48]];
var width = 611, height = 315;

//  13, 48

novasoftware.clickMultiple(week, classId, coords, width, height, function(err, lessons) {
	// fs.writeFileSync("tt7.json", JSON.stringify(lessons, null, '\t'));
	if(err) { return callback(err, null) }

	console.log(lessons)

});

// parseSchedule(week, classId, className);

// var glob = require("glob")
// glob("schedules-vgy/*.json", {}, function (er, files) {
// 	files.forEach(function(fileName) {
// 		var json = fs.readFileSync(fileName, 'utf-8');
// 		var schedule = parseLessons(JSON.parse(json));
// 		fs.writeFileSync(fileName.replace('.json', '.schedule.json'), JSON.stringify(schedule, null, '\t'));
// 	});
// })


// var scheduleMeta = require('./schedule-metadata.js');
// scheduleMeta.fetch(function(err, meta) {

// 	console.log(meta)
// 	meta.classes.forEach(function(classItem) {
// 		fetchAndParsePdf(week, classItem.id, classItem.name);
// 	});

// 	// var classItem = meta.classes[8]; //NB13

// });

function fetchAndParsePdf(week, classId, className) {
	novasoftware.schedulePdf(week, classId, function(err, buffer) {
		fs.writeFileSync("schedules-vgy/" + className.replace('/', '-') + '.pdf', buffer);
		var pdfParser = new PDFParser();

		pdfParser.on("pdfParser_dataError", function(err) {
			console.error("parseError", err)
		});

		pdfParser.on("pdfParser_dataReady", function(result) {
			var pdfData = result.data;

			fs.writeFileSync("schedules-vgy/" + className.replace('/', '-') + '.json', JSON.stringify(pdfData));
		});

		pdfParser.parseBuffer(buffer);
	});
}

// function fetchPng(week, classId, className) {
// 	novasoftware.schedulePng(week, classId, function(err, buffer) {
// 	});
// }
