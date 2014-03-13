var BaseController = require('./Base');
var View = require('../views/Base');
var model = new (require('../models/Admin')); // require('path/to/model') returns a constructor

module.exports = BaseController.extend({
	name: 'Admin',
	username: 'root',
	password: 'root',
	run: function(req, res, next) {			
		this.authorize(req, res, function (){			
			var v = new View(res, 'admin');
			v.render({
				title: 'Administration',
				content: 'Welcome to the Administration Panel'
			});
		});
	},
	announcements: function(req, res, next) {		
		this.authorize(req, res, function() {			
			model.getAnnouncements(function(err, documents) {
				if (!err) {			
					var v = new View(res, 'admin-announcements');
					v.render({
						title: 'Announcements',
						content: 'List of Announcements:',
						announcements: documents
					});
				}
			});			
		});
	},	
	keys: function(req, res, next) {
		this.authorize(req, res, function() {			
			model.getKeys(function(err, documents) {
				if (!err) {			
					var v = new View(res, 'admin-keys');
					v.render({
						title: 'API Keys',
						content: 'List of API Keys:',
						keys: documents
					});
				}
			});			
		});
	},
	authorize: function(req, res, next) {	
		console.log("From Path: " + req.path);	
		var isAuthorized = (
			req.session &&
			req.session.mvc &&
			req.session.mvc === true
		) || (
			req.body &&
			req.body.username === this.username,
			req.body.password === this.password
		);
		
		if (isAuthorized) {			
			req.session.mvc = true;
			req.session.save();
			model.setDB(req.db);
			next();
		} else {
			var v = new View(res, 'admin-login');
			v.render({
				title: 'Login',
				content: 'Please Log In',
				from: req.path			
			});
		}
	}
});
