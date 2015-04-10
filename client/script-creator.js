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
