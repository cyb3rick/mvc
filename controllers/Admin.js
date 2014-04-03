//*****************************************************************************
//
// Admin.js   	Controller of the administration panel. It handles routes that 
//				only administrator users can access.
//
// Notes		It uses the 'authorize' middleware to check for valid session
//				before fulfilling any request.
//
// Author	 	Erick Caraballo
//
//*****************************************************************************

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
			announModel.findAllAnnouncements(function(err, documents) {
				if (!err) {			
					var v = new View(res, 'admin-announcements');
					v.render({
						title: 'Announcements',
						content: 'List of Announcements:',
						announcements: documents
					});
				}
				else { 
					console.log('Error: listAnnouncements -> ' + err);
				}
			});
		});
		
	},
	detailedAnnouncement: function(req, res, next) {
		
		// When I click one of the announcements
		// a new view opens which lets me modify
		// it or delete it.		
		this.authorize(req, res, function() {			
			announModel.findAnnouncementById(req.params.id, function(err, announ) {						
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
				else { 
					console.log('Error: detailedAnnouncement -> ' + err);
				}
			});
		});
		
	},
	updateAnnouncement: function(req, res, next) {
		
		console.log("update");
		
		this.authorize(req, res, function() {
			var announ = {
				'id': req.params.id,
				'title': req.body.title,
				'body': req.body.body,
				'startDate': moment(req.body.startDate).toDate(),					
				'endDate': moment(req.body.endDate).toDate()
			};												
			announModel.updateAnnouncement(announ, function(err) {				
				if (err) { 
					console.log('Error: updateAnnouncement -> ' + err);
				}	
				res.redirect('/admin/announcements');			
			});
		});

	},
	createAnnouncement: function(req, res, next) {
				
		this.authorize(req, res, function() {
			var announ = {				
				'title': req.body.title,
				'body': req.body.body,
				'startDate': moment(req.body.startDate).toDate(),					
				'endDate': moment(req.body.endDate).toDate()
			};												
			announModel.insertAnnouncement(announ, function(err) {				
				if (err) { 
					console.log('Error: createAnnouncement -> ' + err);
				}	
				res.redirect('/admin/announcements');			
			});
		});

	},
	deleteAnnouncement: function(req, res, next) {
		
		this.authorize(req, res, function() {												
			announModel.removeAnnouncementById(req.params.id, function(err) {
				if (err) { 
					console.log('Error: deleteAnnouncement -> ' + err); 
				}
				res.redirect('/admin/announcements');
			});
		});
		
	},
	listKeys: function(req, res, next) {
		
		this.authorize(req, res, function() {			
			keyModel.findAllKeys(function(err, documents) {
				if (!err) {					
					var v = new View(res, 'admin-keys');
					v.render({
						title: 'API Keys',
						content: 'List of API Keys:',
						keys: documents
					});
				} else {
					console.log('Error: listKeys -> ' + err);
				}
			});			
		});
		
	},
	enableKey: function(req, res, next) {
		
		this.authorize(req, res, function() {
			keyModel.enableKey(req.params.id, function(err) {				
				if (err) { 
					console.log('Error: enableKey -> ' + err); 
				}				
				res.redirect('/admin/keys');				
			});			
		});
		
	},
	//*************************************************************************
    // disableKey - Self-explanatory. This handler should be followed by a call
    //				to listKeys
    //*************************************************************************
	disableKey: function(req, res, next) {
		
		this.authorize(req, res, function() {
			keyModel.disableKey(req.params.id, function(err) {
				if (err) { 
					console.log('Error: disableKey -> ' + err); 
				}
				res.redirect('/admin/keys');
			});			
		});
		
	},
	//*************************************************************************
    // authorize - A middleware that verifies if the user is logged in. If the
    //			   user isn't logged in, it returns the login view. Otherwise,
    //			   the callback (next) is executed.
    //*************************************************************************
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
