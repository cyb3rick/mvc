var config = {
	local: {
		mode: 'local',
		port: 8080,
		mongo: {
			host: '127.0.0.1',
			port: '27017'
		}	
	},
	production: {
		mode: 'production',
		port: 8080
	}	
};

module.exports = function(mode) {
	return config[mode || process.argv[2] || 'local'] || config.local;
};
