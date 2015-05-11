

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

    $('#create-button').click(EntityObject.newEntity)


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

EntityObject.closeInspector = function(e){
    e.stopPropagation();
    EntityObject.propertyManager.reset();
    EntityObject.loadedEntity = null;
    $('#inspector').hide();
    $('#create-button-container').show();
    return false;
}

EntityObject.toggleEditableTitle = function(){
    if($('#edit-entity-title-button').length == 1) {
        var name = $('#entity-title .entity').html();
        var type = $('#entity-title select.type option:selected').val();
        $('#entity-title').data('originalName', name)
        $('#entity-title').data('originalType', type)
        var editableTitle = '';
        editableTitle += '<input id="entity-name" type="text" value="'+ name +'"/>';
        editableTitle += '<select id="entity-type"/>';
        editableTitle += '<button onclick="EntityObject.toggleEditableTitle();">Cancel</button>';
        editableTitle += '<button onclick="EntityObject.setName(); EntityObject.setType();">Save</button>';
        $('#entity-title').html(editableTitle);
    } else {
        var name = $('#entity-title').data('originalName');
        var type = $('#entity-title').data('originalType');
        var title = '';
        title += '<span class="entity">' + name + '</span> (';
        title += '<span class="type">' + type + '</span>)';
        title += '<button id="edit-entity-title-button" onclick="EntityObject.toggleEditableTitle();">Edit</button>'
        $('#entity-title').html(title);
        $('#entity-title').removeData();
    }
}

EntityObject.loadEntity = function(newEntity){
    EntityObject.loadedEntity = newEntity;
    EntityObject.reloadData();
}

EntityObject.newEntity = function() {
    $.ajax({
            type: "GET",
            dataType: "json",
            url: settings_api_url,
            data: {'query': 'create_new_entity','name': '', 'entity_type': ''},
            success: function(data,textStatus,jqXHR){
                EntityObject.loadedEntity = data[0].id;
                EntityObject.showInspector();
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
                EntityObject.showInspector();
                entityTitle = '';
                entityTitle += '<span class="entity">'+data[0].name+'</span>';
                entityTitle += '<span class="type">('+data[0].entity_type_name+')</span>';
                entityTitle += '<button id="edit-entity-title-button" onclick="EntityObject.toggleEditableTitle();">Edit</button>';
                $('#inspector h1').html(entityTitle);
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
