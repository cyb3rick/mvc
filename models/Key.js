var Model = require('./Base');
var crypto = require('crypto');
var baseModel = new Model();

var ObjectID = require('mongodb').ObjectID;

//TODO: See if you can separate these functions
//into separate models (i.e. AdminModel, AnnouncementModel, etc).
var KeyModel = baseModel.extend({	
	create: function(key, callback) {		
		this.db.collection('keys').insert(key, {}, callback);
	},
	enable: function(id, callback) {		
		this.db.collection('keys').update(
			{ '_id': new ObjectID(id) },
			{ $set: { 'disabled': false } },
			callback
		);
	},
	disable: function(id, callback) {		
		this.db.collection('keys').update(
			{ '_id': new ObjectID(id) },
			{ $set: { 'disabled': true } },
			callback
		);
	},
	getKeys: function(callback) {
		this.db.collection('keys').find().toArray(callback);
	},
	getKeyById: function(id, callback) {
		this.db.collection('keys').find({'_id': new ObjectID(id)}).toArray(callback);
	},
	removeKeyById: function(id, callback) {		
		this.db.collection('keys').remove({'_id': new ObjectID(id)}, callback);
	},
	count: function(id) {
		var objID = new ObjectID(id);
		return this.db.collection('keys').find({'_id': objID}).count();
	}
});

module.exports = KeyModel;
