var express = require('express');
var app = express();
var http = require('http');
var config = require('./config')();
var MongoClient = require('mongodb').MongoClient;

//Register ejs as .html
//Otherwise we'd need to name our templates
//foo.ejs instead of foo.html
app.engine('.html', require('ejs').__express);

//Where our views ('templates') are located
app.set('views', __dirname + '/templates');

//Without this, we'd need to provide the
//extension to res.render('foo.html', {data:'data'})
//With this we can call res.render('foo', {data:'data'})
app.set('view engine', 'html');

var mongoURL = config.mongo.url;

MongoClient.connect(mongoURL, function(err, db) {
	if (!err) {
		//Controllers
		var Admin = require('./controllers/Admin2');
		//var Announcement = require('./controllers/Announcement');

		//Express middleware
		app.use(express.bodyParser());
		app.use(express.cookieParser('superSecretString123'));
		app.use(express.session());			
		
		//Custom middleware		
		var attachDB = function(req, res, next) {
			req.db = db;
			next();
		};
		
		//Routes
		app.all('/admin', attachDB, function(req, res, next){ 
			Admin.run(req, res, next); 
		});
		app.all('/admin/announcements', attachDB, function(req, res, next){
			Admin.announcements(req, res, next);
		});	
		app.all('/admin/keys', attachDB, function(req, res, next){
			Admin.keys(req, res, next);
		});				
		
		//Start listening for HTTP requests
		http.createServer(app).listen(config.port, function() {
			console.log("Listening on port " + config.port);
		});		
	} else {
		console.log("Error: Connecting to database.");
	}
});

