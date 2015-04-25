EditorObject.pointDrawer   = null;
EditorObject.lineDrawer    = null;
EditorObject.polygonDrawer = null;
EditorObject.currLayer     = null;
EditorObject.currDrawing   = "";

EditorObject.init = function(){


    //render radio buttons TODO 
    $("#editor-draw-radio").buttonset();

    $("#editor-type-select")
      .selectmenu()
      .selectmenu("option", "width", "100%")
      .selectmenu( "menuWidget" )
        .addClass( "overflow" );



    /* init drawing */
    EditorObject.pointDrawer = new L.Draw.Marker(MapObject.map, MapObject.drawControl);
    EditorObject.lineDrawer = new L.Draw.Polyline(MapObject.map, MapObject.drawControl);
    EditorObject.polygonDrawer = new L.Draw.Polygon(MapObject.map, MapObject.drawControl);

    //when starting drawing
    //TODO can we erase this?
    MapObject.map.on('draw:drawstart', function(e) {
        EditorObject.currLayer = e.layer
    });



    MapObject.map.on('draw:drawstop', function(e) {
        $("#draw-box").hide()
        $("#editor").show()
        EditorObject.disableDrawer()
    });



    //executed when a drawing is done...
    //      - create string for sending it to DB
    //      - disable radio buttons
    MapObject.map.on('draw:created', function(e) {
        var type = e.layerType,
            layer = e.layer;

        //get the drawing's correct format 
        EditorObject.currDrawing = formatDrawingInput(layer, type);


        //go back to Editor and disable the radio buttons
        $("#draw-box").hide()
        $("#editor").show()
        $("#editor-draw-radio").buttonset("disable");


	//TODO: SAVE DRAWING TEMPORARILY...
	MapObject.map.addLayer(layer);
    });



    // when an existing drawing is edited...
    MapObject.map.on('draw:edited', function(e){
        $("#editor-draw-radio").prop("disabled", true);
        $("[name='dRadio']").button("refresh");
    });



    //Enable drawing when clicking on one of the Draw-radios
    //TODO: showing/hiding options in select doesn't work yet!
    $("#editor-dRadioPoint").click(function(){
        $("#editor").hide()
        $("#draw-box").show()
        EditorObject.pointDrawer.enable();
    });
    $("#editor-dRadioLine").click(function(){
        $("#editor").hide()
        $("#draw-box").show()
        EditorObject.lineDrawer.enable();
    });
    $("#editor-dRadioArea").click(function(){
        $("#editor").hide()
        $("#draw-box").show()
        EditorObject.polygonDrawer.enable();
    });



    //Time: set timeslider's time when this input changes.
    $("#editor-valid-at").change(function() {
        SliderObject.setYear($("#editor-valid-at").val())
    });



    //Create button
    $("#editor-create-cancel").click(function(){
        //TODO: delete made drawing
        EditorObject.hide();
    });

    //Save button
    $("#editor-create-save").click(function(){
        if($('#editor-entityName').val() == '') {
            alert("Please name your new entity.");
        } else {
            EditorObject.saveNewEntity();
            EditorObject.hide();
        }
    });




    //DRAW BOX

    //Cancel: - hide drawbox, show Editor 
    //        - disable drawer.
    $("#draw-cancel").click(function(){
        $("#draw-box").hide()
        $("#editor").show()
        EditorObject.disableDrawer()
    });

    //when drawing is saved: - hide drawbox, show Editor
    //                       - disable drawer.
    //                       - disable radio buttons
    $("#draw-done").click(function(){
        $("#draw-box").hide()
        $("#editor").show()
	$("#editor-draw-radio").buttonset("disable");
        EditorObject.disableDrawer()
        //TODO save current drawing somehow...
    });
}


// show Editor and reset all its fields. 
EditorObject.show = function(){
    $("#editor").show();

    //set "valit at" value
    $("#editor-valid-at").val($("#slider-ui").slider("option", "value"));

    //enable and uncheck radio buttons
    $("#editor-draw-radio").buttonset("enable");
    $("[name='dRadio']").attr("checked", false);
    $("[name='dRadio']").button("refresh");

    //empty textareas
    $(".input-text").val("");
    $("#editor-entityName").val("");
}


// load a new editor (called in script-entity)
EditorObject.load = function(eID, eName, eType, data){
    alert(eName + ", " + eType);
    EditorObject.show();
    $('#editor-entityName').val(eName);
    
}



EditorObject.hide = function(){
    //TODO should it go back to inspector or totally exit?
    $("#editor").hide();

}



EditorObject.disableDrawer = function(){
        EditorObject.pointDrawer.disable();
        EditorObject.lineDrawer.disable();
        EditorObject.polygonDrawer.disable();
}



// returns geometric shape in correct format
// each single coordinate has to be inverted. Leaflet draw returns them (Lat, Long) but we need 
// them as (Long, Lat)
formatDrawingInput = function(layer, type){
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
console.log(i + ": " + firstPoint);
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
            currDrawing = "MULTILINESTRING((" + currDrawing + "))";
            break;
        case 'polygon':
            currDrawing = "POLYGON((" + currDrawing + firstPoint + "))";
            console.log(currDrawing);
    }

    return currDrawing;
}



//insert data in DB and reload map...
EditorObject.saveNewEntity = function(){

    console.log('EditorObject: savaing new entity...');

    var query       = 'create_new_entity';
    var entityName  = $("#editor-entityName").val();
    var shape       = EditorObject.currDrawing;
    var year        = Number($("#editor-valid-at").val());
    var description = $("#editor-info-input").val();
    var sources     = $("#editor-source-input").val()

	$.ajax({
                type: "GET",
                dataType: "json",
                url: settings_api_url,
                data: {'query': query,'name': entityName,'value': shape,'date': year,'description':description,'sources':sources},

                success: function(data,textStatus,jqXHR){
					console.log('EditorObject: saved '+ entityName);
					MapObject.reloadData();
                },
                error: function( jqXHR, textStatus, errorThrown ){
                	console.log('EditorObject: error saving new entity!\n' + jqXHR.responseText);
                }
            });


}
