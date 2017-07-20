

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
    $('#create-button').click(EntityObject.writeNewEmptyEntityToDB)

    EntityObject.propertyManager = new PropertyEntries('inspector_properties');

    $("#add-property").click(EntityObject.propertyManager.createNewProperty);
}

EntityObject.nextGeom = function(direction, propertyIndex){
    $.ajax({
        type: "GET",
        dataType: "json",
        url: settings_api_url,
        invokedata: {  'direction' : direction,
                        'index' : propertyIndex },
        data: { 'query'    : 'next_geometry_for_entity',
                'id'        : EntityObject.loadedEntity,
                'date'      : MapObject.date,
                'direction' : direction, 
                'type'      : EntityObject.currProperties[propertyIndex].property_name},
        success: function(data,textStatus,jqXHR){
            var direction = this.invokedata.direction
            var index = this.invokedata.index
            var html = ''
            if (data.length > 0) {
                if (direction == -1) { 
                    var iconprev = "◂";
                    var iconnext = ""
                    var htmlclass = ".prev"
                } else {
                    var iconprev = "";
                    var iconnext = "▸";
                    var htmlclass = ".next"
                }
                html = '<button onclick="SliderObject.setYear('+data[0].date+'); MapObject.setDate('+data[0].date+')">'+iconprev+data[0].date+iconnext+'</button>';
            } 
            $('#propEntry'+ index +' '+htmlclass).html(html)
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
    $('#create-button-container').hide();
    $('#inspector').show();
}

EntityObject.closeInspector = function(){
    EntityObject.propertyManager.reset();
    EntityObject.loadedEntity = null;
    $('#inspector').hide();
    $('#create-button-container').show();
    return false;
}

EntityObject.toggleEditableTitle = function(){
    if($('#edit-entity-title-button').length == 1) { // Make title editable
        EntityObject.showEditableTitle()
    } else { // "Cancel" or "Save" button was pushed
        EntityObject.reloadData();
    }
}

EntityObject.showEditableTitle = function() {
    var editableTitle = '';
    editableTitle += '<h1>';
    editableTitle += '<input id="entity-name" type="text" value="'+ EntityObject.currName +'"/>';
    editableTitle += '<select id="entity-type"/>';
    editableTitle += '<button onclick="EntityObject.deleteEntity();" title="Delete" class="entity-button">\
                          <img src="images/delete.png" width="16" height="16">\
                      </button>';
    editableTitle += '<button onclick="EntityObject.toggleEditableTitle();" title="Cancel" class="entity-button">\
                          <img src="images/cancel.png" width="16" height="16">\
                      </button>';
    editableTitle += '<button onclick="EntityObject.writeTitleToDB();" title="Save" class="entity-button">\
                          <img src="images/save.png" width="16" height="16">\
                      </button>';
    editableTitle += '</h1>';
    $('#entity-title-container').html(editableTitle);
    EntityObject.showEntityTypesSelectMenu();
}

EntityObject.deleteEntity = function() {
    $.ajax({
        type: "GET",
        dataType: "json",
        url: settings_api_url,
        data: {'query': 'delete_entity',
                'entityID': EntityObject.loadedEntity },
        success: function(types,textStatus,jqXHR){
            EntityObject.closeInspector();
            MapObject.reloadData();
        },
        error: function( jqXHR, textStatus, errorThrown ){
            console.log('EntityObject: error deleting entity! \n'+jqXHR.responseText);
        }
    });
}

EntityObject.showEntityTypesSelectMenu = function() { // Populate the enity type select menu
    $.ajax({
        type: "GET",
        dataType: "json",
        url: settings_api_url,
        data: {'query': 'get_entity_types'},
        success: function(types,textStatus,jqXHR){
            $.each(types,function(i,item){
                $('#entity-type').append($("<option />")
                    .val(item.id).text(item.name));
            });
            // Set current value selected
            $("#entity-type option").filter(function() {
                return $(this).text() == EntityObject.currType;
            }).attr('selected', true);
        },
        error: function( jqXHR, textStatus, errorThrown ){
            console.log('EntityObject: error getting entity types! \n'+jqXHR.responseText);
        }
    });
}

EntityObject.writeTitleToDB = function(){
    $.ajax({
        type: "GET",
        dataType: "json",
        url: settings_api_url,
        data: { 'query': 'update_entity',
                'id': EntityObject.loadedEntity,
                'name': $('#entity-name').val(),
                'type': $('#entity-type').val()},
        success: function(data,textStatus,jqXHR){
            EntityObject.toggleEditableTitle();
        },
        error: function( jqXHR, textStatus, errorThrown ){
            console.log('EntityObject: error getting features !\n'+jqXHR.responseText);
        }
    });
}

EntityObject.loadEntity = function(newEntity){
    EntityObject.loadedEntity = newEntity;
    EntityObject.reloadData();
}

EntityObject.writeNewEmptyEntityToDB = function() {
    $.ajax({
        type: "GET",
        dataType: "json",
        url: settings_api_url,
        data: {'query': 'create_new_entity','name': '', 'entity_type': ''},
        success: function(data,textStatus,jqXHR){
            EntityObject.loadEntity(data[0].id);
        },
        error: function( jqXHR, textStatus, errorThrown ){
            console.log('EntityObject: error getting features !\n'+jqXHR.responseText);
        }
    });
}

/*
 * Makes a property entry editable.
 */
EntityObject.editProp = function(index){
    EntityObject.propertyManager.setEditable(index)
}

EntityObject.cancelEdit = function(){
    EntityObject.propertyManager.cancelEdit()
}

EntityObject.reloadData = function(){
    MapObject.setHash();
    if(EntityObject.loadedEntity == null){ return; }
    EntityObject.showInspector();
    EntityObject.getInspectorTitle();
    EntityObject.getPropertyTable();
}

EntityObject.getInspectorTitle = function() {
    $.ajax({
        type: "GET",
        dataType: "json",
        url: settings_api_url,
        data: {'query': 'entity','id': EntityObject.loadedEntity},
        success: function(data,textStatus,jqXHR){
            EntityObject.currName = data[0].name;
            EntityObject.currType = data[0].entity_type_name;
            EntityObject.showInspectorTitle(data[0].name, data[0].entity_type_name)
        },
        error: function( jqXHR, textStatus, errorThrown ){
            console.log('EntityObject: error getting features !\n'+jqXHR.responseText);
        } 
    });
}

EntityObject.showInspectorTitle = function() {
    entityTitle = '';
    entityTitle += '<h1>';
    entityTitle += '<span class="entity">'+EntityObject.currName+'</span> ';
    entityTitle += '<span class="type">('+EntityObject.currType+')</span>';
    entityTitle += '<button id="edit-entity-title-button"\
                            onclick="EntityObject.toggleEditableTitle();"\
                            title="Edit Entity"\
                            class="entity-button">\
                        <img src="images/edit.png" width="16" height="16">\
                    </button>';
    entityTitle += '</h1>';
    $('#inspector #entity-title-container').html(entityTitle);
}

EntityObject.getPropertyTable = function() {
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
            EntityObject.propertyManager.showNew(data);
        },
        error: function( jqXHR, textStatus, errorThrown ){
            console.log('EntityObject: error getting features !\n'+jqXHR.responseText);
        }
    });
}
