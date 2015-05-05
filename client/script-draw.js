

/*
 * This object is in charge of managing anything that has to do with drawing on the map.
 */
function Drawer(){
    this.pen         = null;
    this.drawLayer   = null;
    this.currDrawing = "";
    this.currType    = "";


    //triggered when a drawing is done (click on last point)
    //informs property manager.
    MapObject.map.on('draw:drawstop', function(e) {
        //TODO: this must be somehow possible in an easier way...
        EntityObject.propertyManager.drawer.pen.disable()
    });


    //executed when a drawing is done...
    //      - create string for sending it to DB TODO
    //      - disable radio buttons
    MapObject.map.on('draw:created', function(e) {
        var type = e.layerType,
            layer = e.layer;

        //get the drawing's correct format and save it
        EntityObject.propertyManager.drawer.currDrawing = toDBGeomFormat(layer, type);

        //save the drawed geom so that it can be removed from the map later.
        EntityObject.propertyManager.drawer.drawLayer = layer;

        MapObject.map.addLayer(layer);
    });
}


/*
 * Removes geometry from draw layer. Resets variables.
 */
Drawer.prototype.disable = function(){
    if(this.pen != null){ 
        this.pen.disable();
    }

    //reset draw layer
    MapObject.drawLayer = new L.FeatureGroup();
    MapObject.map.addLayer(MapObject.drawLayer);



    if(this.drawLayer != null){
        MapObject.map.removeLayer(this.drawLayer);
        this.drawLayer.editing.disable();
    }
    this.currType     = '';
    this.currDrawing = '';
    this.drawLayer    = null;
}



/*
 * Loads geometry into a leaflet layer such that it can be edited.
 */
Drawer.prototype.loadGeometry = function(geometry){
console.log("uhu!");
    //load the shape into a leaflet layer
    //split at '(' or '((' or '((('
    var typeValue = geometry.split(/[\(]+/);
    //extract coordinates (they are separated by ',')
    var points = typeValue[1].replace(")", "").split(",");
    var newPoints = [];
    //in polygons the last coordinate == the first. leaflet doesn't like this...
    var length = points.length
    if(typeValue[0] == "POLYGON" || typeValue[0] == "MULTIPOLYGON") length--;

    //leaflet coordinates are (lat, long) and not (long, lat)...
    for(i = 0; i < length; i++){
        lngLat = points[i].split(" ");
        newPoints[i] = [Number(lngLat[1]), Number(lngLat[0])];
    }

    //create draw layer and remember it's type...
    switch(typeValue[0]){
        case "POINT": 
            this.drawLayer = L.marker(newPoints[0]).addTo(MapObject.map);
            this.currType = 'marker';
            break;

        case "LINESTRING": 
            this.drawLayer = L.polyline(newPoints).addTo(MapObject.map);
            this.currType = 'polyline';
            break;

        case "POLYGON":
        case "MULTIPOLYGON":
            this.drawLayer = L.polygon(newPoints).addTo(MapObject.map);
            this.currType = 'polygon';
            break;
    }

    this.drawLayer.editing.enable();
}



/*
 * Enables drawing on the map.
 */
Drawer.prototype.createGeometry = function(type){
    switch(type){
        case 'point': 
            this.pen = new L.Draw.Marker(MapObject.map, MapObject.drawControl);
            break;

        case 'polyline': 
            this.pen = new L.Draw.Polyline(MapObject.map, MapObject.drawControl);
            break;

        case 'polygon':
            this.pen = new L.Draw.Polygon(MapObject.map, MapObject.drawControl);
            break;
    }
    this.pen.enable();
}


/*
 * returns geometric shape in correct format for saving it in the database.
 * each single coordinate has to be inverted. Leaflet draw returns them (Lat, Long) but we need 
 * them as (Long, Lat)
 */
toDBGeomFormat = function(layer, type){
    currDrawing = "";

    if(type == 'marker'){
        currDrawing = layer.getLatLng().toString()
    } else {
        var points = layer.getLatLngs();
        for(i = 0; i < points.length; i++){
            currDrawing = currDrawing.concat("," + points[i].toString())
        }
    }
    
    //set correct coordinate format
    currDrawing = currDrawing.replace(/,/g, '')
    currDrawing = currDrawing.replace(/\)/g, '')
    currDrawing = currDrawing.replace(/LatLng\(/g, ',')
    currDrawing = currDrawing.substring(1, currDrawing.length-1);
    
    //invert the coordinates from (Lat, Long) to (Long, Lat)
    coordinates = currDrawing.split(",");
    currDrawing = "";
    firstPoint = "";
    for(i in coordinates) {
        latLng = coordinates[i].split(" ");
        currDrawing += "," + latLng[1] + " " + latLng[0];
        
        //For polygons the ring needs to be closed...
        if(i == 0) firstPoint = currDrawing;
    }

    //remove last comma
    currDrawing = currDrawing.substring(1, currDrawing.length-1);

    //set correct geometric type
    switch(type){
        case 'marker':
            //TODO: is this really the correct format (There aren't any points yet in the DB)
            currDrawing = "POINT(" + currDrawing + ")";
            break;
        case 'polyline':
            currDrawing = "LINESTRING(" + currDrawing + ")";
            break;
        case 'polygon':
            currDrawing = "POLYGON((" + currDrawing + firstPoint + "))";
    }
console.log('converted: ' + currDrawing);
    return currDrawing;
}
