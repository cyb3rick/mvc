//*****************************************************************************
//
// Home.js   	Controller of the Home page. It handles routes that normal 
//				users can access.
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

// Models
// Remember require('/path/to/model') returns constructor
var announModel = new (require('../models/Announcement'));

module.exports = BaseController.extend({
	name: 'Home',	
	run: function(req, res, next) {
							
		var v = new View(res, 'home');
		announModel.findAllAnnouncements(function(err, documents) {
			if (!err) {
				v.render({
					title: 'Home',
					content: 'Welcome to the Administration Panel',
					announcements: documents
				});		
			}
			else {
				console.log('Error: listAnnouncements -> ' + err);
			}
		}
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
	//*************************************************************************
    // enableKey - Self-explanatory. This handler should be followed by a call
    //			   to listKeys or URL redirection to somewhere else.
    //*************************************************************************
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
    //				to listKeys or URL redirection to somewhere else.
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
    // logout - Destroys current session if it exists.
    //*************************************************************************
	logout: function(req, res, next) {
		
		this.authorize(req, res, function() {
			req.session.destroy();
			res.redirect('/admin');
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
