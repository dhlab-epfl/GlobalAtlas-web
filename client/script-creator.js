CreatorObject.pointDrawer   = null;
CreatorObject.lineDrawer    = null;
CreatorObject.polygonDrawer = null;
CreatorObject.currLayer     = null;
CreatorObject.currDrawing   = "";

CreatorObject.init = function(){
    
    //Create button
    $("#create-button").button({
        icons: {
            primary: "ui-icon-plusthick"
        }
	
    })
    .click(function() {
        CreatorObject.show();
    });



    //render radio buttons 
    $("#draw-radio").buttonset();

    $("#type-select")
      .selectmenu()
      .selectmenu("option", "width", "100%")
      .selectmenu( "menuWidget" )
        .addClass( "overflow" );



    /* init drawing */
    CreatorObject.pointDrawer = new L.Draw.Marker(MapObject.map, MapObject.drawControl);
    CreatorObject.lineDrawer = new L.Draw.Polyline(MapObject.map, MapObject.drawControl);
    CreatorObject.polygonDrawer = new L.Draw.Polygon(MapObject.map, MapObject.drawControl);

    //when starting drawing
    //TODO can we erase this?
    MapObject.map.on('draw:drawstart', function(e) {
        CreatorObject.currLayer = e.layer
    });



    //executed when a drawing is done...
    //      - create string for sending it to DB
    //      - disable radio buttons
    MapObject.map.on('draw:created', function(e) {
        var type = e.layerType,
            layer = e.layer;

        //get the drawing's correct format 
        CreatorObject.currDrawing = formatDrawingInput(layer, type);


        //go back to creator and disable the radio buttons
        $("#draw-box").hide()
        $("#creator").show()
        $("#draw-radio").buttonset("disable");


	//TODO: SAVE DRAWING TEMPORARILY...
	MapObject.map.addLayer(layer);
    });



    // when an existing drawing is edited...
    MapObject.map.on('draw:edited', function(e){
	alert("editing.")
        $("#draw-radio").prop("disabled", true);
        $("[name='dRadio']").button("refresh");
    });



    //Enable drawing when clicking on one of the Draw-radios
    //TODO: showing/hiding options in select doesn't work yet!
    $("#dRadioPoint").click(function(){
	$("#draw-radio").buttonset("disable");
        $("#creator").hide()
        $("#draw-box").show()
        CreatorObject.pointDrawer.enable();
    });
    $("#dRadioLine").click(function(){
	$("#draw-radio").buttonset("disable");
        $("#creator").hide()
        $("#draw-box").show()
        CreatorObject.lineDrawer.enable();
    });
    $("#dRadioArea").click(function(){
        $("#creator").hide()
        $("#draw-box").show()
        CreatorObject.polygonDrawer.enable();
    });



    //Time: set timeslider's time when this input changes.
    $("#valid-at").change(function() {
        SliderObject.setYear($("#valid-at").val())
    });



    //Create button
    $("#create-cancel").click(function(){
        //TODO: delete made drawing
        CreatorObject.hide();
    });

    //Save button
    $("#create-save").click(function(){
        CreatorObject.saveNewEntity();
        CreatorObject.hide();
    });




    //DRAW BOX

    //Cancel: - hide drawbox, show creator 
    //        - disable drawer.
    $("#draw-cancel").click(function(){
        $("#draw-box").hide()
        $("#creator").show()
        CreatorObject.disableDrawer()
    });
    //when drawing is saved: - hide drawbox, show creator
    //                       - disable drawer.
    //                       - disable radio buttons
    $("#draw-done").click(function(){
        $("#draw-box").hide()
        $("#creator").show()
	$("#draw-radio").buttonset("disable");
        CreatorObject.disableDrawer()
        //TODO save current drawing somehow...
    });
}


// show creator and reset all its fields. 
CreatorObject.show = function(){
    $("#creator").show();
    $("#create-button").hide();

    //set "valit at" value
    $("#valid-at").val($("#slider-ui").slider("option", "value"));

    //enable and uncheck radio buttons
    $("#draw-radio").buttonset("enable");
    $("[name='dRadio']").attr("checked", false);
    $("[name='dRadio']").button("refresh");

    //empty textareas
    $(".input-text").val("");
    $("#entityName").val("");
}



CreatorObject.hide = function(){
    //TODO confirm message
    $("#creator").hide();
    $("#create-button").show();

}



CreatorObject.disableDrawer = function(){
        CreatorObject.pointDrawer.disable();
        CreatorObject.lineDrawer.disable();
        CreatorObject.polygonDrawer.disable();
}



// returns geometric shape in correct format
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
            currDrawing = "POLYGON((" + currDrawing + "))";
    }

    return currDrawing;
}



//insert data in DB and reload map...
CreatorObject.saveNewEntity = function(){

    console.log('CreatorObject: savaing new entity...');

    var query       = 'create_new_entity';
    var entityName  = $("#entityName").val();
    var shape       = CreatorObject.currDrawing;
    var year        = Number($("#valid-at").val());
    var description = $("#info-input").val();
    var sources     = $("#source-input").val()

	$.ajax({
                type: "GET",
                dataType: "json",
                url: settings_api_url,
                data: {'query': query,'name': entityName,'value': shape,'date': year,'info':info,'sources':sources},

                success: function(data,textStatus,jqXHR){
					console.log('CreatorObject: saved '+ entityName);
					MapObject.reloadData();
                },
                error: function( jqXHR, textStatus, errorThrown ){
                	console.log('CreatorObject: error saving new entity!\n' + jqXHR.responseText);
                }
            });


}
