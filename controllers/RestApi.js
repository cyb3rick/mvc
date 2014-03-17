var BaseController = require('./Base');
var View = require('../views/Base');

var moment = require('moment');

//Models
//Remember, require('path/to/model') returns a constructor
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
	listByYear: function(req, res, next) {
		
		this.validate(req, res, function() {
			
			if (req.params && req.params.year) {
				
				updateModel.findByYear(req.params.year, function(err, updates) {
					var v = new View(res, 'rest-api-updates'); 
					v.render({
						title: 'REST API',
						content: 'Information about the REST API',
						info: 'In order to make calls to the REST API '+
							  'a valid API key must be provided.',
						updates: updates // updates					 
					});		
				});
			}
		});
	},	
	validate: function(req, res, next) {
		// TODO: place in REST controller
		//A key was included
		
		updateModel.setDB(req.db);
		keyModel.setDB(req.db);
		
		keyModel.getKeyById(req.params.key, function(err, key) {
			if (!err) {
				next();
			} else {
				res.end("Error: Wrong API key.");
			}
		});
	}
});
