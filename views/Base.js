/**
 * This is the constructor of our module.
 * Remember: module.exports is the object
 * returned when we do a require('/path/to/module')
 */
module.exports = function(response, template) {
	this.response = response;
	this.template = template;
};
module.exports.prototype = {
	extend: function(properties) {
		var Child = module.exports;
		//TODO: Is this line really necessary? \/
		Child.prototype = module.exports.prototype;
		for (var key in properties) {
			Child.prototype[key] = properties[key];
		}
		return Child;
	},
	render: function(data) {
		if (this.response && this.template) {
			this.response.render(this.template, data);
		}
	}
};
