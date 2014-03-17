var BaseController = require('./Base');
var View = require('../views/Base');

var moment = require('moment');

//Models
//Remember, require('path/to/model') returns a constructor
var keyModel = new (require('../models/Key'));
var announModel = new (require('../models/Announcement'));

module.exports = BaseController.extend({
	name: 'Admin',
	username: 'root', //TODO: Get this from db.
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
	listAnnouncements: function(req, res, next) {
		this.authorize(req, res, function() {
			announModel.findAll(function(err, documents) {
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
	detailedAnnouncement: function(req, res, next) {
		// When I click one of the announcements
		// a new view opens which lets me modify
		// it or delete it.		
		this.authorize(req, res, function() {			
			announModel.findById(req.params.id, function(err, announ) {						
				if (!err) {																	
					var v = new View(res, 'admin-announcements-detail');					
					//Format dates for display
					announ.startDate = moment(announ.startDate).format("YYYY-MM-DD");
					announ.endDate = moment(announ.endDate).format("YYYY-MM-DD");					
					v.render({
						title: 'Update',
						content: 'Update Announcement:',
						announ: announ
					});							
				}
				else { console.log(err); }
			});
		});		
	},
	updateAnnouncement: function(req, res, next) {
		this.authorize(req, res, function() {
			var announ = {
				'id': req.params.id,
				'title': req.body.title,
				'body': req.body.body,
				'startDate': moment(req.body.startDate).toDate(),					
				'endDate': moment(req.body.endDate).toDate()
			};												
			announModel.update(announ, function(err) {
				if (!err) { console.log('Success: updating announcemet.'); }
				else { console.log('Error: updating announcement.'); }
			});
		});
	},
	deleteAnnouncement: function(req, res, next) {
		this.authorize(req, res, function() {												
			announModel.removeById(req.params.id, function(err) {
				if (!err) { console.log('Success: removing announcement.'); }
				else { console.log('Error: removing announcement.'); }
			});
		});
	},
	listKeys: function(req, res, next) {
		this.authorize(req, res, function() {			
			keyModel.getKeys(function(err, documents) {
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
	enableKey: function(req, res, next) {
		this.authorize(req, res, function() {
			keyModel.enable(req.params.id, function(err) {
				if (!err) { console.log('Success: enabling api key'); }
				else { console.log('Error: enabling api key'); }				
			});			
		});
	},
	disableKey: function(req, res, next) {
		this.authorize(req, res, function() {
			keyModel.disable(req.params.id, function(err) {
				if (!err) { console.log('Success: disabling api key'); }
				else { console.log('Error: disabling api key'); }				
			});			
		});
	},
	/**
	 * This is the Authorize middleware. It
	 * simply verifies if the user is logged
	 * in. If the user is NOT logged in, it
	 * responds with login view. Otherwise,
	 * the callback is executed. 
	 */
	authorize: function(req, res, next) {
		
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
			//Store new session	
			req.session.mvc = true;
			req.session.save();
			//Attach db to models			
			announModel.setDB(req.db);
			keyModel.setDB(req.db);
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
