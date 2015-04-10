

SliderObject.init = function(){
    $( "#slider-ui" ).slider({
        orientation: "vertical",
        min: 0,
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
        min: 1000,
        max: 2015,
        numberformat: "n",
        step: 1,
	change: function(event, ui){ SliderObject.setSliderYear(ui.value)},
        spin:   function(event, ui){ SliderObject.setSliderYear(ui.value)}
    });


}

/*
 * set slider
 */
SliderObject.setSliderYear = function(y){
    if($("#slider-min").val() > y)
        $("#slider-min").val(y);
    else if($("#slider-max").val() < y)
        $("#slider-max").val(y);
    $( "#slider-ui" ).slider( "value", y);
    $( ".ui-slider-handle" ).html(y);
    MapObject.setDate(y);
}

/*
 * set slider's AND spinner's year
 */
SliderObject.setYear = function(y){
    SliderObject.setSliderYear(y);
    $("#spinner-ui").spinner("value", y);
}
