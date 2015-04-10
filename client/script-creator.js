CreatorObject.init = function(){
    $("#create-button").button({
        icons: {
            primary: "ui-icon-plusthick"
        }
	
    })
    .click(function() {
        CreatorObject.show();
        alert("Creator");
    });



    $(function() {
        $("#draw-radio").buttonset();

        $( "#number" )
          .selectmenu()
          .selectmenu( "menuWidget" )
            .addClass( "overflow" );
    });

}

CreatorObject.show = function(){
    $("#creator").show()
    $("#create-button").hide()
}
