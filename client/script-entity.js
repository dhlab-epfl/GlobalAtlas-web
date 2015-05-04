

EntityObject.loadedEntity    = null;
EntityObject.currName        = '';
EntityObject.currType        = '';
EntityObject.currProperties  = {};
EntityObject.propertyManager = null;


EntityObject.init = function(){

    // GET THE HASH
    EntityObject.loadedEntity = (hash['loadedEntity']?hash['loadedEntity']:null);

    $('#inspector').resizable({handles: 'w'});

    $('#inspector #hidebox').click(EntityObject.closeInspector);

    EntityObject.propertyManager = new PropertyEntries('inspector_properties');

    $("#add-property").click(function() {
        EntityObject.propertyManager.createNewProperty();
    });
}

EntityObject.nextGeom = function(direction, propertyIndex){
    $.ajax({
        type: "GET",
        dataType: "json",
        url: settings_api_url,
        data: {'query'    : 'next_geometry_for_entity',
	       'id'       : EntityObject.loadedEntity,
               'date'     : MapObject.date,
	       'direction': direction, 
	       'type'     : EntityObject.currProperties[propertyIndex].property_name},
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

EntityObject.hideInspector = function(){
    $('#inspector').hide();
}

EntityObject.showInspector = function(){
    EntityObject.reloadData();
    $('#inspector').show();
}

EntityObject.closeInspector = function(e){
    e.stopPropagation();
    EntityObject.propertyManager.reset();
    EntityObject.loadedEntity = null;
    $('#inspector').hide();
    return false;
}

EntityObject.loadEntity = function(newEntity){
	EntityObject.loadedEntity = newEntity;
	EntityObject.reloadData();
}

/*
 * Makes a property entry editable.
 */
EntityObject.editProp = function(index){
    EntityObject.propertyManager.setEditable(index)
}

EntityObject.cancelEdit = function(){
    EntityObject.propertyManager.disableEdit()
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
        data: {'query': 'properties_for_entity',
               'id'   : EntityObject.loadedEntity,
               'date' : MapObject.date},
        success: function(data,textStatus,jqXHR){
            EntityObject.currProperties = data;

            $('#inspector').show();
            $('#inspector_properties').empty();

            EntityObject.propertyManager.showNew(data);

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
            //select first
            $('#succ_rel').val(0)
            $('#succ_rel').selectmenu("refresh");

        },
        error: function( jqXHR, textStatus, errorThrown ){
            console.log('EntityObject: error getting features !\n'+jqXHR.responseText);
        }
    })

}
