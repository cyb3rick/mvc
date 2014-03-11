
module.exports = {
	name: "base",	
	extend: function(properties) {
		/**
		 * properties: properties of the child
		 * object. if a property has the same
		 * value of the parent (this), it's 
		 * value will be overriden. 
		 */
				
		/**
		 * _.extend(destination, sources*)
		 * Copies the properties from sources to
		 * the destination object. It's in-order
		 * so rightmost objects will override
		 * same-name properties of previous
		 * source objects.
		 * 
		 * Example:
		 * destination: {}
		 * source1: this: {name: 'base', extend: 1}
		 * source2: child: {name: 'home', extend: 2, custom: 'property'}
		 * 
		 * returns {name: 'home', extend: 2, custom: 'property}
		 * 
		 * TODO: check why underscore is failing to load
		 */
		
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
