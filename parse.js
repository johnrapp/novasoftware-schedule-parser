var parser = require('./parser.js');
var fs = require('fs');

var className = '15esmu';

var stream = fs.createReadStream('shedules/' + className + '.pdf');

var bufs = [];
stream.on('data', function(d) {
	bufs.push(d);
});
stream.on('end', function() {
	var buf = Buffer.concat(bufs);
	parser.parse(className, buf);
});
