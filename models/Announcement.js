var Model = require('./Base');
var crypto = require('crypto');
var baseModel = new Model();

//Allows creation of mongo ObjectId objects
var ObjectID = require('mongodb').ObjectID;

//TODO: See if you can separate these functions
//into separate models (i.e. AdminModel, AnnouncementModel, etc).
var AnnouncementModel = baseModel.extend({	
	insert: function(announ, callback) {		
		this.db.collection('announcements').insert(announ, {}, callback || function() {});
	},	
	update: function(announ, callback) {
		var objID = new ObjectID(announ.id);
		this.db.collection('announcements').update({'_id': objID}, announ, {}, callback || function() {});		
	},
	findAll: function(callback) {
		//Callback should be of the form: function(err, documents)
		//Remember, documents are the 'equivalent' of table recods
		//in MongoDB.
		this.db.collection('announcements').find().toArray(callback || function() {});
	},
	findById: function(id, callback) {		
		var objID = new ObjectID(id);
		this.db.collection('announcements').findOne({'_id': objID}, callback || function() {});
	},
	removeById: function(id, callback) {
		//Callback should be of the form: function(err, document)
		//In this case, documents refers to the deleted document.		
		var objID = new ObjectID(id);
		this.db.collection('announcements').remove({'_id': objID}, callback || function() {});
	}	
});

module.exports = AnnouncementModel;
