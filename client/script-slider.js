SliderObject.init = function(){ 
    $( "#slider-ui" ).slider({
        orientation: "vertical",
        min: 1000,
        max: 2015,
        slide: function( event, ui ) {
            $( ".ui-slider-handle" ).html( ui.value );
        },
        stop: function(event, ui){
            MapObject.setDate(ui.value);
            SliderObject.setYear(ui.value);
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
        // On change, ui is empty. on spin it works
        change: function(event, ui){ SliderObject.setYear($("#spinner-ui").val())},
        // On spin, ui.value is the currently selected year
        spin:   function(event, ui){ SliderObject.setYear(ui.value)}
    });
}

/*
 * Move slider's and spinner's year to y (will be reflected in GUI)
 */
SliderObject.setYear = function(y){
    var x = Number(y)
    var min = Number($("#slider-min").val())
    var max = Number($("#slider-max").val())

    // Move the spinner's year to y
    $("#spinner-ui").spinner("value", x);

    // Adjust sliders maximum and minimum values if necessary
    if(min > x) {
        $("#slider-min").val(x);
        $("#slider-ui").slider("option", "min", y);
    } else if (max < x) {
        $("#slider-max").val(x);
        $("#slider-ui").slider("option", "max", x);
    }

    // Move the slider to year y
    $( "#slider-ui" ).slider( "value", x);
    $( ".ui-slider-handle" ).html(x);
    MapObject.setDate(x);
}