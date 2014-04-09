//*****************************************************************************
//
// RestApi.js   Controller of the REST API. This module is in charge of 
//				handling routes that compose the RESTful API, as well as 
//				validating calls. Calls to the API are validated by checking
//				existance and status of provided key.
//				Remember, every call to the REST API must include an activated
//				API key.
//
// Notes		This module is used by the server application, which attaches a 
//				controller handler to a route (i.e. /updates) and method (i.e. 
//				GET, POST, etc.).
//
// Author	 	Erick Caraballo
//
//*****************************************************************************

var BaseController = require('./Base');

var BaseView = require('../views/Base');
var JSONView = require('../views/JSONView');

// A library for parsing, 
// validating, manipulating, 
// and formatting dates.
var moment = require('moment');

// Models
var keyModel = new (require('../models/Key'));
var updateModel = new (require('../models/Update'));

module.exports = BaseController.extend({
	name: 'REST API',
	run: function(req, res, next) {
		//Act depend on route components
		if (req.query && req.query.key) {			
			if (req.query.year && req.query.month && req.query.day) {
				this.listByDay(req, res, next);	
			}
			else if (req.query.year && req.query.month){
				this.listByMonth(req, res, next);
			}
			else if (req.query.year) {
				this.listByYear(req, res, next);
			}			
		}		
		else {
			//This references to a requests.html file in /templates		
			var v = new BaseView(res, 'rest-api'); 
			v.render({
				title: 'REST API',
				content: 'Information about the REST API',				
				queryFormat: '/updates?key=<your_api_key>&year=<yyyy>[&month=<mm>[&day=<dd>]]',
				requestsURL: '/request'		
			});
		}	
			
	},
	//*************************************************************************
    // listByYear - A handler to get updates of specified year.
    //*************************************************************************
	listByYear: function(req, res, next) {
				
		this.validate(req, res, function() {
			// Route contained a valid API key
			
			// TODO: Validate year		
			updateModel.findByYear(req.query.year, function(err, updatesFound) {
				if (!err) {
					// Create a JSON view, pass in any _valid_ template
					// as it won't be used. We'll return raw JSON					
					var v = new JSONView(res, 'rest-api');
					v.render(updatesFound);
				}
				else {
					res.send(500, err);
					console.log("Error: listByYear -> findByYear -> " + err);					
				}
			});			
		});
		
	},	
	//*************************************************************************
    // listByMonth - A handler to get updates of specified year and month.
    //*************************************************************************
	listByMonth: function(req, res, next) {
				
		this.validate(req, res, function() {
			// Route contained a valid API key
			
			// TODO: Validate year and month	
			updateModel.findByMonth(req.query.year, req.query.month, function(err, updatesFound) {
				if (!err) {
					// Create a JSON view, pass in any _valid_ template
					// as it won't be used. We'll return raw JSON					
					var v = new JSONView(res, 'rest-api');
					v.render(updatesFound);
				}
				else {
					res.send(500, err);
					console.log("Error: listByYear -> findByMonth -> " + err);					
				}
			});			
		});
		
	},
	//*************************************************************************
    // listByDay - A handler to get updates of specified year, month and day.
    //*************************************************************************
	listByDay: function(req, res, next) {
				
		this.validate(req, res, function() {
			// Route contained a valid API key
			
			// TODO: Validate parameters
			var year = req.query.year;
			var month = req.query.month;
			var day = req.query.day;
				
			updateModel.findByDay(year, month, day, function(err, updatesFound) {
				if (!err) {
					// Create a JSON view, pass in any _valid_ template
					// as it won't be used. We'll return raw JSON					
					var v = new JSONView(res, 'rest-api');
					v.render(updatesFound);
				}
				else {
					res.send(500, err);
					console.log("Error: listByYear -> findByDay -> " + err);					
				}
			});			
		});
		
	},	
    //*************************************************************************
    // validate - A custom middleware that checks a valid API key was passed 
    //			  in every call to the REST API. A valid key is a key that 
    //			  exists in DB and has <disabled> property set to false.
    //*************************************************************************
	validate: function(req, res, next) {
		
		// Make model aware of DB
		updateModel.setDB(req.db);
		keyModel.setDB(req.db);
				
		// Try to find key in DB
		keyModel.findKeyById(req.query.key, function(err, key) {
			if (!err) {
				// Key exits in DB
				if (key[0] && key[0].disabled === false) {
					// Key exists and is NOT disabled, proceed
					next();
				}
				else {
					// Key doesn't exist or is disabled, display error and
					// return browser a 403 unauthorized error.
					res.send(403, "Unauthorized access: Key is disabled.");				
				}				
			} else {
				res.send(403, err);
				console.log("Error: validate -> getKeyById -> " + err);									
			}
		});
		
	}
});
