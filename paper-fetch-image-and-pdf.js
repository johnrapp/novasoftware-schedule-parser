var novasoftware = require('./novasoftware.js');
var pdfParser = require('./next-pdf-parser.js');
var fs = require('fs');
var PDFParser = require("pdf2json/pdfparser");
var parseLessons = require("./parse-lessons.js");

var classId = '{7468BC19-9F7C-49F9-84F2-2D3D76F579E1}'; //13te
var week = 11;
var w = 611, h = 315;

novasoftware.schedulePng(week, classId, w, h, function(err, buffer) {
	fs.writeFileSync('test-schedule.png', buffer);
});

novasoftware.schedulePdf(week, classId, function(err, buffer) {
	var pdfParser = new PDFParser();

	pdfParser.on("pdfParser_dataError", function(err) {
		console.error("parseError", err)
	});

	pdfParser.on("pdfParser_dataReady", function(result) {
		var pdfData = result.data;

		fs.writeFileSync('test-schedule.json', JSON.stringify(pdfData));
	});

	pdfParser.parseBuffer(buffer);
});
