

SliderObject.init = function(){

    $( "#slider-ui" ).slider({
        orientation: "vertical",
        min: 1000,
        max: 2015,
        slide: function( event, ui ) {
            $( ".ui-slider-handle" ).html( ui.value );
            $( "#spinner-ui").spinner("value", ui.value);
        },
        stop: function(event, ui){
            MapObject.setDate(ui.value);
        }
    });
    $( ".ui-slider-handle" ).html( MapObject.date );
    MapObject.setDate( MapObject.date );

	
    $("#slider-max").change(function(){
        $("#slider-ui").slider('option',{max: parseInt($("#slider-max").val())});
    });
    $("#slider-min").change(function(){
        $("#slider-ui").slider('option',{min: parseInt($("#slider-min").val())});
    });


    $( "#spinner-ui" ).spinner({
        min: 1000,
        max: 2015,
        numberformat: "n",
        step: 1,
	change: function(event, ui){ SliderObject.setYear(event, ui)},
        spin:   function(event, ui){ SliderObject.setYear(event, ui)}
    });


}

SliderObject.setYear = function(event, ui){
    if($("#slider-min").val() > ui.value)
        $("#slider-min").val(ui.value);
    else if($("#slider-max").val() < ui.value)
        $("#slider-max").val(ui.value);
    $( "#slider-ui" ).slider( "value", ui.value );
    $( ".ui-slider-handle" ).html( ui.value );
    MapObject.setDate(ui.value);
}
