var Model = require("../models/Base"),
	dbMockup = {};
	
describe("Models", function() {
	
	it("should create a new model", function(next) {
		var model = new Model(dbMockup);
		expect(model.db).toBeDefined();
		expect(model.extend).toBeDefined();
		next();		
	});
	
	it("should be extendable", function(next) {
		var model = new Model(dbMockup);
		var OtherTypeOfModel = model.extend({
			myCustomModelMethod: function() {				
				
			}
		});
		
		var model2 = new OtherTypeOfModel(dbMockup);
		expect(model2.db).toBeDefined();
		expect(model2.myCustomModelMethod).toBeDefined();
		next();		
	});
	
	it("should not modify the base prototype chain", function(next) {
		var m = new Model(dbMockup);
		
		var OneChild = m.extend({
			prop: 'OK'
		});
		
		var AnotherChild = m.extend({
			prop: 'Not OK'
		});
 		 		
 		var oneChildInstance = new OneChild();
 		var anotherChildInstance = new AnotherChild();
	
 		expect(oneChildInstance.prop).toBe('OK');	
 		expect(anotherChildInstance.prop).toBe('Not OK');

 		next();
 	});
	
});
