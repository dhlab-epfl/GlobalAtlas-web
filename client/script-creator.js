var pointDrawer = null;
var lineDrawer = null;
var polygonDrawer = null;

CreatorObject.init = function(){
    $("#create-button").button({
        icons: {
            primary: "ui-icon-plusthick"
        }
	
    })
    .click(function() {
        CreatorObject.show();
    });


    //render radio buttons 
    $(function() {
        $("#draw-radio").buttonset();

        $("#number")
          .selectmenu()
          .selectmenu("option", "width", "100%")
          .selectmenu( "menuWidget" )
            .addClass( "overflow" );

        $("#create-cancel").click(function(){
            CreatorObject.hide();
        });

    });


    /* init drawing */
    pointDrawer = new L.Draw.Marker(MapObject.map, MapObject.drawControl);
    lineDrawer = new L.Draw.Polyline(MapObject.map, MapObject.drawControl);
    polygonDrawer = new L.Draw.Polygon(MapObject.map, MapObject.drawControl);


    // This function is executed when a drawing is done. 
    MapObject.map.on('draw:created', function(e)  {
        var type = e.layerType,
            layer = e.layer;


        //possible draw types are: polyline, marker, polygon, rectangle, circle. We currently use
        //marker, polyline and polygon...
        //TODO: - create string for sending it to DB
        //      - disable radio buttons, etc...
        switch(type){
            case 'marker': 
                //do sth
                break;

            case 'polyline': 
                //do sth
                break;

            case 'polygon': 
                //do sth
        }


	//TODO: this somehow doesn't work...
	MapObject.map.addLayer(layer);
        //layer.addTo(map);
    });

    // when an existing drawing is edited...
    MapObject.map.on('draw:edited', function(e){
	alert("editing.")
        $("#draw-radio").prop("disabled", true);
        $("[name='dRadio']").button("refresh");
    });



    //Enable drawing when clicking on one of the Draw-radios
    $("#dRadioPoint").click(function(){
        pointDrawer.enable();
    });
    $("#dRadioLine").click(function(){
        lineDrawer.enable();
    });
    $("#dRadioArea").click(function(){
        polygonDrawer.enable();
    });


    //Time
    $("#valid-at").change(function() {
        SliderObject.setYear($("#valid-at").val())
    });

}

CreatorObject.show = function(){
    $("#creator").show();
    $("#create-button").hide();

    //set "valit at" value
    $("#valid-at").val($("#slider-ui").slider("option", "value"));

    //uncheck radio buttons
    $("[name='dRadio']").attr("checked", false);
    $("[name='dRadio']").button("refresh");
}

CreatorObject.hide = function(){
    /*TODO confirm message */
    $("#creator").hide();
    $("#create-button").show();

}
