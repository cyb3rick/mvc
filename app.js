var express = require('express');
var app = express();
var http = require('http');
var config = require('./config')();
var MongoClient = require('mongodb').MongoClient;

var mongoURL = 'mongodb://' + config.mongo.host + ':' + config.mongo.port + '/myDB';
MongoClient.connect(mongoURL, function(err, db) {
	if (!err) {		
		//Middleware to add the db to a request before route handler
		var attachDB = function(req,res,next) {
			req.db = db;
			next();
		};		
		//Start listening for HTTP requests
		http.createServer(app).listen(config.port, function() {
			console.log("Listening on port " + config.port);
		});		
	} else {
		console.log("Error: Connecting to database.");
	}
});

