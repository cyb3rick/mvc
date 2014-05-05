// TODO: Look into recluster, a nodejs module
// to create a cluster of processes running nodejs
// so that it has zero downtime.

var express = require('express');
var app = express();
var http = require('http');
var config = require('./config')();
var MongoClient = require('mongodb').MongoClient;

var io = require('socket.io');

var dgram = require('dgram');
var server = dgram.createSocket('udp4');
var events = require('events');
var eventEmitter = new events.EventEmitter();

//Register ejs as .html
//Otherwise we'd need to name our templates
//foo.ejs instead of foo.html
app.engine('.html', require('ejs').__express);

//Where our views ('templates') are located
app.set('views', __dirname + '/templates');

//Static assets
app.use(express.static(__dirname + '/public'));

// Set favicon
app.use(express.favicon(__dirname + '/public/imgs/favicon.ico'));

//Without this, we'd need to provide the
//extension to res.render('foo.html', {data:'data'})
//With this we can call res.render('foo', {data:'data'})
app.set('view engine', 'html');

var mongoURL = config.mongo.url;

MongoClient.connect(mongoURL, function(err, db) {

	if (!err) {
		// Connected successfully to DB.

		// TODO: Add event listeners here

		// Controllers
		var AdminCtrl = require('./controllers/Admin');
		var RequestsCtrl = require('./controllers/Requests');
		var RestApiCtrl = require('./controllers/RestApi');

		// Express middleware
		app.use(express.bodyParser());
		app.use(express.cookieParser('superSecretString123'));
		app.use(express.session());

		// Custom middleware
		// Attaches the DB to the request object
		// so that controllers and models can access it
		var attachDB = function(req, res, next) {
			req.db = db;
			next();
		};

		//Routes
		//General User Routes
		app.get('/', function(req, res, next) {
			res.render('home', {
				title : "Trolley Tracker"
			});
		});

		//Display admin welcome panel
		app.all('/admin', attachDB, function(req, res, next) {
			AdminCtrl.run(req, res, next);
		});
		app.all('/admin/logout', function(req, res, next) {
			AdminCtrl.logout(req, res, next);
		});

		//Admin announcements
		app.all('/admin/announcements', attachDB, function(req, res, next) {
			AdminCtrl.listAnnouncements(req, res, next);
		});
		app.all('/admin/announcements/create', attachDB, function(req, res, next) {
			AdminCtrl.createAnnouncement(req, res, next);
		});
		app.all('/admin/announcements/:id', attachDB, function(req, res, next) {
			//Detailed view of announcement
			//Provides view with options to update or delete announcements
			AdminCtrl.detailedAnnouncement(req, res, next);
		});
		app.all('/admin/announcements/update/:id', attachDB, function(req, res, next) {
			AdminCtrl.updateAnnouncement(req, res, next);
		});
		app.all('/admin/announcements/delete/:id', attachDB, function(req, res, next) {
			AdminCtrl.deleteAnnouncement(req, res, next);
		});
		//Admin API keys
		app.all('/admin/keys', attachDB, function(req, res, next) {
			AdminCtrl.listKeys(req, res, next);
		});
		app.all('/admin/keys/enable/:id', attachDB, function(req, res, next) {
			AdminCtrl.enableKey(req, res, next);
		});
		app.all('/admin/keys/disable/:id', attachDB, function(req, res, next) {
			AdminCtrl.disableKey(req, res, next);
		});
		//Request API keys
		app.get('/request', attachDB, function(req, res, next) {
			RequestsCtrl.run(req, res, next);
		});
		app.post('/request/create', attachDB, function(req, res, next) {
			RequestsCtrl.createKeyRequest(req, res, next);
		});
		//REST API
		app.get('/updates', attachDB, function(req, res, next) {
			RestApiCtrl.run(req, res, next);
		});

		//Start listening for HTTP requests
		//http.createServer(app).listen(config.port, function() {
		//	console.log("Listening on port " + config.port);
		//});

		server.on("message", function(msg, rinfo) {
			eventEmitter.emit('update', msg);
		});

		server.on("listening", function() {
			var addr = server.address();
			console.log("Sever listening on UDP port " + addr.port);
		});
	
		// Bind server to UDP port 8000		
		server.bind(8000);

		//When someone connects through socket.io
		io.listen(app.listen(config.port)).on('connection', function(socket) {

			//Debug
			console.log("New client connected.");
			
			// Subscribe to update events
			eventEmitter.on('update', function(data) {
				var dataStr = data.toString();
				var updateStr = JSON.stringify({
					ID : dataStr.substring(0,2),
					lat : dataStr.substring(2,11),
					lng	: dataStr.substring(11,21)
				});
				
				// TODO: Store in database
				
				// Broadcast to connected clients
				socket.broadcast.emit('mapUpdate', updateStr);
			});
			
		});

	} else {
		console.log("Error: Connecting to database.");
	}
});

