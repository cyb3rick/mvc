var BaseController = require('./Base');
var View = require('../views/Base');

// For sending emails
var nodemailer = require('nodemailer');
// Nodemailer configuration
var smtpTransport = nodemailer.createTransport("SMTP", {
	service: "Gmail",
    auth: {
		user: "info.trolleytracker@gmail.com",
        pass: "dn43Lknn*g"
    }
});				
// Email parameters				
var mailOptions = {	
	from: "Trolley Tracker <info.trolleytracker@gmail.com>"
};

// Helps me parse, validate and
// _format_ dates.
var moment = require('moment');

//Models
var keyModel = new (require('../models/Key'));

module.exports = BaseController.extend({
	name: 'Request API Key',
	run: function(req, res, next) {
		
		// Second parameter references
		// an html template file in the
		// templates diretory 
		// (/templates/requests.html)		
		var v = new View(res, 'requests'); 
		v.render({
			title: 'Request API Key',
			content: 'Request an API Key',
			info: 'You need to request an API key in order ' +
				  'to make REST API calls. If your request ' + 
				  'is approved, a notification will be sent' +
				  'to the specified email address.'
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
		keyModel.createKey(keyRequest, function(err) {
			
			if (!err) {								
				// Complete parameters of the email				
				mailOptions['to'] = keyRequest.email;
				mailOptions['subject'] = 'API Key - Waiting for Approval';
    			mailOptions['text'] = 'Thank you. Your API key request is ' +
    							'waiting approval from our Administrators.' + 
    							' You will be notified when a decision is ' +
    							'finally made.';												
				// Send email
				smtpTransport.sendMail(mailOptions, function(err, res) {					
        			if (err) {
	            		console.log("Error sending message.");
    	    		}
        		});	
			}
			else { 
				//TODO: Create another view to display 
				// 		feedback message and back button
				console.log('Error: creating key request.'); 
			}
			res.redirect('/request');							
		});
		
	}
});
