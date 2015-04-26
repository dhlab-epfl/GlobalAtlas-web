EditorObject.pointDrawer   = null;
EditorObject.lineDrawer    = null;
EditorObject.polygonDrawer = null;
EditorObject.drawLayer     = null;
EditorObject.currDrawing   = "";
EditorObject.currType      = "";
EditorObject.properties    = null;
EditorObject.currEntityID  = 0;

EditorObject.init = function(){


    //render radio buttons TODO 
    $("#editor-draw-radio").buttonset();

    //select which property to edit
    $("#editor-properties")
      .selectmenu({
          select: function(event, ui){
              EditorObject.setProperty($('#editor-properties option:selected').val());
          }})
      .selectmenu("option", "width", "100%")
      .selectmenu( "menuWidget" )
        .addClass( "overflow" );

    $("#editor-type-select")
      .selectmenu()
      .selectmenu("option", "width", "100%")
      .selectmenu( "menuWidget" )
        .addClass( "overflow" );



    /* init drawing */
    EditorObject.pointDrawer = new L.Draw.Marker(MapObject.map, MapObject.drawControl);
    EditorObject.lineDrawer = new L.Draw.Polyline(MapObject.map, MapObject.drawControl);
    EditorObject.polygonDrawer = new L.Draw.Polygon(MapObject.map, MapObject.drawControl);



    MapObject.map.on('draw:drawstop', function(e) {
        $("#editor-draw-box").hide()
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
        $("#editor-draw-box").hide()
        $("#editor").show()
        $("#editor-draw-radio").buttonset("disable");


	//TODO: SAVE DRAWING TEMPORARILY...
	MapObject.map.addLayer(layer);
    });



    //Enable drawing when clicking on one of the Draw-radios
    //TODO: showing/hiding options in select doesn't work yet!
    $("#editor-dRadioPoint").click(function(){
        $("#editor").hide()
        $("#editor-draw-box").show()
        EditorObject.pointDrawer.enable();
    });
    $("#editor-dRadioLine").click(function(){
        $("#editor").hide()
        $("#editor-draw-box").show()
        EditorObject.lineDrawer.enable();
    });
    $("#editor-dRadioArea").click(function(){
        $("#editor").hide()
        $("#editor-draw-box").show()
        EditorObject.polygonDrawer.enable();
    });



    //Enable editing when clicking on edit button.
    $("#editor-edit-button").click(function(){
        EditorObject.drawLayer.editing.enable();
        $("#editor").hide()
        $("#edit-box").show()
    });



    //Time: set timeslider's time when this input changes.
    $("#editor-valid-at").change(function() {
        SliderObject.setYear($("#editor-valid-at").val())
    });



    //cancel button
    $("#editor-cancel").click(function(){
        //TODO: delete made drawing
        EditorObject.hide();
        MapObject.map.removeLayer(EditorObject.drawLayer)
    });

    //Save button
    $("#editor-save").click(function(){
        if($('#editor-entityName').val() == '') {
            alert("Please name your new entity.");
        } else {
            EditorObject.saveChanges();
            EditorObject.hide();
            MapObject.map.removeLayer(EditorObject.drawLayer)
        }
    });




    //EDIT BOX
    //Cancel: - hide editbox, show Editor 
    //        - rollback changes.
    $("#editor-edit-cancel").click(function(){
        $("#edit-box").hide()
        $("#editor").show()
        EditorObject.drawLayer.editing.disable();
    });

    //when done editing: - hide editbox, show Editor
    //                   - disable editing.
    //                   - disable properties select menu
    $("#editor-edit-done").click(function(){
        $("#edit-box").hide()
        $("#editor").show()
	$("#editor-properties").selectmenu("disable");
        EditorObject.drawLayer.editing.disable();

        //save the edited shape as a string
        EditorObject.currDrawing = formatDrawingInput(EditorObject.drawLayer, 
                                                      EditorObject.currType);
    });


    //DRAW BOX
    //Cancel: - hide drawbox, show Editor 
    //        - disable drawer.
    $("#editor-draw-cancel").click(function(){
        $("#editor-draw-box").hide()
        $("#editor").show()
        EditorObject.disableDrawer()
    });

    //when drawing is done: - hide drawbox, show Editor
    //                      - disable drawer.
    //                      - disable radio buttons
    //                      - disable properties select menu
    $("#editor-draw-done").click(function(){
        $("#editor-draw-box").hide()
        $("#editor").show()
	$("#editor-draw-radio").buttonset("disable");
	$("#editor-properties").selectmenu( "disable" );
        EditorObject.disableDrawer()
    });
}





///////////////////////////////////////////////////////////////////////////////
//                                METHODS...                                 //
///////////////////////////////////////////////////////////////////////////////


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
EditorObject.load = function(eID, eName, eType, properties){
    EditorObject.show();

    EditorObject.currEntityID = eID;
    
    //pre set values
    $('#editor-entityName').val(eName);
    EditorObject.properties = properties;

    
    //reset properties select (empty, fill properties, fill "create new property")
    $('#editor-properties').find('option')
                           .remove()
                           .end()
    for(i in properties){
        $('#editor-properties').append($("<option />")
                                   .val(i)
                                   .text("Edit " + properties[i].property_name));
    }
    $('#editor-properties').append($("<option />")
                                   .val(9999)
                                   .text("Create new Property"));
    $('#editor-properties').selectmenu("enable");
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



//takes chosen property from property array and sets Editor's fields accordingly
EditorObject.setProperty = function(i){

    //if creating new property, empty all the fields and enable drawing. 
    if(i == 9999){
        $("#editor-draw-options").show();
        $("#editor-edit-button").hide();
        EditorObject.currDrawing = ""


    } else {
        $("#editor-draw-options").hide();
        $("#editor-edit-button").show();
        EditorObject.currDrawing = EditorObject.properties[i].value;
        $("#editor-valid-at").val(EditorObject.properties[i].date);
        SliderObject.setYear(EditorObject.properties[i].date);
        $("#editor-info-input").val("");
        $("#editor-source-input").val(EditorObject.properties[i].source_name)

        //load the shape into a leaflet layer
	//split at '(' or '(('
        var typeValue = EditorObject.properties[i].value.split(/[\(]+/);
        //extract coordinates (they are separated by ,)
        var points = typeValue[1].replace(")", "").split(",");
        var newPoints = [];
        //in polygons the last coordinate == the first. leaflet doesn't like this...
        var length = points.length
        if(typeValue[0] == "POLYGON") length--;

        //leaflet coordinates are (lat, long) and not (long, lat)...
        for(i = 0; i < length; i++){
            lngLat = points[i].split(" ");
            newPoints[i] = [Number(lngLat[1]), Number(lngLat[0])];
        }

        //create draw layer and remember it's type...
        switch(typeValue[0]){
            case "POINT": 
                EditorObject.drawLayer = L.marker(newPoints[0]).addTo(MapObject.map);
                EditorObject.currType = 'marker';
                break;

            case "LINESTRING": 
                EditorObject.drawLayer = L.polyline(newPoints).addTo(MapObject.map);
                EditorObject.currType = 'polyline';
                break;

            case "POLYGON":
                EditorObject.drawLayer = L.polygon(newPoints).addTo(MapObject.map);
                EditorObject.currType = 'polygon';
                break;
 
        }

        
    }
}



//insert data in DB and reload map...
EditorObject.saveChanges = function(){

    var entityName  = $("#editor-entityName").val();
    var shape       = EditorObject.currDrawing;
    var year        = Number($("#editor-valid-at").val());
    var description = $("#editor-info-input").val();
    var sources     = $("#editor-source-input").val();

    //if a new property has been created. 
console.log($('#editor-properties option:selected').text());
    if($('#editor-properties option:selected').val() == 9999) {

        console.log("Saving new property...")
alert(shape);

        var query = 'create_new_property';
        $.ajax({
            type: "GET",
            dataType: "json",
            url: settings_api_url,
            data: {'query'        : query,
                   'entityID'     : EditorObject.currEntityID,
                   'name'         : entityName,
                   'propertyType' : 1,
                   'value'        : shape,
                   'date'         : year,
                   'description'  : description,
                   'sources'      : sources},

            success: function(data,textStatus,jqXHR){
                console.log('EditorObject: saved new property for'+ entityName);
                MapObject.reloadData();
            },
            error: function( jqXHR, textStatus, errorThrown ){
                console.log('EditorObject: error saving new property!\n' +
                jqXHR.responseText);
            }
        });

    //if a property has been changed...
    } else {
        var propertyID  = EditorObject.properties[$('#editor-properties option:selected').val()].property_id
        console.log("Saving property change...");
        var query = 'update_entity'
	$.ajax({
            type: "GET",
            dataType: "json",
            url: settings_api_url,
            data: {'query'        : query,
                   'entityID'     : EditorObject.currEntityID,
                   'name'         : entityName,
                   'propertyType' : 1,
                   'value'        : shape,
                   'date'         : year,
                   'description'  : description,
                   'sources'      : sources, 
                   'propertyID'   : propertyID},

            success: function(data,textStatus,jqXHR){
                console.log('EditorObject: saved change of '+ entityName);
                MapObject.reloadData();
            },
            error: function( jqXHR, textStatus, errorThrown ){
                console.log('EditorObject: error saving changes!\n' + jqXHR.responseText);
            }
        });
    }
}
