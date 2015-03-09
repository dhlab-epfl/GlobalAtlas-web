

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


}

