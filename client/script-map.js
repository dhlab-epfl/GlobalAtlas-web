

MapObject.date = 2015;
MapObject.map = null;
MapObject.jsonLayer = null;
MapObject.featureTypes = [];
MapObject.ignoreTypes = [];

MapObject.init = function(){

	MapObject.map = L.map('map').setView([45.44, 12.33], 13);

	/* ADD BACKGROUND LAYER */

	var mapboxTiles = L.tileLayer('https://{s}.tiles.mapbox.com/v3/mapbox.world-blank-bright/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoib2RhbGFuZyIsImEiOiJxbTlhYVZFIn0.HQNXXBx1A7BFrQVcQqTEDA', {attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>', maxNativeZoom: 11, maxZoom: 25});
    var emptyTiles = L.tileLayer('seamless_white_background_texture.jpg', {maxZoom: 25}).addTo(MapObject.map);

    L.control.layers({'Mapbox':mapboxTiles,'No background':emptyTiles},{},{position: 'bottomleft'}).addTo(MapObject.map);

	/* ADD LAYER */

	MapObject.jsonLayer = L.geoJson([],{style: MapObject.featureStyle, onEachFeature: MapObject.onEachFeature}).addTo(MapObject.map);


	/* GET THE HASH */

	MapObject.map.setZoom( hash['zoom']?hash['zoom']:15 );
	MapObject.map.setView( L.latLng( hash['lat']?hash['lat']:45.44, hash['lon']?hash['lon']:12.33));
	MapObject.date = (hash['date']?hash['date']:2015);
	MapObject.ignoreTypes = (hash['ignoreTypes']?hash['ignoreTypes']:[]);

	// create the checkboxes for types that are ignored, since they won't be returned by the query...
	$.each(MapObject.ignoreTypes, function(i,item){
	    if( $.inArray(item, MapObject.featureTypes)==-1 ){
	        MapObject.featureTypes.push( item );
	        $('.leaflet-control-layers-list').append('<label><input type="checkbox" class="leaflet-control-layers-selector" name="leaflet-overlay-layers" onclick="MapObject.toggleType(event,\''+item+'\')"><span> '+item+'</span></label>');
	    }		
	});


	/* INITIAL LOAD */

	MapObject.reloadData();

	/* RELOAD LAYER ON MAP MOVE */

	MapObject.map.on('moveend', MapObject.reloadData);

}

MapObject.setHash = function(){
	hash.zoom = MapObject.map.getZoom();
	hash.lat = MapObject.map.getCenter().lat;
	hash.lon = MapObject.map.getCenter().lng;
	hash.date = MapObject.date;
	hash.ignoreTypes = MapObject.ignoreTypes;
	setHash();
}


MapObject.reloadData = function(){

	MapObject.setHash();


	console.log('MapObject: reloading...');

	var query = 'get';
	var bounds = MapObject.map.getBounds();
    var zoom = MapObject.map.getZoom();
    var ignores = MapObject.ignoreTypes.join(',');
	var date = MapObject.date;

	$.ajax({
                type: "GET",
                dataType: "json",
                url: settings_api_url,
                data: {'query': query,'n': bounds.getNorth(),'s': bounds.getSouth(),'e': bounds.getEast(),'w': bounds.getWest(),'zoom': zoom,'date': date,'filtertype': ignores},

                success: function(data,textStatus,jqXHR){
					MapObject.jsonLayer.clearLayers();
					MapObject.jsonLayer.addData(data);
					console.log('MapObject: loaded '+(data.features.length)+' features');
                },
                error: function( jqXHR, textStatus, errorThrown ){
                	console.log('MapObject: error getting features !\n'+jqXHR.responseText);
                }
            });


}

MapObject.onEachFeature = function(feature, layer) {


    if( $.inArray(feature.properties.entity_type_name, MapObject.featureTypes)==-1 ){
        MapObject.featureTypes.push( feature.properties.entity_type_name );
        $('.leaflet-control-layers-list').append('<label><input type="checkbox" class="leaflet-control-layers-selector" name="leaflet-overlay-layers" onclick="MapObject.toggleType(event,\''+feature.properties.entity_type_name+'\')" checked="checked"><span> '+feature.properties.entity_type_name+'</span></label>');
    }

	layer.bindLabel(feature.properties.entity_name+' [in '+feature.properties.date+']').addTo(MapObject.map);

    layer.on('click', function (e) {
    	EntityObject.loadEntity( feature.properties.entity_id );
    });

}


MapObject.setDate = function(newDate){

	MapObject.date = newDate;
	MapObject.reloadData();
	EntityObject.reloadData();

}




MapObject.toggleType = function(event, type){
    event.stopPropagation();
    if($.inArray(type, MapObject.ignoreTypes)!=-1){
        MapObject.ignoreTypes.splice( $.inArray(type, MapObject.ignoreTypes), 1 );
    }
    else{
        MapObject.ignoreTypes.push(type);
    }
    MapObject.reloadData();
}



MapObject.styles = {
	'building':{
		weight: 1,
		opacity: 0.7,
		fillOpacity: 0.6,
	    fillColor: '#BBB',
		color: '#555'
	},
	'canal':{
		weight: 1,
		opacity: 1.0,
		stroke: false,
		fillOpacity: 0.6,
	    fillColor: '#C8CFE0'
	},
	'isola':{
		weight: 1,
		opacity: 1.0,
		fillOpacity: 0.6,
	    fillColor: '#F2EAD8',
		color: '#8A857C'
	},
    'sovereign_state':{
        weight: 1,
        opacity: 1.0,
        fillOpacity: 0.2,
        fillColor: '#EDB9B9',
        color: '#945C5C'
    },
    'lot':{
        weight: 1,
        opacity: 1.0,
        fillOpacity: 0.2,
        fillColor: '#EDB9B9',
        color: '#945C5C'
    }
};

MapObject.featureStyle = function(feature) {
	return MapObject.styles[feature.properties.entity_type_name];
}