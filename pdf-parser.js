var fs = require('fs');
var PDFParser = require("pdf2json/pdfparser");
var parseLessons = require('./parse-lessons.js');

module.exports = function parsePdf(buffer, callback) {
	var pdfParser = new PDFParser();

	pdfParser.on("pdfParser_dataError", function(err) {
		callback(err, null)
	});

	pdfParser.on("pdfParser_dataReady", function(result) {

		var pdfData = result.data;

		try {
			var schedule = parseLessons(pdfData);
			callback(null, schedule);
		} catch(err) {
			callback('Schedule parser error', null);
		}
	});

	pdfParser.parseBuffer(buffer);
}