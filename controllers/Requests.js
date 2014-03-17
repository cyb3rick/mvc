var BaseController = require('./Base');
var View = require('../views/Base');

var moment = require('moment');

//Models
//Remember, require('path/to/model') returns a constructor
var keyModel = new (require('../models/Key'));

module.exports = BaseController.extend({
	name: 'Request API Key',
	run: function(req, res, next) {
		//This references to a requests.html file in /templates		
		var v = new View(res, 'requests'); 
		v.render({
			title: 'Request API Key',
			content: 'Request an API Key',
			info: 'You need to request an API key in '+
				  'order to make REST API calls. If your ' + 
				  'request is approved, a notification will ' +
				  'be sent to the specified email address.'
		});		
	},
	createKeyRequest: function(req, res, next) {
		keyModel.setDB(req.db);
		var keyRequest = {
			'fullname': req.body.fullname,
			'email': req.body.email,
			'message': req.body.message,
			'disabled': true	
		};												
		keyModel.create(keyRequest, function(err) {
			if (!err) {
				//TODO: Create another view to display feedback message and back button
				res.end('Success: Request has been sent. If approved, you will be notified by email.'); 
				console.log('Success: creating key request.'); 
			}
			else { console.log('Error: creating key request.'); }
		});
	}
});
