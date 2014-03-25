//*****************************************************************************
//
// Key.js       Model to represent API keys stored in DB.
//
// Notes		Remember, API keys and API key requests are the same. Every
//				key contains information of its requester (owner). This is 
//				the structure of a key in DB:
//
//				{
//        			"fullname" : String,
//			        "email" : String,
//			        "message" : String,
//        			"disabled" : Boolean,
//        			"_id" : ObjectId
//				}
//				
// Author	 	Erick Caraballo
//
//*****************************************************************************

var Model = require('./Base');
var crypto = require('crypto');
var baseModel = new Model();

var ObjectID = require('mongodb').ObjectID;

var KeyModel = baseModel.extend({	
	createKey: function(key, callback) {		
		this.db.collection('keys').insert(key, {}, callback);
	},
	enableKey: function(id, callback) {		
		this.db.collection('keys').update(
			{ '_id': new ObjectID(id) },
			{ $set: { 'disabled': false } },
			callback
		);
	},
	disableKey: function(id, callback) {		
		this.db.collection('keys').update(
			{ '_id': new ObjectID(id) },
			{ $set: { 'disabled': true } },
			callback
		);
	},
	findAllKeys: function(callback) {		
		this.db.collection('keys').find().toArray(callback);			
	},
	findKeyById: function(id, callback) {		
		this.db.collection('keys').find({'_id': new ObjectID(id)}).toArray(callback);
	},
	removeKeyById: function(id, callback) {		
		this.db.collection('keys').remove({'_id': new ObjectID(id)}, callback);
	}
});

module.exports = KeyModel;
