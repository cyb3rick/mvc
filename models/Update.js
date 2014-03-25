//*****************************************************************************
//
// Update.js    Model to represent location updates stored in DB.
//
// Notes		N/A
//
// Author	 	Erick Caraballo
//
//*****************************************************************************

var Model = require('./Base');
var baseModel = new Model();

var ObjectID = require('mongodb').ObjectID;

var UpdateModel = baseModel.extend({	
	findByYear: function(year, callback) {
		//this.db.collection('updates').find({'year': year}).toArray(callback);
		//TODO: Create query that will fetch by year 
		callback(undefined, [{'lat': 123, 'lng': 456}, {'lat': 113, 'lng': 246}]);
	},
	findByMonth: function(year, month, callback) {		
		//TODO: Create query that will fetch by year and month
		//callback(undefined, [{'lat': 789, 'lng': 123}]);
		
	},
	findByDay: function(year, month, day, callback) {
		//TODO: Create queriy that will fetch by year, month and day
		//callback(undefined, [{'lat': 456, 'lng': 789}]);
	}
});

module.exports = UpdateModel;
