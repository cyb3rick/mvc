
module.exports = {
	name: "base",	
	extend: function(properties) {	
		/**
		 * Creates a new object. Then copies
		 * module.exports (this) properties
		 * to this new object. Then, the 
		 * child properties are coppied, 
		 * overriding same-name properties
		 * of (this).
		 */
		var child = {};
		for (var key in module.exports) {
			child[key] = module.exports[key];
		}		
		for (var key in properties) {
			child[key] = properties[key];
		}		
		return child;
	},
	run: function(req, res, next) {		
		 /* Here we define the middleware magic
		 	of our child controller */		 
	}
};
