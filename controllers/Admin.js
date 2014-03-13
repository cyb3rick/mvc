var BaseController = require('./Base');
var View = require('../views/Base');
var AdminModel = require('../models/Admin');

module.exports = BaseController.extend({
	name: 'Admin',
	username: 'root',
	password: 'root',
	run: function(req, res, next) {		
				
		if (this.authorize(req)) { // authorized
			req.session.mvc = true;
			req.session.save();
			
			//Once I've verified the admin is logged in
			//I can inspect the route and dpending on that, 
			//create a view and pass it to some helper function.
			
			// i.e. route: /admin/test/one
			//		routeParts: ['admin','test','one']
			var routeParts = req.path.split('/').splice(1);
			
			var v = new View(res, 'admin');
			var self = this;
			self.listAnnouncements(req, function(announcementsArray) {
				self.listKeys(req, function(keysArray) {
					v.render({
						title: 			'Administration',
						content: 		'Welcome to the Control Panel',
						announcements: 	announcementsArray,
						keys: 			keysArray
					});				
				});
			});
		} else { // unauthorized user
			var v = new View(res, 'admin-login');
			v.render({
				title: 'Login',
				content: 'Please Log In'				
			});
		}
	},	
	authorize: function(req) {		
		var adminModel = new AdminModel(req.db);						
		return (
			req.session &&
			req.session.mvc &&
			req.session.mvc === true
		) || (
			req.body &&
			req.body.username === this.username,
			req.body.password === this.password
		);
	},
	listAnnouncements: function(req, callback) {
		//TODO: change to: var announcementModel = new AnnouncementModel(req.db);
		var adminModel = new AdminModel(req.db);
				
		adminModel.getAnnouncements(function(err, documents) {
			if (!err) {			
				callback(documents);		
			}
		});		
	},
	listKeys: function(req, callback) {
		
		var adminModel = new AdminModel(req.db);
				
		adminModel.getKeys(function(err, documents) {
			if (!err) {	
				callback(documents);		
			}
		});		
	},
		
});
