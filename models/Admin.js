var Model = require('./Base');
var crypto = require('crypto');
var baseModel = new Model();

//Allows creation of mongo ObjectId objects
var ObjectID = require('mongodb').ObjectID;

//TODO: See if you can separate these functions
//into separate models (i.e. AdminModel, AnnouncementModel, etc).
var AdminModel = baseModel.extend({	
	insertAdmin: function(admin, callback) {		
		this.db.collection('admins').insert(admin, {}, callback || function() {});
	},	
	updateAdmin: function(admin, callback) {
		var objID = new ObjectID(admin.id);
		this.db.collection('admins').update({'_id': objID}, admin, {}, callback || function() {});		
	},
	findAdminByName: function(name, callback) {		
		this.db.collection('admins').findOne({'name': name}, callback || function() {});
	},
	changePasswordByName: function(name, password, callback) {		
		this.db.collection('admins').update(
			{ 'name': name },
			{ $set: { 'password': password } },
			callback
		);
	}
});

module.exports = AnnouncementModel;
