
var View = require('./Base'); // Get Base view constructor
var baseView = new View(); 

var JSONView = baseView.extend({
	render: function(data) {
		if (this.response && this.template) {
			this.response.contentType('application/json');
			this.response.send(JSON.stringify(data));			
		}
	}
});

module.exports = JSONView;

