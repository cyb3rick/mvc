var express = require('express');
var app = express();
var http = require('http');
var config = require('./config')();

//App configuration
app.use(function(req,res,next){
	console.log("This is my first middleware...");
	next();
}).use(function(req,res,next){
	console.log("Second middleware...");
	next();
}).use(function(req,res,next){
	console.log("Third and last middleware...");
	res.end("Hello, World");
});

http.createServer(app).listen(config.port, function() {
	console.log("Listening on port " + config.port);
});
