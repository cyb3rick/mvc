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
	
	map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

	initStopMarkers();
	initRoutes();
	initSimulatorStuff();
}

google.maps.event.addDomListener(window, "load", initialize);

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
function getDistanceAcrossPath(slatlng,tlatlng,rpath,tdir){
	var res1 = closestPointOnPath(slatlng,rpath);
	var res2 = closestPointOnPath(tlatlng,rpath);
	
	if(res2.dist > 20){	
		console.log("The coordinate(s) are too far away from path, cannot continue.");
		return;
	}
	
	var stop_index = res1.index;
	var trolley_index = res2.index;
	var coords = [];
	var times = 0;
	var start = 0;
	var stop = 0;
	
	if(tdir){
		start = trolley_index;
		stop = stop_index;
	} else {
		start = stop_index;
		stop = trolley_index;
	}
	
	for(var i=start; i != stop && times <= rpath.length; i = ((i + 1) % rpath.length), times++){
		coords.push(rpath.getAt(i));
	}
	
	var length = google.maps.geometry.spherical.computeLength(coords);
	return {"len":length};
}

/**
 *	Description:
 * 	Identifies the coordinates on a route that are closest to a trolley.
 * 	
 * 	Params:
 *	latlng - coordinates of trolley
 * 	path - the path of the route
 * 
 * 	Returns:
 * 	An object containing the coordinates of the point on the route closest to the trolley (coords) and the index of the 
 * 	  coordinates on the path array (theindex).
 */
function closestPointOnPath(latlng,path){
	var coord = path.getAt(0);
	var theindex;
	var temp;

	for(index = 1; index < path.length; index++){
		temp = google.maps.geometry.spherical.computeDistanceBetween(latlng,path.getAt(index));
		if(temp < google.maps.geometry.spherical.computeDistanceBetween(latlng,coord)){
			coord = path.getAt(index);
			theindex = index;
		}
	}
	var dist = google.maps.geometry.spherical.computeDistanceBetween(latlng,coord);
	return {"coord":coord,"dist":dist,"index":theindex};
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
 */
function animateMarker(tmarker,tmarker_path,rpoly,slatlng,dir) {
	if (arguments.length == 3) {
		var coords;
		var index = 0;
		setInterval(function() {
			coords = tmarker_path[index % tmarker_path.length];
			index++;
			tmarker.setVisible(google.maps.geometry.poly.isLocationOnEdge(coords, rpoly, 0.0005));
			tmarker.setPosition(coords);
		}, 100);
	} else if (arguments.length == 5) {
		var tlatlng;
		var index = 0;
		setInterval(function() {
			tlatlng = tmarker_path[index % tmarker_path.length];
			index++;
			tmarker.setVisible(google.maps.geometry.poly.isLocationOnEdge(tlatlng, rpoly, 0.0005));
			tmarker.setPosition(tlatlng);
			var dist = getDistanceAcrossPath(slatlng,tlatlng,rpoly.getPath(),dir);
			//console.log(Math.round(dist.len));
			console.log("ETA: "+Math.round(getETA(dist.len,45))+" seconds");
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
 */
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
 */
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
		mylocation.setMap(map);
		alert("Your location seems to be "+Math.round(min_dist)+"m away from the "+closest_stop.value.getTitle()+" stop.");
		
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
	route_array = [
		{	key: "route1", title: "Palacio", 
			stops: ["pala","barc","port","stef","pati"],
			value:	new google.maps.Polyline({
			path : Palacio,
			strokeColor : '#FF0000',
			strokeOpacity : 0.6,
			strokeWeight : 10,
			map : map
		})},					
	
		{	key: "route2", title: "Zoologico",
			stops: ["zool","biol","civi","bibl","fisi"],
			value: new google.maps.Polyline({
			visible : false,
			path : Zoologico,
			strokeColor : '#00FFFF',
			strokeOpacity : 0.6,
			strokeWeight : 10,
			map : map
		})},
		
		{	key: "route3", title: "Interno",
			stops: ["atle","admi","bibl","fisi","cent","pine"],
			value:	new google.maps.Polyline({
			visible : false,
			path : Interno,
			strokeColor : '#FFFF00',
			strokeOpacity : 0.6,
			strokeWeight : 10,
			map : map
		})},
		
		{	key: "route4", title: "Terrace",
			stops: ["terr","finc","admi","pati","fisi","cent"],
			value:	new google.maps.Polyline({
			visible : false,
			path : Terrace,
			strokeColor : '#FF00FF',
			strokeOpacity : 0.6,
			strokeWeight : 10,
			map : map
		})},
							
		{	key: "route5", title: "Darlington",
			stops: ["darl","entr","gimn","bibl"],
			value:	new google.maps.Polyline({
			visible : false,
			path : Darlington,
			strokeColor : '#00FF00',
			strokeOpacity : 0.6,
			strokeWeight : 10,
			map : map
		})}
	];
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
		})},
		
		{	key: "fisi", value: new google.maps.Marker({
			position : new google.maps.LatLng(18.210868,-67.139643),
			title : "Puente Fisica",
			icon: busstop
		})},
	
		{	key: "bibl", value: new google.maps.Marker({
			position : new google.maps.LatLng(18.211787,-67.14196),
			title : "Biblioteca",
			icon: busstop
		})},
	
		{ 	key: "pati", value: new google.maps.Marker({
			position : new google.maps.LatLng(18.211283,-67.140823),
			title : "Patio Central",
			icon: busstop
		})},
	
		{	key: "admi", value: new google.maps.Marker({
			position : new google.maps.LatLng(18.216771,-67.143049),
			title : "Administracion de Empresas",
			icon: busstop
		})},
	
		{	key: "civi", value: new google.maps.Marker({
			position : new google.maps.LatLng(18.21458,-67.139772),
			title : "Ingenieria Civil",
			icon: busstop
		})},
	
		{	key: "stef", value: new google.maps.Marker({
			position : new google.maps.LatLng(18.20968,-67.139021),
			title : "Stefani",
			icon: busstop
		})},
	
		{	key: "port", value: new google.maps.Marker({
			position : new google.maps.LatLng(18.208957,-67.140322),
			title : "Portico",
			icon: busstop
		})},
	
		{	key: "barc", value: new google.maps.Marker({
			position : new google.maps.LatLng(18.207543,-67.139935),
			title : "Barcelona",
			icon: busstop
		})},
	
		{	key: "deca", value: new google.maps.Marker({
			position : new google.maps.LatLng(18.208648,-67.141432),
			title : "Decanato de Estudiantes",
			icon: busstop
		})},
	
		{	key: "cent", value: new google.maps.Marker({
			position : new google.maps.LatLng(18.209935,-67.141472),
			title : "Centro de Estudiantes",
			icon: busstop
		})},
	
		{	key: "entr", value: new google.maps.Marker({
			position : new google.maps.LatLng(18.211064,-67.144672),
			title : "Entrada Principal",
			icon: busstop
		})},
	
		{	key: "darl", value: new google.maps.Marker({
			position : new google.maps.LatLng(18.205683,-67.146185),
			title : "Darlington",
			icon: busstop
		})},
	
		{	key: "gimn", value: new google.maps.Marker({
			position : new google.maps.LatLng(18.212119,-67.143776),
			title : "Gimnasio",
			icon: busstop
		})},
	
		{	key: "finc", value: new google.maps.Marker({
			position : new google.maps.LatLng(18.215461,-67.146341),
			title : "Finca Alzamora",
			icon: busstop
		})},
	
		{	key: "terr", value: new google.maps.Marker({
			position : new google.maps.LatLng(18.215375,-67.14802),
			title : "Parque Terrace",
			icon: busstop
		})},
	
		{	key: "pine", value: new google.maps.Marker({
			position : new google.maps.LatLng(18.210638,-67.143591),
			title : "Pinero",
			icon: busstop
		})},
	
		{	key: "atle", value: new google.maps.Marker({
			position : new google.maps.LatLng(18.217306,-67.144844),
			title : "Residencia de Atletas",
			icon: busstop
		})},
	
		{	key: "biol", value: new google.maps.Marker({
			position : new google.maps.LatLng(18.211762,-67.138246),
			title : "Biologia",
			icon: busstop
		})},
	
		{	key: "zool", value: new google.maps.Marker({
			position : new google.maps.LatLng(18.215813,-67.133396),
			title : "Zoologico",
			icon: busstop
		})}
	];
		
	$.each(stop_array, function(stop) {
		stop_array[stop].value.setMap(map);
	});
}

/**
 *	Description: 
 * 	Animates a virtual trolley along a route for the purpose of testing several functions.
 */
function initSimulatorStuff(){
	var bus = '../css/images/icons-simple/bus.png';

	var route3_trolley = new google.maps.Marker({
		position : interno_trolley[0],
		title : "interno_trolley",
		icon: bus
	});
	var interno_poly = new google.maps.Polyline({path : interno_trolley, map: map});
	route3_trolley.setMap(map);
	//animateMarker(route3_trolley,interno_trolley,route_array[2].value);
	animateMarker(route3_trolley,interno_trolley,interno_poly,stop_array[2].value.getPosition(),0);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Event Listeners --------------------------------------------------------------------------------------------------//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

$(document).on('click', "#my-location-button", function() {
	initGeolocation();
});

$(document).on('click', "#reset-map-view", function() {
    map.setCenter(new google.maps.LatLng(18.209438, -67.140543));
  	map.setZoom(17);
});

$(document).on('click', "#admin-login", function() {
	$.mobile.changePage("#admin-home", {reloadPage : true});
});

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

$(document).on('click', "#calculate-eta", function() {
	var the_stop = $('#select-stop').val();
	var the_route = $('#select-route').val();
	
	if(the_stop != "" && the_route != ""){
		the_route = ShowRoute(the_route);
		the_stop = ShowStop(the_stop);
		$( "#eta-stop" ).html("Stop: "+the_stop.getTitle());
		$( "#eta-route" ).html("Route: "+the_route.title);
		$( "#eta-eta" ).html("ETA: 10 min");
		$( "#eta-stop" ).css({	'display': 'block' });
		$( "#eta-route" ).css({ 'display': 'block' });
		$( "#eta-eta" ).css({	'display': 'block' });
		$( "#eta-clear" ).css({	'display': 'block' });
		var html = "<div class=ui-grid-b>";
		html +=   "<div class=ui-block-a><center>Stop: "+the_stop.getTitle()+"</center></div>";
		html +=   "<div class=ui-block-b><center>Route: "+the_route.title+"</center></div>";
		html +=   "<div class=ui-block-c><center>ETA: 10min</center></div>";
		html += "</div>";
		$( "#eta-bar" ).html(html);
	    $('#eta-bar').css({
	        'height': '22px',
	        'color': '#FFFFFF'
	    });
	}
	else{
		alert("Please select both a route and a stop.");
	}
});

$(document).on('change', "#follow-trolley", function() {
	if($('#follow-trolley').is(':checked')){
		$(document).on('change', "#follow-trolley", function() {
		});
	}
});

$(document).on('change', "#route-form", function() {
    $('input:radio[name="route-choice"]').change(
    function(){
	   	ShowRoute($(this).val());
	});
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
*/