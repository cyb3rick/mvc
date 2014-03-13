var config = {
	local: {
		mode: 'local',
		port: 8080,
		mongo: {
			host: '127.0.0.1',
			port: '27017',
			dbname: 'tt'			
		}
	},
	production: {
		mode: 'production',
		port: 3000,
		mongo: {
			host: '127.0.0.1',
			port: '33000',
			dbname: 'tt'			
		}
	}	
};

//Set mongo url
//It can be accessed through:
//var config = requrie('./path/to/here');
//config.mongo.url
for (var mode in config) {
	var mongoCnf = config[mode].mongo;
	mongoCnf.url = 'mongodb://' + 
						mongoCnf.host + ':' + 
	 						mongoCnf.port + '/' + 
	 							mongoCnf.dbname;
}

module.exports = function(mode) {
	return config[mode || process.argv[2] || 'local'] || config.local;
};
