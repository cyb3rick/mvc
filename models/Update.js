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

// To get days in month
var moment = require('moment');

// To parse object id string into ObjectID object
var ObjectID = require('mongodb').ObjectID;

var UpdateModel = baseModel.extend({	
	findByYear: function(year, callback) {		
		// Referene: http://cookbook.mongodb.org/patterns/date_range/
		
		// Define date range
		var start = new Date(year, 1-1, 1);
		var end = new Date(year, 12-1, 31);
		
		// Query
		this.db.collection('updates')
			.find({'date': {$gte: start, $lt: end}})
				.toArray(callback);
	},
	findByMonth: function(year, month, callback) {	
		
		// Get days in month (remember months are 0-based in JS dates)
		var daysInMonth = moment(new Date(year, month-1, 1)).daysInMonth();
			
		// Define date range
		var start = new Date(year, month-1, 1);
		var end = new Date(year, month-1, daysInMonth);
						
		// Query
		this.db.collection('updates')
			.find({'date': {$gte: start, $lt: end}})
				.toArray(callback);		
	},
	findByDay: function(year, month, day, callback) {			
		// Define date range
		// y, m, d, hh, mm, ss
		// hh - 24 is only used to denote midnight at the end of a calendar day
		// Reference: http://en.wikipedia.org/wiki/ISO_8601
		var start = new Date(year, month-1, day, 0, 0, 0);			
		var end = new Date(year, month-1, day, 24, 0, 0);
						
		// Query
		this.db.collection('updates')
			.find({'date': {$gte: start, $lt: end}})
				.toArray(callback);	
	}
});

module.exports = UpdateModel;
