SliderObject.init = function(){	
    $( "#slider-ui" ).slider({
        orientation: "vertical",
        min: 1000,
        max: 2015,
        slide: function( event, ui ) {
            $( ".ui-slider-handle" ).html( ui.value );
            $("#spinner-ui").spinner("value", ui.value);
        },
        stop: function(event, ui){
            MapObject.setDate(ui.value);
        }
    });
    $( ".ui-slider-handle" ).html(MapObject.date);
    $( "#slider-ui" ).slider("option", "value", MapObject.date);
    MapObject.setDate( MapObject.date );

	
    $("#slider-max").change(function(){
        $("#slider-ui").slider('option',{max: parseInt($("#slider-max").val())});
    });
    $("#slider-min").change(function(){
        $("#slider-ui").slider('option',{min: parseInt($("#slider-min").val())});
    });


    $("#spinner-ui").spinner({
        min: 0,
        max: 2015,
        numberformat: "n",
        step: 1,
	//on change, ui is empty. on spin it works.
	change: function(event, ui){ SliderObject.setYear($("#spinner-ui").val())},
        spin:   function(event, ui){ SliderObject.setYear(ui.value)}
    });


}



/*
 * set slider (adapt min and max value)
 */
SliderObject.setSliderYear = function(y){
    //convert everything to numbers... otherwise not comparable!
    var min = Number($("#slider-min").val())
    var max = Number($("#slider-max").val())
    var x   = Number(y)

    if(min > x) {
        $("#slider-min").val(x);
        $("#slider-ui").slider("option", "min", y);
    } else if (max < x) {
        $("#slider-max").val(x);
        $("#slider-ui").slider("option", "max", x);
    }
    $( "#slider-ui" ).slider( "value", x);
    $( ".ui-slider-handle" ).html(x);
    MapObject.setDate(x);
}

/*
 * set slider's AND spinner's AND creator's year
 */
SliderObject.setYear = function(y){
    var x = Number(y)
    SliderObject.setSliderYear(x);
    $("#spinner-ui").spinner("value", x);
    $("#valid-at").val(x);
}
