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

var View = require('../views/Base');

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
		
		//This references to a requests.html file in /templates		
		var v = new View(res, 'rest-api'); 
		v.render({
			title: 'REST API',
			content: 'Information about the REST API',
			info: 'In order to make calls to the REST API '+
				  'a valid API key must be provided.'
		});	
			
	},
	//*************************************************************************
    // listByYear - A handler to get updates of specified year.
    //*************************************************************************
	listByYear: function(req, res, next) {
				
		this.validate(req, res, function() {
			// Route contained a valid API key
			if (req.params && req.params.year) {
				// Route contains a year
				// TODO: validate year using moment library				
				updateModel.findByYear(req.params.year, function(err,updates) {
					if (!err) {
						var v = new View(res, 'rest-api-updates'); 
						v.render({
							title: 'REST API',
							content: 'Information about the REST API',
							info: 'In order to make calls to the REST API '+
								  'a valid API key must be provided.',
							updates: updates 				 
						});				
					} else {			
						res.send(500, err);
						console.log("Error: listByYear -> findByYear -> " + err);					
					}					
				});
			}
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
		keyModel.findKeyById(req.params.key, function(err, key) {
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
