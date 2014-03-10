
describe("MongoDB", function() {
	it("is there a mongodb server running", function(next){
		var mongoClient = require('mongodb').MongoClient;		
		mongoClient.connect('mongodb://127.0.0.1:27017/myDb', function(err,db){
			expect(err).toBe(null);			
		});		
		next();
	});		
});
