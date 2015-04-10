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

    MapObject.map.on('draw:created', function(e)  {
    var type = e.layerType,
        layer = e.layer;

    // Do whatever you want with the layer.
    // e.type will be the type of layer that has been drawn (polyline, marker, polygon, rectangle, circle)
    // E.g. add it to the map
    layer.addTo(map);
});


    //Draw
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
