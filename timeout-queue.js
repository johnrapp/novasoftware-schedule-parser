var createQueue = function(timeout) {
	var interval;
	var queueArray = [];
	var users = 0;


	function queue(fn) {
		queueArray.push(fn);
	};

	function tick() {
		var fn = queueArray.pop();
		fn && fn();
	}

	queue.start = function() {
		if(users === 0) {
			interval = setInterval(tick, timeout);
		}
		++users;
		
	};

	queue.stop = function() {
		clearInterval(interval);

		users = 0;
	};

	queue.done = function() {
		--users;
		if(users === 0) {
			queue.stop();
		}
	}

	return queue;
}

module.exports = {
	create: createQueue
};
