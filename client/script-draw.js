

/*
 * This object is in charge of managing anything that has to do with drawing on the map.
 */
function Drawer(){
    //PRIVATE MEMBERS
    var pen         = null;
    var drawLayer   = null;
    var currDrawing = "";
    var currType    = "";


    /* 
     * returns geometric shape in correct format for saving it in the database.
     * each single coordinate has to be inverted. Leaflet draw returns them (Lat, Long) but we need 
     * them as (Long, Lat)
     */
    function toDBGeomFormat(){
        currDrawing = "";

        if(currType == 'marker'){
            currDrawing = drawLayer.getLatLng().toString()
        } else {
            var points = drawLayer.getLatLngs();
            for(i = 0; i < points.length; i++){
                currDrawing = currDrawing.concat("," + points[i].toString())

            }
        }
        
        //set correct coordinate format
        currDrawing = currDrawing.replace(/,/g, '')
        currDrawing = currDrawing.replace(/\)/g, '')
        currDrawing = currDrawing.replace(/LatLng\(/g, ',')
        currDrawing = currDrawing.substring(1, currDrawing.length);
        
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

        //remove first comma
        currDrawing = currDrawing.substring(1, currDrawing.length);

        //set correct geometric type
        switch(currType){
            case 'marker':
                currDrawing = "POINT(" + currDrawing + ")";
                break;
            case 'polyline':
                currDrawing = "LINESTRING(" + currDrawing + ")";
                break;
            case 'polygon':
                currDrawing = "POLYGON((" + currDrawing + firstPoint + "))";
        }

        return currDrawing;
    }





    //PRIVILEGED MEMBERS


    /*
     * Loads geometry into a leaflet layer such that it can be edited.
     */
    this.loadGeometry = function(geometry){
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

        //create draw layer, add snap and remember the geom's type...
        switch(typeValue[0]){
            case "POINT": 
                drawLayer = L.marker(newPoints[0]).addTo(MapObject.map);
                drawLayer.snapediting = new L.Handler.MarkerSnap(MapObject.map, drawLayer,{snapDistance: 15});
                currType = 'marker';
                break;

            case "LINESTRING": 
                drawLayer = L.polyline(newPoints).addTo(MapObject.map);
                drawLayer.snapediting = new L.Handler.PolylineSnap(MapObject.map, drawLayer,{snapDistance: 15});
                currType = 'polyline';
                break;

            case "POLYGON":
            case "MULTIPOLYGON":
                drawLayer = L.polygon(newPoints).addTo(MapObject.map);
                drawLayer.snapediting = new L.Handler.PolylineSnap(MapObject.map, drawLayer, {snapDistance: 15});
                currType = 'polygon';
                break;
        }

        //add the current layers as guideLayer
        drawLayer.snapediting.addGuideLayer(MapObject.jsonLayer)
        drawLayer.snapediting.enable();
    }



    /*
     * Returns edited geometry. If nothing has been edited, it returns ''.
     */
    this.getGeometry = function(){
        if(drawLayer == null) return '';
        return toDBGeomFormat(drawLayer, currType)
    }



    /*
     * Enables drawing on the map.
     */
    this.createGeometry = function(type){
        switch(type){
            case 'marker': 
                pen = new L.Draw.Marker(MapObject.map, MapObject.drawControl);
                break;

            case 'polyline': 
                pen = new L.Draw.Polyline(MapObject.map, MapObject.drawControl);
                break;

            case 'polygon':
                pen = new L.Draw.Polygon(MapObject.map, MapObject.drawControl);
                break;
        }
        pen.enable();
    }



    /*
     * Removes geometry from draw layer. Resets variables.
     */
    this.disable = function(){
        //disable drawing
        if(pen != null){ 
            pen.disable();
        }

        //reset draw layer
        MapObject.drawLayer = new L.FeatureGroup();
        MapObject.map.addLayer(MapObject.drawLayer);


        //disable editing
        if(drawLayer != null){
            if(drawLayer.snapediting != null){
                drawLayer.snapediting.disable()
                drawLayer.snapediting = null;
            }
            MapObject.map.removeLayer(drawLayer);
        }

        //reset variables
        currType    = '';
        currDrawing = '';
        drawLayer   = null;
    }





    //LISTENERS


    /*
     * executed when a drawing is done...
     *       - create string for sending it to DB TODO
     *       - disable radio buttons
     */
    MapObject.map.on('draw:created', function(e) {
        //save current type and layer so that drawing can be returned later...
        currType  = e.layerType,
        drawLayer = e.layer;

        MapObject.map.addLayer(drawLayer);
    });
}
