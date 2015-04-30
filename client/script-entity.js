

EntityObject.loadedEntity   = null;
EntityObject.currName       = '';
EntityObject.currType       = '';
EntityObject.currProperties = {};


EntityObject.init = function(){

	/* GET THE HASH */

	EntityObject.loadedEntity = (hash['loadedEntity']?hash['loadedEntity']:null);

    $('#inspector').resizable({handles: 'w'});

    $('#inspector #hidebox').click(EntityObject.closeInspector);

    //Create edit button
    $("#edit-button").button({
        icons: {
            primary: "ui-icon-pencil"
        }
	
    })
    .click(function() {
        EditorObject.load(EntityObject.loadedEntity,
                          EntityObject.currName, 
                          EntityObject.currType, 
                          EntityObject.currProperties);

        //TODO: really...?
        EntityObject.loadedEntity=null;
        $('#inspector').hide();
    });

    $('#inspector #next_geom').button().click(function() { EntityObject.nextGeom(1) });
    $('#inspector #prev_geom').button().click(function() { EntityObject.nextGeom(-1) });

    $("#succ_rel").selectmenu()
      .selectmenu("option", "width", "35%")
      .selectmenu( "menuWidget" )
        .addClass( "overflow" );

}

EntityObject.nextGeom = function(dir){
    $.ajax({
        type: "GET",
        dataType: "json",
        url: settings_api_url,
        data: {'query': 'next_geometry_for_entity','id': EntityObject.loadedEntity,'date': MapObject.date,'direction': dir},
        success: function(data,textStatus,jqXHR){
            if (data.length != 0) {
	        SliderObject.setYear(data[0].date);
                MapObject.setDate(data[0].date) 
            } else { 
                alert("No further connected geometry found."); 
            }  
        },
        error: function( jqXHR, textStatus, errorThrown ){
            console.log('EntityObject: error getting features !\n'+jqXHR.responseText);
        }
    })
}

EntityObject.setHash = function(){
	hash.loadedEntity = EntityObject.loadedEntity;
	setHash();
}

EntityObject.closeInspector = function(e){
    e.stopPropagation();
    EntityObject.loadedEntity=null;
    $('#inspector').hide();
    return false;
}

EntityObject.loadEntity = function(newEntity){
	EntityObject.loadedEntity = newEntity;
	EntityObject.reloadData();
}

EntityObject.reloadData = function(){

	MapObject.setHash();

	if(EntityObject.loadedEntity == null){
		return;
	}

	//Get entity's name and type
	$.ajax({
            type: "GET",
            dataType: "json",
            url: settings_api_url,
            data: {'query': 'entity','id': EntityObject.loadedEntity},
            success: function(data,textStatus,jqXHR){
                EntityObject.currName = data[0].name;
                EntityObject.currType = data[0].entity_type_name;
                $('#inspector').show();
                $('#inspector h1').html('<span class="entity">'+data[0].name+'</span> <span class="type">('+data[0].entity_type_name+')</span>');
            },
            error: function( jqXHR, textStatus, errorThrown ){
                console.log('EntityObject: error getting features !\n'+jqXHR.responseText);
            } 
        });

	//get properties, valid at, shape, source
	$.ajax({
        type: "GET",
        dataType: "json",
        url: settings_api_url,
        data: {'query': 'properties_for_entity','id': EntityObject.loadedEntity,'date': MapObject.date},
        success: function(data,textStatus,jqXHR){
            EntityObject.currProperties = data;

            $('#inspector').show();
            $('#inspector_properties').empty();
            $.each(data,function(i,item){
                var html = '';

                    html += '<tr>';
                    html += '	<td class="key">'+item.property_name+'</td>';
                    html += '	<td class="date"><span class="bounds">'+(item.computed_date_start?item.computed_date_start:'∞')+'&#8239;&lt;&#8239;</span>'+(item.date?item.date:'∞')+'<span class="bounds">&#8239;&lt;&#8239;'+(item.computed_date_end?item.computed_date_end:"∞")+'</span></td>';
                    html += '	<td class="value">'+item.value+'</td>';
                    html += '	<td class="source">['+item.source_name+']</td>';
                    html += '</tr>';

                    $('#inspector_properties').append(html);
        	});

            //enable/disable next/prev geom buttons
            if(data[0].computed_date_start == null) 
                $("#prev_geom").button("disable")
            else $("#prev_geom").button("enable")
            if(data[0].computed_date_end == null)
                $("#next_geom").button("disable")
            else $("#next_geom").button("enable")

        },
        error: function( jqXHR, textStatus, errorThrown ){
        	console.log('EntityObject: error getting features !\n'+jqXHR.responseText);
        }
    });

    //get succession relation
    $.ajax({
        type: "GET",
        dataType: "json",
        url: settings_api_url,
        data: {'query': 'succession_relation_for_entity','id': EntityObject.loadedEntity},
        success: function(data,textStatus,jqXHR){

            //empty succ_rel
            $('#succ_rel').find('option')
                          .remove()
                          .end()
            //fill it up again....
            $.each(data,function(i,item){ 
                $('#succ_rel').append($("<option />")
                                           .val(i)
                                           .text(item.name + ' (' + item.date+ ')'));
            });

        },
        error: function( jqXHR, textStatus, errorThrown ){
            console.log('EntityObject: error getting features !\n'+jqXHR.responseText);
        }
    })

}
