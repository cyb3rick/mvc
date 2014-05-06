function initialize() {
	var UPRM = new google.maps.LatLng(18.209438, -67.140543);
	
	var mapOptions = {
		zoom : 17,
		minZoom : 16,
		maxZoom : 18,
		center : UPRM,
		mapTypeId : google.maps.MapTypeId.ROADMAP,
		disableDefaultUI : true
	};
	
	map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);

	initStopMarkers();
	initRoutes();
	//initSimulatorStuff();
}

google.maps.event.addDomListener(window, "load", initialize);

function getDirection2(rindex,upd_array){
	var index0 = closestPointOnPath(route_array[rindex].value.getPath(),upd_array[0]).index;
	var index1 = closestPointOnPath(route_array[rindex].value.getPath(),upd_array[1]).index;
	
	if(route_array[rindex].type == "linear"){
		if(index0 > index1){
			return 1;
		}
		
		else if(index0 < index1){
			return -1;
		}
		else return 0;
	} else if(route_array[rindex].type == "circular"){
		var diff0 = (((index0 - index1) % rlength) + rlength) % rlength;
		var diff1 = (((index1 - index0) % rlength) + rlength) % rlength;
		
		if(diff0 < diff1){
			return -1;
		}
		else if(diff0 > diff1){
			return 1;
		}
		else return 0;
	}
	else return 0;
}

function getRoute2(upd_array){
	var min;
	var min_rindex;
	var curr_dist;
	var scores = [];
	var freqs = [0,0,0,0,0];
	var count;


	for(var i=0; i < upd_array.length; i++){
		min = 0;
		min_rindex = -1;
		for(var j=0; j < route_array.length; j++){
			curr_dist = closestPointOnPath(route_array[j].value.getPath(),upd_array[i]).dist;
			if(curr_dist < min || j==0 ){
				min = curr_dist;
				min_rindex = j;
				console.log("Min distance: "+min);
				console.log("Route index: "+min_rindex);
			}
		}
		scores[i] = min_rindex;
	}
	
	console.log(scores);

	for(var i=0; i < scores.length; i++){
		freqs[scores[i]]++;
	}
	
	var freqIdx = Math.max.apply(null, freqs);
	var res = freqs.indexOf(freqIdx);

	return res;
}


/**
 * A function used to create a representation of a trolley.
 * 
 * id - trolley identifier (string)
 * lat - the trolley's geographical latitude
 * lng - the trolley's geographical longitude
 * time - time at which the last update was received
 * velocity - the trolley's instant velocity
 * velocities - an array with the past x velocities
 * route - the index of the route with highest hit percentage
 * dir - the direction of the trolley within the route
 * stopArray - and array containing the past stops traveres by the trolley
 */
function Trolley(id,lat,lng,date){
	this.id = id;

	var latt = new String(parseFloat(lat));
	var lngg = new String(parseFloat(lng));
	latt = parseFloat(latt.substring(0,2))+(parseFloat(latt.substring(2,7))/60)+parseFloat(("."+parseFloat(latt.substring(7))/3600));
	lngg = -1*(parseFloat(lngg.substring(0,2))+(parseFloat(lngg.substring(2,7))/60)+parseFloat(("."+parseFloat(lngg.substring(7))/3600)));
	this.latlng = new google.maps.LatLng(latt,lngg);
			
	// debug
	map.setCenter(this.latlng);
	console.log(this.latlng.lat() + " " + this.latlng.lng());
	
	this.latlng = new google.maps.LatLng(lat,lng);
	this.date = date;
	//this.stopsTraversed = [];
	this.pointsTraversed = [];
	this.route = -1;
	this.dir = 0;
	this.velocities = [];
	this.avgVelocity;
	this.marker = new google.maps.Marker({position: this.latlng, visible: true, map: map});
};

/**
 * Processes updates. Checks trolley array for existing trolley. If it is found, trolley information is updated.
 * If it was not found, a new trolley is created with the info provided in the update, and it is added to the array.
 * 
 * upd - a JSON object containing information obtained from the tracking unit inside the trolleys.
 */
function processUpdate(upd) {
	var tindex = -1;		
	for(var trolley in trolley_array) {
	    if(trolley_array[trolley].id == upd.id){
	    	tindex = trolley;
	    } 
	}
		
	if (tindex >= 0) {
		var t = trolley_array[tindex];
		var latt = new String(parseFloat(upd.lat));
		var lngg = new String(parseFloat(upd.lng));
		latt = parseFloat(latt.substring(0,2))+(parseFloat(latt.substring(2,7))/60)+parseFloat(("."+parseFloat(latt.substring(7))/3600));
		lngg = -1*(parseFloat(lngg.substring(0,2))+(parseFloat(lngg.substring(2,7))/60)+parseFloat(("."+parseFloat(lngg.substring(7))/3600)));
		t.latlng = new google.maps.LatLng(latt,lngg);			

		t.date = upd.date;
		
		map.setCenter(t.latlng);  
		
		//var closestStop = getClosestStop(t.latlng); 				
		/*if ((closestStop.dist < 30) && (closestStop.index != t.stopsTraversed[0])) {
			t.stopsTraversed.unshift(closestStop.index);	
			while (t.stopsTraversed.length > 10){
				t.stopsTraversed.pop();
			}
		}*/
		
		t.pointsTraversed.unshift(t.latlng);
		
		while (t.pointsTraversed.length > 10){
			t.pointsTraversed.pop();
		}
		
		t.velocities.unshift(upd.speed*0.44704);	
		
		while(t.velocities.length > 12){
			t.velocities.pop();
		}
		
		t.route = getRoute2(t.pointsTraversed);
		console.log("Route index: "+t.route);
		console.log("Route key: "+route_array[t.route].key);
		console.log("Route (best match) " + route_array[t.route].title);	
		t.dir = getDirection2(t.route,t.pointsTraversed);
		console.log(t.dir);
		
		ShowRoute(route_array[t.route].key);
		
		var sum = t.velocities.reduce(function(a, b) { return a + b; });
		var avg = sum / t.velocities.length;
		t.avgVelocity = avg;
		
		t.marker.setPosition(t.latlng);
		//t.marker.setVisible(google.maps.geometry.poly.containsLocation(t.latlng,Campus) && !(t.avgVelocity < 1));
		
		if(eta_requested){
		    showEta();
		}
		console.log("Current direction: "+t.dir);
		console.log("--------------------------------------------");
	}
	else {
		var t = new Trolley(upd.id,upd.lat,upd.lng,upd.time);
		t.velocities.unshift(upd.speed*0.44704);
		t.avgVelocity = upd.speed*0.44704;
		
		//var closestStop = getClosestStop(t.latlng);		
		//if(closestStop.dist < 30){
			t.pointsTraversed.unshift(t.latlng);
		//}
		
		t.marker = new google.maps.Marker({
			position: t.latlng,
            map: map,
            title: t.id
		});
		
		var isContainedInCampus = google.maps.geometry.poly.containsLocation(t.latlng,Campus);
		var avgVelNearZero = t.avgVelocity < 1;		
		
		// debug
		console.log("Is Contained: " + isContainedInCampus);	
		console.log("Has avg vel below 1 " + avgVelNearZero);
		console.log("--------------------------------------------");
					
		//t.marker.setVisible(isContainedInCampus && avgVelNearZero);
		trolley_array.push(t);
	}
	
	
}

function getEta(stop_index,route_index,tlatlng,tdir,avgVelocity){
	var distance = getDistanceAcrossPath(stop_array[stop_index].value.getPosition(),tlatlng,route_array[route_index].value.getPath(),route_array[route_index].type,tdir).len;
	console.log("Distance from trolley to stop: "+distance);
	return distance/avgVelocity;
}

/**
 *	Description:
 * 	Calculates the distance (in meters) from a particular trolley to the specified stop along a route.
 * 	
 * 	Params:
 *	slatlng - coordinates of trolley stop
 * 	tlatlng - coordinates of trolley
 * 	rpath - route path
 * 	tdir - direction of trolley within route; 1 for CCW, 0 for CW
 * 
 * 	Returns:
 * 	The length of the segment of the route between trolley and stop locations.
 */
function getDistanceAcrossPath(slatlng,tlatlng,rpath,rtype,tdir){
	var stop = closestPointOnPath(rpath,slatlng);
	var trolley = closestPointOnPath(rpath,tlatlng);
	var length = 0;
	var found = false;
	
	if(trolley.dist > 40){
		console.log("The trolley is too far away from the path, cannot continue.");
		return;
	}

	var coords = [];
	
	if(rtype == "linear"){
		if(tdir == 1){
			for(var i=trolley.index; i < rpath.length; i++){
				coords.push(rpath.getAt(i));
				if(i == stop.index){
					found = true;
					break;
				}
			}
			
			if(!found){
				length = google.maps.geometry.spherical.computeLength(coords)*2;
				coords.length = 0;
				
				for(var i=trolley.index; i >= 0; i--){
					coords.push(rpath.getAt(i));
					if(i == stop.index){
						found = true;
						break;
					}
				}
			}
		}
		else if(tdir == -1){
			for(var i=trolley.index; i >= 0; i--){
				coords.push(rpath.getAt(i));
				if(i == stop.index){
					found = true;
					break;
				}
			}
			
			if(!found){
				length = google.maps.geometry.spherical.computeLength(coords)*2;
				coords.length = 0;
			
				for(var i=trolley.index; i < rpath.length; i++){
					coords.push(rpath.getAt(i));
					if(i == stop.index){
						found = true;
						break;
					}
				}	
			}		
		}
	}
	
	else if(rtype == "circular"){
		var j=0;
		
		if(tdir == 1){
			for(var i=trolley.index; j < rpath.length; i = (i+1)%rpath.length,j++){
				coords.push(rpath.getAt(i));
				if(i == stop.index){
					found = true;
					break;
				}
			}
		}
		else if(tdir == -1){
			for(var i=trolley.index; j < rpath.length; i = (((i-1)%rpath.length)+rpath.length)%rpath.length,j++){
				coords.push(rpath.getAt(i));
				if(i == stop.index){
					found = true;
					break;
				}
			}
		}
	}
	
	else if("weird"){
		return {"len":-1};
	}

	length += google.maps.geometry.spherical.computeLength(coords);
	
	return {"len":length};
}

/**
 *  Description:
 * 	Identifies the stop that is closest to a given point.
 * 	
 * 	Params:
 *	latlng - the coordinates of interest
 * 	
 * 	Returns:
 *  A JSON object containing the closest stop, how far away it is from the input coordinates (in meters) and the index 
 * 	 of the position in the array of stops.
 */
function getClosestStop(latlng){
	var closest;
	var this_dist;
	var this_stop;
	
	for(var i=0; i<stop_array.length; i++){
		this_stop = stop_array[i];
		this_dist = google.maps.geometry.spherical.computeDistanceBetween(latlng,this_stop.value.getPosition());
		
		if(i==0){
			closest = {"stop": this_stop, "dist": this_dist, "index" : i};
		}
		else if(this_dist < closest.dist){
			closest = {"stop": this_stop, "dist": this_dist, "index" : i};
		}
	}
	return closest;
}

/**
 *	Description:
 * 	Identifies the coordinates on a route that are closest to a trolley.
 * 	
 * 	Params:
 * 	path - the path of the route
 * 	latlng - coordinates of trolley
 * 	latlng2 (optional) - coordinates of the trolley on the previous (second to last) update
 * 
 * 	Returns:
 * 	An object containing the coordinates of the point on the route closest to the trolley (coords) and the index of the 
 * 	  coordinates on the path array (theindex).
 *	If two latlngs are passed as parameters, in addition to respective indexes, distances and coordinates, the function 
 * 	calculates the direction the trolley is moving with respect to the path.
 */
function closestPointOnPath(path,latlng){
	var coord = path.getAt(0);
	var theindex;
	var this_dist;
	var min_dist;

	for(var index = 0; index < path.length; index++){
		this_dist = google.maps.geometry.spherical.computeDistanceBetween(latlng,path.getAt(index));
		if(this_dist < min_dist || index == 0){
			coord = path.getAt(index);
			min_dist = this_dist;
			theindex = index;
		}
	}

	return {"coord":coord,"dist":min_dist,"index":theindex};
}

/**
 *	Description:
 * 	Adjusts map position and zoom level so that the path specified can fit on the screen.
 * 	
 * 	Params:
 * 	path - the route path	
 */
function centerOnPath(path) {
	var maxLat = path.getAt(0).lat();
	var minLat = path.getAt(0).lat();
	var maxLng = path.getAt(0).lng();
	var minLng = path.getAt(0).lng();
	
	for(index = 1; index < path.getLength(); index++){
		var curr_pnt = path.getAt(index);
		if(curr_pnt.lat() > maxLat){
			maxLat = curr_pnt.lat();
		}
		
		if(curr_pnt.lat() < minLat){
			minLat = curr_pnt.lat();
		}
		
		if(curr_pnt.lng() > maxLng){
			maxLng = curr_pnt.lng();
		}
		
		if(curr_pnt.lng() < minLng){
			minLng = curr_pnt.lng();
		}
	}
	var SW = new google.maps.LatLng(minLat,minLng);
	var NE = new google.maps.LatLng(maxLat,maxLng);

	var bounds = new google.maps.LatLngBounds(SW, NE);
	map.fitBounds(bounds);
}

/**
 *	Description:
 * 	Turns off the visibility of all routes on the map and enables the route specified.
 * 	
 * 	Params:
 *	the_route - a string representing the selected html element, containing the name of the route to be shown
 */
function ShowRoute(the_route){
	var title;
	$.each(route_array, function(route) {
		route_array[route].value.setVisible(false);
		if(route_array[route].key === the_route){
			title = route_array[route].title;
			the_route = route_array[route].value;
		}
	});

	the_route.setVisible(true);
	
	/*
	for(var i=0; i < trolley_array.length; i++){
		trolley_array[i].marker.setVisible(false);
	}
	
	for(var i=0; i < trolley_array.length; i++){
		if(route_array[i].value.getVisible()){
			trolley_array[i].marker.setVisible(true);
		}
	}
	*/
	
	centerOnPath(the_route.getPath(),map);
	return {"poly":the_route,"title":title};
}

function ShowStop(the_stop){
	$.each(stop_array, function(stop) {
		stop_array[stop].value.setAnimation(null);
		if(stop_array[stop].key === the_stop){
			the_stop = stop_array[stop].value;
		}
	});
	the_stop.setAnimation(google.maps.Animation.BOUNCE);
	setTimeout(function () {
	    the_stop.setAnimation(null);
	}, 2300);
	map.setCenter(the_stop.getPosition());
	return the_stop;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Init Functions ---------------------------------------------------------------------------------------------------//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 *	Description:
 * 	Attempts to identify the user's location based on network (so wifi works waaay better for this purpose).
 * 	Shows alert with the name of the supposedly closest stop and places a marker on the map	at the location.
 */
function initGeolocation(){
	if(mylocation != null && mylocation != undefined){
		mylocation.setMap(null);
	}
	
	var geocoords;
	var browserSupportFlag =  new Boolean();

	if(navigator.geolocation) {
		browserSupportFlag = true;
		navigator.geolocation.getCurrentPosition(function(position) {
		geocoords = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
		map.setCenter(geocoords);
		var closest_stop;
		var min_dist;
		var curr_dist;
		$.each(stop_array, function(stop) {
			curr_dist = google.maps.geometry.spherical.computeDistanceBetween(stop_array[stop].value.getPosition(),geocoords);
			if(stop == 0){
				closest_stop = stop_array[stop];
				min_dist = curr_dist;
			}
			else {
				if(curr_dist < min_dist){
					min_dist = curr_dist;
					closest_stop = stop_array[stop];
				}
			}
		});
		mylocation.setPosition(geocoords);
		var maxwidth = $(window).width()*0.85;
		var maxheight = $(window).height()*0.85;
		//({"dist" : Math.round(min_dist), "stop" : closest_stop.value.getTitle()});
		//$("#location-info").empty();
		//$("#location-info").append("<p>Your location seems to be "+Math.round(min_dist)+" away from the "+closest_stop.value.getTitle()+" stop. Remember to connect to a wifi network for the most accurate geolocation.</p>");
		//$( "#location-popup" ).css({'max-width':maxwidth ,'max-height':maxheight});
		//$("#location-popup").popup("open");
		alert("Your location seems to be "+Math.round(min_dist)+" away from the "+closest_stop.value.getTitle()+" stop. Remember to connect to a wifi network for the most accurate geolocation.");
		mylocation.setMap(map);
		}, function() {
	      handleNoGeolocation(browserSupportFlag);
	    });
	}
	else {
	    browserSupportFlag = false;
	    handleNoGeolocation(browserSupportFlag);
	}
	
	function handleNoGeolocation(errorFlag) {
		if (errorFlag == true) {
			alert("Geolocation service failed.");
		} else {
			alert("Your browser doesn't support geolocation. Sad :(");
		}
	}
}

/**
 *	Description:
 * 	Populates route array with route objects. Each object contains key, title, stops and value:
 * 		key - a short unique string that identifies the route
 * 		title - a string containing the official name of the route
 * 		stops - an array containing the keys of the stops the route passes through
 * 		value - the Polyline object, containing all the coordinates of the route path
 */
function initRoutes(){
	//stop order is counter-clockwise in all routes for consistency
	route_array = [
		{	key: "route1", title: "Palacio", 
			type: "linear",
			stops: ["pala","barc","port","stef","fisi","pati","bibl"],
			seq: { name : [0,1,2,3,4,5,6,7,8],
					unique_to_route: [0,1,2,3,4],
					unreliable: []
				},
			value:	new google.maps.Polyline({
				visible : true,
				path : Palacio,
				strokeColor : '#FF0000',
				strokeOpacity : 0.6,
				strokeWeight : 10,
				map : map
			})
		},					
	
		{	key: "route2", title: "Zoologico",
			type: "linear",
			stops: ["zool","biol","fisi","pati","bibl","agri","civi"],
			seq: { name : [9,29,10,6,7,8,11,12,13],
					unique_to_route: [9,10,11,12,13],
					unreliable: []
				},
			value: new google.maps.Polyline({
				visible : false,
				path : Zoologico,
				strokeColor : '#00FFFF',
				strokeOpacity : 0.6,
				strokeWeight : 10,
				map : map
			})
		},
		
		{	key: "route3", title: "Interno",
			type: "circular",
			stops: ["bibl","pati","fisi","stef","cent","pine","town","gimn"],
			seq: {  name : [8,7,6,5,14,15,26,16,17,16,26,18],
					unique_to_route: [16,17],
					unreliable : [16,17,26]
				},
			value:	new google.maps.Polyline({
				visible : false,
				path : Interno,
				strokeColor : '#FFFF00',
				strokeOpacity : 0.6,
				strokeWeight : 10,
				map : map
			})
		},
		
		{	key: "route4", title: "Terrace",
			type: "linear",
			stops: ["terr","finc","cita","edif","admi","bibl","pati","fisi"],
			seq: {  name : [19,20,21,22,23,8,7,6],
					unique_to_route: [19,20,21,22,23],
					unreliable: []
				},
			value:	new google.maps.Polyline({
				visible : false,
				path : Terrace,
				strokeColor : '#FF00FF',
				strokeOpacity : 0.6,
				strokeWeight : 10,
				map : map
			})
		},
							
		{	key: "route5", title: "Darlington",
			type: "weird",
			stops: ["voca","darl","entr","gimn","bibl","pati","fisi"],
			seq: { name : [25,27,26,18,8,7,6,7],
					unique_to_route: [24,25],
					unreliable: [25,27]
				},
			value:	new google.maps.Polyline({
				visible : false,
				path : Darlington,
				strokeColor : '#00FF00',
				strokeOpacity : 0.6,
				strokeWeight : 10,
				map : map
			})
		}
	];
}

function getRoute(stopArray){
	var scores = [];
	var this_score;
	
	for(var i=0; i < route_array.length; i++){
		this_score = 0;
		for(var j=0; j < stopArray.length; j++){
			if((route_array[i].seq.name).indexOf(stopArray[j]) > -1){
			    this_score++;
			}
		}
		scores.push(this_score/stopArray.length);
	}
	
	var max = Math.max.apply(Math,scores);
	var index = scores.indexOf(max);
	
	return {"index" : index, "percent": scores[index]*100};
}

/**
 * Identifies the direction of a trolley within a route, be it clockwise (-1), counter-clockwise (1) or cannot be determined (0).
 *  
 */
function getDirection(stopArray,routeIndex){
	if(stopArray.length < 2){
		return 0;
	}
	
	routeIndex = routeIndex.index;
	
	var len = route_array[routeIndex].seq.name.length;
	
	for(var i=0; i < len; i++){
		if(route_array[routeIndex].seq.name[i] == stopArray[0]){
			
			for(var j=1; j < len-5; j++){
				var reliable0 = (route_array[routeIndex].seq.unreliable.indexOf(stopArray[j-1]) > -1 ? false : true);
				var reliable1 = (route_array[routeIndex].seq.unreliable.indexOf(stopArray[j]) > -1 ? false : true);
				if((reliable0 || reliable1)){
					if(route_array[routeIndex].seq.name[(((i-j)%len)+len)%len] == stopArray[j]){
						return 1;
					}
					else if(route_array[routeIndex].seq.name[(((i+j)%len)+len)%len] == stopArray[j]){
						return -1;
					}
				}
			}
		}
	}
	return 0;
}

/**
 *	Description:
 * 	Populates stop array with marker objects representing trolley stops and places them on the map. Each object 
 * 	  contains key and value:
 * 			key - a short unique, 4-character string that identifies the route
 * 			value - the Marker object; has a position (latlng object), a title which is a string containing the complete 
 * 		  	  name of the stop, and a path to an image used as icon))
 */
function initStopMarkers(){
	var busstop = '../css/images/icons-simple/busstop.png';
				
	stop_array = [
		{	key : "pala", value: new google.maps.Marker({
				position : new google.maps.LatLng(18.205942,-67.136433),
				title : "Palacio",
				icon: busstop
			})
		},
		
		{	key : "pre-pala", value: new google.maps.Marker({
				position : new google.maps.LatLng(18.206758, -67.137340),
				title : "Palacio",
				icon: busstop,
				visible: false
			})
		},
		
		{	key: "barc", value: new google.maps.Marker({
				position : new google.maps.LatLng(18.207543,-67.139935),
				title : "Barcelona",
				icon: busstop
			})
		},
		
		{	key: "deca", value: new google.maps.Marker({
				position : new google.maps.LatLng(18.208648,-67.141432),
				title : "Decanato de Estudiantes",
				icon: busstop,
				visible: false
			})
		},
		
		{	key: "port", value: new google.maps.Marker({
				position : new google.maps.LatLng(18.208957,-67.140322),
				title : "Portico",
				icon: busstop
			})
		},
		
		{	key: "stef", value: new google.maps.Marker({
				position : new google.maps.LatLng(18.20968,-67.139021),
				title : "Stefani",
				icon: busstop
			})
		},
		
		{	key: "fisi", value: new google.maps.Marker({
				position : new google.maps.LatLng(18.210868,-67.139643),
				title : "Fisica",
				icon: busstop
			})
		},
		
		{ 	key: "pati", value: new google.maps.Marker({
				position : new google.maps.LatLng(18.211283,-67.140823),
				title : "Patio Central",
				icon: busstop	
			})
		},
	
		{	key: "bibl", value: new google.maps.Marker({
				position : new google.maps.LatLng(18.211787,-67.14196),
				title : "Esquina Biblioteca",
				icon: busstop
			})
		},
		
		{	key: "zool", value: new google.maps.Marker({
				position : new google.maps.LatLng(18.216050, -67.133764),
				title : "Zoologico",
				icon: busstop
			})
		},
		
		{	key: "biol", value: new google.maps.Marker({
				position : new google.maps.LatLng(18.211762,-67.138246),
				title : "Biologia",
				icon: busstop
			})
		},
		
		{	key: "agri", value: new google.maps.Marker({
				position : new google.maps.LatLng(18.214003, -67.141454),
				title : "Ingenieria Agricola",
				icon: busstop
			})
		},
		
		{	key: "pre-civi", value: new google.maps.Marker({
				position : new google.maps.LatLng(18.215187, -67.139994),
				title : "Pre-Ingenieria Civil",
				icon: busstop,
				visible: false
			})
		},
		
		{	key: "civi", value: new google.maps.Marker({
				position : new google.maps.LatLng(18.21458,-67.139772),
				title : "Ingenieria Civil",
				icon: busstop
			})
		},
		
		{	key: "cent", value: new google.maps.Marker({
				position : new google.maps.LatLng(18.209935,-67.141472),
				title : "Centro de Estudiantes",
				icon: busstop
			})
		},
		
		{	key: "pine", value: new google.maps.Marker({
				position : new google.maps.LatLng(18.210638,-67.143591),
				title : "Pinero",
				icon: busstop
			})
		},
		
		{	key: "pre-town", value: new google.maps.Marker({
				position : new google.maps.LatLng(18.210159, -67.144323),
				title : "Pre-Town Center",
				icon: busstop,
				visible: false
			})
		},
		
		{	key: "town", value: new google.maps.Marker({
				position : new google.maps.LatLng(18.209881, -67.144582),
				title : "Town Center",
				icon: busstop
			})
		},
		
		{	key: "gimn", value: new google.maps.Marker({
				position : new google.maps.LatLng(18.212119,-67.143776),
				title : "Gimnasio Espada",
				icon: busstop
			})
		},
		
		{	key: "terr", value: new google.maps.Marker({
				position : new google.maps.LatLng(18.215375,-67.14802),
				title : "Parque Terrace",
				icon: busstop
			})
		},
		
		{	key: "finc", value: new google.maps.Marker({
				position : new google.maps.LatLng(18.215461,-67.146341),
				title : "Finca Alzamora",
				icon: busstop
			})
		},
		
		{	key: "cita", value: new google.maps.Marker({
				position : new google.maps.LatLng(18.217300, -67.145641),
				title: "CITAI",
				icon: busstop
			})
		},
		
		{	key: "edif", value: new google.maps.Marker({
				position : new google.maps.LatLng(18.218239, -67.144141),
				title : "Edificio A",
				icon: busstop
			})
		},

		{	key: "admi", value: new google.maps.Marker({
				position : new google.maps.LatLng(18.216771,-67.143049),
				title : "Empresas",
				icon: busstop
			})
		},
		
		{	key: "voca", value: new google.maps.Marker({
				position : new google.maps.LatLng(18.209516, -67.146727),
				title : "Escuela Vocacional",
				icon: busstop
			})
		},
		
		{	key: "darl", value: new google.maps.Marker({
				position : new google.maps.LatLng(18.205683,-67.146185),
				title : "Darlington",
				icon: busstop
			})
		},
	
		{	key: "entr", value: new google.maps.Marker({
				position : new google.maps.LatLng(18.211064,-67.144672),
				title : "Entrada Principal",
				icon: busstop
			})
		},
		
		{	key: "carr2", value: new google.maps.Marker({
				position : new google.maps.LatLng(18.210473, -67.145482),
				title : "Carr No. 2",
				icon: busstop,
				visible: false
			})
		},
		
		{	key: "pre-darl", value: new google.maps.Marker({
				position : new google.maps.LatLng(18.209523, -67.145394),
				title : "Pre-Darlington",
				icon: busstop,
				visible: false
			})
		},
		
		{	key: "pre-zool", value: new google.maps.Marker({
				position : new google.maps.LatLng(18.215615, -67.134772),
				title : "Pre-Zoologico",
				icon: busstop,
				visible: false
			})
		},
	];
		
	$.each(stop_array, function(stop) {
		stop_array[stop].value.setMap(map);
	});
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// GMaps Event Listeners-------------------------------------------------------------------------------------------///
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// UI Event Listeners ---------------------------------------------------------------------------------------------///
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

$(document).on('click', "#menu-eta", function() {
	$( "#menu-panel" ).panel( "close" );
	$( "#eta-popup" ).popup( "open" );
});

$(document).on('click', "#menu-routes", function() {
	$( "#menu-panel" ).panel( "close" );
	$( "#routes-popup" ).popup( "open" );
});

$(document).on('click', "#menu-service", function() {
	$( "#menu-panel" ).panel( "close" );
	$( "#service-popup" ).popup( "open" );
});

$(document).on('click', "#menu-location", function() {
	$( "#menu-panel" ).panel( "close" );
	initGeolocation();
});

$(document).on('click', "#options-reset", function() {
    map.setCenter(new google.maps.LatLng(18.209438, -67.140543));
  	map.setZoom(17);
});

$(document).on('click', "#options-show-all-routes", function() {
	var allon = true;
    $.each(route_array, function(i){
    	if(route_array[i].value.getVisible() == false){
    		allon = false;
    	}
    });
    
    if(allon){
    	$.each(route_array, function(j){
			route_array[j].value.setVisible(false);
	    });
    } else {
	    $.each(route_array, function(j){
			route_array[j].value.setVisible(true);
	    });
    }
    
    
});

$(document).on('click', "#options-clear-eta", function() {	
	$("#eta-bar").empty();
	$("#eta-bar").css({
		'height': '6px',
	});
	eta_requested = false;
});

/*
$(document).on('click', "#eta-clear", function() {
	$( "#eta-stop"  ).empty();
	$( "#eta-route" ).empty();
	$( "#eta-eta"   ).empty();
	
	$( "#eta-stop"  ).css({	'display': 'none' });
	$( "#eta-route" ).css({ 'display': 'none' });
	$( "#eta-eta"   ).css({	'display': 'none' });
	$( "#eta-clear" ).css({	'display': 'none' });
	
	$( "#eta-bar"   ).empty();
	$( "#eta-bar"   ).css({
		'height': '6px',
	});
});
*/

//function refreshETA(tid,stop,tlatlng){}

$(document).on('click', "#select-route", function() {
	var stop_key = $('#select-route').val();
	if(stop_key != ""){
		ShowRoute(stop_key);
	}
});

$(document).on('click', "#calculate-eta", function() {
	showEta();
});

function showEta(){
	if(trolley_array.length == 0){
		alert("There are no active trolleys.");
		return;
	}
	
	var the_stop = $('#select-stop').val();
	var the_route = $('#select-route').val();
	var stop_index;
	var route_index;
	
	if(the_stop != "" && the_route != ""){
		the_route = ShowRoute(the_route);
		the_stop = ShowStop(the_stop);
		
		for(var i=0; i<route_array.length; i++){
			if(route_array[i].key == $('#select-route').val()){
				route_index = i;
			}
		}
		
		for(var i=0; i<stop_array.length; i++){
			if(stop_array[i].key == $('#select-stop').val()){
				stop_index = i;
			}
		}

		console.log("Avg velocity: (m/s)"+trolley_array[0].avgVelocity);
		console.log("Avg velocity: (mi/hr)"+trolley_array[0].avgVelocity*2.23694);
		
		var pre_eta = getEta(stop_index,route_index,trolley_array[0].latlng,trolley_array[0].dir,trolley_array[0].avgVelocity);
		console.log(pre_eta);
		var eta_mins = Math.floor(pre_eta/60);
		var eta_secs = pre_eta-(eta_mins*60);
		
		if(eta){
			eta_requested = true;
			var html = "<div class=ui-grid-b>";
			html +=   "<div class=ui-block-a><center>Stop: "+the_stop.getTitle()+"</center></div>";
			html +=   "<div class=ui-block-b><center>Route: "+the_route.title+"</center></div>";
			html +=   "<div class=ui-block-c><center>"+eta_mins+"m"+eta_secs+"s</center></div>";
			html += "</div>";
			$( "#eta-bar" ).html(html);
		    $('#eta-bar').css({
		        'height': '22px'
		    });
	    
	    	$("#eta-popup").popup("close");
	    }
	    else{
	    	console.log("Eta cannot be calculated for the selected trolley.");
	    }
	}
	else{
		alert("Please select both a route and a stop.");
	}
}

$(document).on('change', 'input:radio[name="route-choice"]', function() {
	ShowRoute($(this).val());
});

$(document).on('change', "#select-route", function() {
	var the_route = $('#select-route').val();
	var the_stops;
	$('#select-stop').empty();
	$.each(route_array, function(route) {
		if(route_array[route].key === the_route){
			the_stops = route_array[route].stops;
			$.each(stop_array, function(stop) {
				$.each(the_stops, function(the_stop) {
					if(stop_array[stop].key == the_stops[the_stop]){
						$('#select-stop').append("<option value='"+stop_array[stop].key+"'>"+stop_array[stop].value.getTitle()+"</option>");
					}
				});
			});
		}
	});
	$('#select-stop').prepend('<option value="" data-placeholder="true">Select Bus Stop</option>');
	$("#select-stop").selectmenu("refresh");
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Function Graveyard -----------------------------------------------------------------------------------------------//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
function addMarkerListener(map,marker){
	google.maps.event.addListener(marker, 'click', function() {
        map.panTo(marker.getPosition());
    });
}

function animateSymbol(polyline) {
	var count = 0;
	var step = 64;
	window.setInterval(function() {
		count = (count + 1) % (step*100);

		var icons = polyline.get('icons');
		icons[0].offset = (count / step) + '%';
		polyline.set('icons', icons);
	}, 20);
}

function markerDropListener(marker,path,map){
	var shadow = new google.maps.Marker({
		position : marker.getPosition(),
		visible : false
	  });
	  
	shadow.setMap(map);
	  
	google.maps.event.addListener(marker, "dragend", function(event) { 
	  var lat = event.latLng.lat(); 
	  var lng = event.latLng.lng();
	  var latlng = new google.maps.LatLng(lat,lng);
	  marker.setPosition(latlng);
	  
	  var res = closestPointOnPath(latlng,path);
	  shadow.setPosition(res.coord);
	  shadow.setVisible(true);
	});
}

getDistanceAcrossPath(){
	var times1 = 0;
	var times2 = 0;
	
	var res1 = closestPointOnPath(slatlng,rpath);
	var res2 = closestPointOnPath(tlatlng,rpath);
	
	var index1 = res1.index;
	var index2 = res2.index;

	var coords1 = [];
	var coords2 = [];

	if(res1.dist > 20 | res2.dist > 20){	
		console.log("The coordinate(s) are too far away from path, cannot continue.");
		return;
	}

	while(index1 != res2.index && times1 <= rpath.length){
		index1 = ((index1 + 1) % rpath.length);
		coords1.push(rpath[index1]);
		times1++;
	}

	while(index2 != res1.index && times2 <= rpath.length){
		index2 = ((index2 + 1) % rpath.length);
		coords2.push(rpath[index2]);
		times2++;
	}
	
	var length1 = google.maps.geometry.spherical.computeLength(coords1);
	var length2 = google.maps.geometry.spherical.computeLength(coords2);
	
	return {"len1":length1,"len2":length2};
}


//create markers every 'thresh' meters IFF there are no nearby markers within thresh meters
//converts path to a set of nodes
function createNodes(rpath,threshold){
	var t1 = (new Date()).getTime();
	var exec_time;
	
	var placedMarkerPos = new google.maps.Polyline();
	var lastMarkerPos;
	var coords = [];
	var temp;
	var foundNeighbor;
	var marker_array = [];
	
	for(var i=0; i < rpath.getLength(); i++){
		coords.push(rpath.getAt(i));
		if(i==0){
			lastMarkerPos = rpath.getAt(i);
			temp = new google.maps.Marker({position : lastMarkerPos, map: map, title: "marker"+(placedMarkerPos.getPath().length)});
			temp.setMap(map);
			marker_array.push(temp);
			placedMarkerPos.getPath().push(lastMarkerPos);
		}
		else if(google.maps.geometry.spherical.computeLength(coords) > threshold){
			foundNeighbor = false;
			for(var index = placedMarkerPos.getPath().getLength()-1; index >= 0; index--){
				//if there is already a point nearby
				if(google.maps.geometry.spherical.computeDistanceBetween(rpath.getAt(i),placedMarkerPos.getPath().getAt(index)) < threshold){
					foundNeighbor = true;
					break;
				}
			}
			if(!foundNeighbor){
				lastMarkerPos = rpath.getAt(i);
				temp = new google.maps.Marker({position : lastMarkerPos, map: map, title: "marker"+(placedMarkerPos.getPath().length)});
				temp.setMap(map);
				marker_array.push(temp);
				placedMarkerPos.getPath().push(lastMarkerPos);
				coords = [];
			}
		}
	}
	
	exec_time = Math.round(((new Date()).getTime() - t1));
	console.log("Done! 'createNodes' finished execution in "+exec_time+" ms. New array is "+placedMarkerPos.getPath().getLength()+ " points long.");
	return ({"latlngs" : placedMarkerPos.getPath(), "markers" : marker_array});
}

/**
 *	Description:
 * 	Animates a marker representation of a trolley along a route.
 * 	
 * 	Params:
 *	tmarker - the trolley marker
 * 	tmarker_path - the path the trolley is to follow
 * 	rpoly - route polyline used as reference to check whether trolley coordinates lie on it
 * 	slatlng - the coordinates of a station, used to test other functions such as getDistanceAcrossPath() and getETA()
 * 	dir - the direction of the trolley with respect to route, 1 for CCW, 0 for CW.
 *
function animateMarker(tid,tmarker,tmarker_path,rpoly,slatlng,dir) {
	if (arguments.length == 4) {
		var coords;
		var index = 0;
		var lastEta = -1;
		var thisEta = 0;
		var lastStop = "";
		
		setInterval(function() {
			coords = tmarker_path[index % tmarker_path.length];
			index++;
			//tmarker.setVisible(google.maps.geometry.poly.isLocationOnEdge(coords, rpoly, 0.0005));
			tmarker.setPosition(coords);
		}, 100);
	} else if (arguments.length == 6) {
		var tlatlng;
		var index = 0;
		var res;
		var ret;
		var traversed = [];
		var indexes = [];
		setInterval(function() {
			tlatlng = tmarker_path[index % tmarker_path.length];
			index++;
			tmarker.setPosition(tlatlng);
			var dist = 20;
			thisEta = Math.round(getETA(dist.len,45));
			if(lastEta != thisEta){
				//console.log("ETA: "+thisEta+" seconds");
			}
			
			ret = getClosestStop(tlatlng);
			if((ret.dist < 30) && (ret.stop.key != lastStop)){
				traversed.unshift(ret.stop.key);
				indexes.unshift(ret.index);
				lastStop = ret.stop.key;
				if(traversed.length > 10){
					traversed.pop();
					indexes.pop();
				}

				console.log("Trolley with ID '"+tid+"' passing by the '"+traversed[0]+"' stop");
				var the_route = getRoute(indexes);
				console.log("Current direction: "+getDirection(indexes,the_route));
				stop = stop_array[14];
				sname = stop.value.getTitle();
				slatlng = stop.value.getPosition();
				console.log("Distance to stop: "+sname+" is "+getDistanceAcrossPath(slatlng,tlatlng,(new google.maps.Polyline({path: Interno})).getPath(),route_array[the_route.index].type,getDirection(indexes,the_route)).len);
				console.log("--------------------------------------------");
			}

			lastEta = Math.round(getETA(dist.len,45));
		}, 100);
	}
}


/**
 *	Description:
 *  Calculates an estimate of time before the next bus arrives
 * 
 * 	Params:
 * 	distance - the distance in meters that corresponds to the length of a segment of a route between trolley and stop
 * 	velocity - average velocity of the trolley
 *
function getETA(distance,velocity){
	return distance/velocity;
}

/**
 *	Description:
 * 	Animates a marker representation of a trolley according to the updates received. Creates a new marker if the 
 * 	  trolley was not found in the array.
 * 	
 * 	Params:
 *	tarray - the array containing all active trolleys
 * 	upd - an object containing trolleyid, coordinates and timestamp. 	
 *
function applyUpdate(tarray,upd) {
	var date = new Date(upd.date*1000);
	var hours = date.getHours();
	var minutes = date.getMinutes();
	var seconds = date.getSeconds();
	
	var tname = upd.name;
	var tlatlng = new google.maps.LatLng(upd.lat,upd.lng);
	var formattedTime = hours + ':' + minutes + ':' + seconds;
	
	console.log("Trolley: "+tname+", Coords: "+tlatlng+", Date: "+formattedTime);
	
	for (var i = 0; i < tarray.length; i++) {
	    if (tarray[i].name == tname){
	    	tarray[i].marker.setPosition(tlatlng);
	    	return;
	    }
	}
	
	//trolley was not found, create trolley and add to tarray
	var troll = new google.maps.Marker({
		position : tlatlng,
		title    : tname
	});
		
	troll.setMap(map);
	upd.marker = troll;
	tarray.push(upd);
	//if trolley has been inactive for a looong while, remove object
}

/**
 *	Description: 
 * 	Animates a virtual trolley along a route for the purpose of testing several functions.
 *
function initSimulatorStuff(){
	var bus = '../css/images/icons-simple/bus.png';
	
	route1_trolley = new google.maps.Marker({
		position : Palacio[0],
		title : "pala_trolley",
		icon: bus,
		visible : true
	});
	
	route2_trolley = new google.maps.Marker({
		position : Zoologico[0],
		title : "zool_trolley",
		icon: bus,
		visible : false
	});
	
	route3_trolley = new google.maps.Marker({
		position : Interno[0],
		title : "interno_trolley",
		icon: bus,
		visible : false
	});
	
	route4_trolley = new google.maps.Marker({
		position : Terrace[0],
		title : "terr_trolley",
		icon: bus,
		visible : false
	});
	
	route5_trolley = new google.maps.Marker({
		position : Darlington[0],
		title : "darl_trolley",
		icon: bus,
		visible : false
	});
	
	var interno_poly = new google.maps.Polyline({path : Interno, map: map, visible : false});
	var pala_poly = new google.maps.Polyline({path : Palacio, map: map, visible : false});
	var terr_poly = new google.maps.Polyline({path : Terrace, map: map, visible : false});
	var zool_poly = new google.maps.Polyline({path : Zoologico, map: map, visible : false});
	var darl_poly = new google.maps.Polyline({path : Darlington, map: map, visible : false});
	
	route1_trolley.setMap(map);
	route2_trolley.setMap(map);
	route3_trolley.setMap(map);
	route4_trolley.setMap(map);
	route5_trolley.setMap(map);
	
	trolley_array = [route1_trolley,route2_trolley,route3_trolley,route4_trolley,route5_trolley];
	
	animateMarker("T0_Palacio",route1_trolley,Palacio,pala_poly,stop_array[0].value.getPosition(),1);
	animateMarker("T1_Zoologico",route2_trolley,Zoologico,zool_poly,stop_array[1].value.getPosition(),1);
	animateMarker("T2_Interno",route3_trolley,Interno,interno_poly,stop_array[2].value.getPosition(),1);
	animateMarker("T3_Terrace",route4_trolley,Terrace,terr_poly,stop_array[3].value.getPosition(),1);
	animateMarker("T4_Darlington",route5_trolley,Darlington,darl_poly,stop_array[4].value.getPosition(),1);
}

*/