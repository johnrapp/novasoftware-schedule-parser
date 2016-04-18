var express = require('express'),
	app = express();

app.use(express.static(__dirname));

app.listen(8088, function() {
	console.log('Server up on port 8088.')
});

app.get('*', function(req, res) {
	res.sendfile(__dirname + '/index.html');
});