module.exports = function(db) {
	this.db = db;
};

module.exports.prototype = {
	extend: function(properties) {		
		var Child = function(db) {
			this.db = db;			
		};
		Child.prototype = new module.exports();
		for(var key in properties) {
			Child.prototype[key] = properties[key];
		}
		return Child;		
	},
	setDB: function(db) {
		this.db = db;
	}	
};
