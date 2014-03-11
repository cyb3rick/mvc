var BaseController = require('../controllers/Base');

describe("Base controller", function() {
	it("should have an extend method that returns a child instance", function(next) {
		expect(BaseController.extend).toBeDefined();
		var child = BaseController.extend({name:"my child controller"});		
		expect(child.name).toBe('my child controller');				
		expect(child.run).toBeDefined();
		next();				
	});		
	it("should be able to create different children", function(next) {
		var child1 = BaseController.extend({name: 'child controller 1', custom: 'property'});
		var child2 = BaseController.extend({name: 'child controller 2'});
		expect(child1.name).not.toBe(child2.name);
		expect(child1.name).toBe('child controller 1');	
		expect(child1.custom).toBeDefined();
		expect(child2.custom).not.toBeDefined();
		next();
	});	
});
