var fs = require('fs');
var novasoftware = require('./novasoftware.js');

// module.exports.parse = function(week, classId, className, callback) {

	var callback = function(err, data) {
		console.log(err, data);
	};

	// var week = 7;
	var week = 8;
	// var week = 2;

	// var className = '13EKA'; //13eka
	// var classId = '{38AAE271-AE51-4B7F-BF8B-0B6D9B3B3AA6}'; //13eka
	// var classId = '{7468BC19-9F7C-49F9-84F2-2D3D76F579E1}'; //13te
	// var classId = '{994F6F41-4785-4029-834E-A712F897797F}' //15esmu
	// var classId = '{55756A9A-F5F8-471B-96CA-E0C9CCEA1165}' //14esmu
	
	var classId = '{ECFB8E2F-7291-415A-B102-96DAF243319B}' //13esmu

	// var classId = '{120767D8-D6AC-4B2D-9606-C77B1D573FA5}' //Norra Real nb13

	var w = 614, h = 315; // Pdf dimensions * 6
	// var w = 907, h = 583;
	// novasoftware.schedulePng(week, classId, w, h, function(err, body) {
	// 	console.log('Got png');
	// 	console.log(err, body);
	// });

	// var x = 440;
	// var y = 111;
	// var y = 200;

	// var x = 441;
	// var y = 217;
	// var x = 406;
	// var y = 266;

	// var x = 426, y = 152;

	// novasoftware.clickMultiple(week, classId, [[x, y]], w, h, function(err, lessons) {
	// 	console.log('Got click');

	// 	// if(err) { return callback(err, null); }

	// 	var schedule = {
	// 		className: className,
	// 		days: days,
	// 		lessons: lessons
	// 	};
	// 	fs.writeFileSync("lessons.json", JSON.stringify(schedule, null, '\t'));


	// 	// callback(null, schedule);

	// 	// console.log(err, body);
	// });

	var PDFParser = require("pdf2json/pdfparser");

	novasoftware.schedulePdf(week, classId, function(err, buffer) {
		var pdfParser = new PDFParser();

		pdfParser.on("pdfParser_dataError", function(err) {
			callback(err, null)
		});

		pdfParser.on("pdfParser_dataReady", function(result) {

			var data = result.data;

			//Define constant in order to fit pdf-width to image width 
			var sw = 0.995;
			var width = Math.round(data.Width * 6) * sw;

			var page = data.Pages[0];

			var height = Math.round(page.Height * 6);

			var texts = page.Texts;

			//The day texts are always the five last
			var days = texts.slice(texts.length - 5, texts.length).map(function(o) {
				return decodeURIComponent(o.R[0].T);
			});

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

			//Define some constants in order to fit pdf-coordinates
			//to image coordinates
			var sx = 1.1;
			var sy = 1.07;
			var tx = -30.5;
			var ty = -12;

			// lessonFills = lessonFills.map(function(fill) {
			// 	var cx = (fill.x + fill.w / 2) * 6 * sx + tx;
			// 	return {
			// 		// x: fill.x * 6 * sx + tx,
			// 		// y: fill.y * 6 * sy + ty,
			// 		// w: fill.w * 6 * sx,
			// 		// h: fill.h * 6 * sy,
			// 		// oc: fill.oc,
			// 		cx: cx,
			// 		cy: (fill.y + fill.h / 2) * 6 * sy + ty,
			// 		day: Math.floor(cx / width * 5)
			// 	}
			// });

			// var coords = [];
			// // var i = 55;
			// // var i = 9;
			// for(var i = 0; i < 2; i++) {
			// // for(var i = 0; i < lessonFills.length; i++) {
			// 	var x = Math.round(lessonFills[i].cx);
			// 	var y = Math.round(lessonFills[i].cy);
			// 	coords.push([x, y]);
			// 	// coords.push([x, y]);
			// }

		// 	novasoftware.clickMultiple(week, classId, coords, w, h, function(err, lessons) {
		// 		console.log('Got click');

		// 		if(err) { return console.error(err); }

		// 		// if(err) { return callback(err, null); }
			
		// 		lessons.forEach(function(lesson, i) {
		// 			lesson.day = lessonFills[i].day;
		// 		});

		// 		var schedule = {
		// 			className: className,
		// 			days: days,
		// 			lessons: lessons
		// 		};
		// 		fs.writeFileSync("lessons.json", JSON.stringify(schedule, null, '\t'));


		// 		callback(null, schedule);
		// 	});

		// 	fs.writeFileSync("pdf.json", JSON.stringify(data));

		});

		pdfParser.parseBuffer(buffer);
	});


// };