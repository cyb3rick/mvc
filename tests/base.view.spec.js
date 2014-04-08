var View = require('../views/Base');

describe("Base view", function() {
	it("should create and render new view", function(next) {
		var responseMockup = {
			render: function(template, data) {
				expect(data.myProperty).toBe('value');
				expect(template).toBe('template-file');
				next();				
			}			
		};
		var v = new View(responseMockup, 'template-file');
		v.render({myProperty: 'value'});
	});	
	
	it("should be extendable", function(next) {
		var v = new View();		
		var OtherView = v.extend({
			render: function(data) {				
				expect(data.prop).toBe('yes');
				next();
			}				
		});
		var otherViewInstance = new OtherView();
		expect(otherViewInstance.render).toBeDefined();
		otherViewInstance.render({prop: 'yes'});
	});
		
	it("should not modify the base prototype chain", function(next) {
		var v = new View();
		
		var OneChild = v.extend({
			prop: 'OK'
		});
		
		var AnotherChild = v.extend({
			prop: 'Not OK'
		});
 		 		
 		var oneChildInstance = new OneChild();
 		var anotherChildInstance = new AnotherChild();
	
 		expect(oneChildInstance.prop).toBe('OK');	
 		expect(anotherChildInstance.prop).toBe('Not OK');

 		next();
 	});
});
