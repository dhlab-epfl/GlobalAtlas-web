var pointDrawer = null;
var lineDrawer = null;
var polygonDrawer = null;
var currLayer = null;
var currDrawing = null;

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
    pointDrawer = new L.Draw.Marker(MapObject.map, MapObject.drawControl);
    lineDrawer = new L.Draw.Polyline(MapObject.map, MapObject.drawControl);
    polygonDrawer = new L.Draw.Polygon(MapObject.map, MapObject.drawControl);

    //when starting drawing
    MapObject.map.on('draw:drawstart', function(e) {
        currLayer = e.layer
    });



    //executed when a drawing is done...
    //      - create string for sending it to DB
    //      - disable radio buttons
    MapObject.map.on('draw:created', function(e) {
        var type = e.layerType,
            layer = e.layer;

        //get the drawing's correct format 
        currDrawing = formatDrawingInput(layer, type);


        //go back to creator and disable the radio buttons
        $("#draw-box").hide()
        $("#creator").show()
        $("#draw-radio").buttonset("disable");


	//TODO: SAVE DRAWING TEMPORARILY...
	MapObject.map.addLayer(layer);
    });



    // when an existing drawing is edited...
    /*MapObject.map.on('draw:edited', function(e){
	alert("editing.")
        $("#draw-radio").prop("disabled", true);
        $("[name='dRadio']").button("refresh");
    });*/



    //Enable drawing when clicking on one of the Draw-radios
    //TODO: showing/hiding options in select doesn't work yet!
    $("#dRadioPoint").click(function(){
	$("#draw-radio").buttonset("disable");
        $("#creator").hide()
        $("#draw-box").show()
        pointDrawer.enable();
    });
    $("#dRadioLine").click(function(){
	$("#draw-radio").buttonset("disable");
        $("#creator").hide()
        $("#draw-box").show()
        lineDrawer.enable();
    });
    $("#dRadioArea").click(function(){
        $("#creator").hide()
        $("#draw-box").show()
        polygonDrawer.enable();
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
        CreatorObject.hide();
    });




    //DRAW BOX

    //Cancel: - hide drawbox, show creator 
    //        - disable drawer.
    $("#draw-cancel").click(function(){
        $("#draw-box").hide()
        $("#creator").show()
        CreatorObject.disableDrawer()
        //TODO: DISABLE DRAWING
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
    $(".info-input").val("");
}



CreatorObject.hide = function(){
    //TODO confirm message
    $("#creator").hide();
    $("#create-button").show();

}



CreatorObject.disableDrawer = function(){
        pointDrawer.disable();
        lineDrawer.disable();
        polygonDrawer.disable();
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
            currDrawing = "LINESTRING(" + currDrawing + ")";
            break;
        case 'polygon':
            currDrawing = "MULTIPOLYGON(((" + currDrawing + ")))";
    }

    return currDrawing;
}
