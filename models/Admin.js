var Model = require('./Base');
var crypto = require('crypto');
var baseModel = new Model();

//TODO: See if you can separate these functions
//into separate models (i.e. AdminModel, AnnouncementModel, etc).
var AdminModel = baseModel.extend({	
	insertAnnouncement: function(announ, callback) {
		//TODO: Refer to mongo documentation of insert
		this.db.collection('announcements').insert(announ, {}, callback || function() {});
	},	
	getAnnouncements: function(callback) {
		//Callback should be of the form: function(err, documents)
		//Remember, documents are the 'equivalent' of table recods
		//in MongoDB.
		this.db.collection('announcements').find().toArray(callback || function() {});
	},
	getAnnouncementById: function(id, callback) {
		//Callback should be of the form: function(err, documents)
		this.db.collection('announcements').find({'_id': id}).toArray(callback || function() {});
	},
	removeAnnouncementById: function(id, callback) {
		//Callback should be of the form: function(err, document)
		//In this case, documents refers to the deleted document.
		this.db.collection('announcements').remove({'_id': id}, callback || function() {});
	},
	getKeys: function(callback) {
		this.db.collection('keys').find().toArray(callback || function() {});
	},
	getKeyById: function(id, callback) {
		this.db.collection('keys').find({'_id': id}).toArray(callback || function() {});
	},
	removeKeyById: function(id, callback) {		
		this.db.collection('keys').remove({'_id': id}, callback || function() {});
	}
});

module.exports = AdminModel;
