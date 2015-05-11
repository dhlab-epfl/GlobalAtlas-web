/*
 * PropertyEntries keeps track of the currently displayed properties. It produces the HTML code 
 * for feeding the properties table in the inspector. This allows to easily modify the form of a
 * property table entry. 
 */
function PropertyEntries(tableID){
    this.properties   = [];
    this.tableID      = '#' + tableID;
    this.currEditable = -1;
    this.drawer       = new Drawer();
    this.creatingProp = false;
};

/*
 * Shows properties in array
 */
PropertyEntries.prototype.showNew = function(properties){
    this.properties = properties;
    this.currEditable = -1;

    //when clicking an entity on map while drawing, inspector is reloaded. Drawing needs to be 
    //disabled in this case.
    this.drawer.disable();

    $('.editButton').removeAttr('disabled');
    $("#add-property").removeAttr('disabled');
    
    //Creates HTML code for a property entry. Saves it in array. 
    // --> first create empty entry, then fill it with this.setEntry.
    for (i in properties){
        $(this.tableID).append('<tr id="propEntry'+ i +'"/>')
        this.putUneditableEntryIntoRow(i);
    }
}


/*
 * Sets a given entry in the table uneditable.
 */
PropertyEntries.prototype.putUneditableEntryIntoRow = function(index) {
    var property = this.properties[index];
    var name     =  property.property_name;
    var date     = (property.date?property.date:'∞');
    var value    =  property.value;
    var source   =  property.source_name;


//TODO: if type == succession_relation, make it clickable!
    var entry = '\
    <tr id="propEntry'+ index +'">\
        <td class="key">'+ name +'</td>\
        <td class="date">\
        <span class="prev"></span> ' + date + ' <span class="next"></span>\
        </td>\
        <td class="value">'+ value +'</td>\
        <td class="source">['+ source +']</td>\
        <td>\
            <button class="editButton" onclick="EntityObject.editProp('+ index +');">✎</button>\
        </td>\
    </tr>';

    // Fill the previous and next fields
    EntityObject.nextGeom(-1, index)
    EntityObject.nextGeom(1, index)

    $('#propEntry'+index).replaceWith(entry);
}



/*
 * Insert an editable row into the table. 
 */
PropertyEntries.prototype.putEditableEntryIntoRow = function(index){
    this.currEditable = index;

    var property = this.properties[index];
    var type     =  property.property_name;
    var start    = (property.computed_date_start?property.computed_date_start:'∞');
    var date     = (property.date?property.date:'∞');
    var end      = (property.computed_date_end?property.computed_date_end:"∞");
    var value    =  property.value;
    var source   =  property.source_name;

    var editableEntry = '\
    <tr id="propEntry'+ index +'">\
        <td colspan="5">\
            <div class="editable-property-entry">\
                <ul>\
                    <li>Type: <select id="propType"/></li>\
                    <li>Edit: <div id="propValue" style="display:inline">'+ value +'</div></li>\
                    <li>Valid at: <input id="valid-at" type="number" value="'+ date +'"/></li>\
                    <li>Start of validity:<input id="startCheck" type="checkbox" /></li>\
                    <li>Source: <input id="source" type="text" value="'+ source +'" /></li>\
                </ul>\
                <div style="float:right">\
                    <button onclick="EntityObject.cancelEdit();">Cancel</button>\
                    <button onclick="EntityObject.propertyManager.saveProperty('+ index +');">Save</button>\
                </div>\
            </div>\
        </td>\
    </tr>';

    $('#propEntry'+index).replaceWith(editableEntry);

    //set startCheck checked if date is start date
    if(property.interpolation == 'start'){
        $("#startCheck").prop('checked', true);
    }

    //setup property type select if in creating mode. Set current property's type otherwise
    if(this.creatingProp){
        this.populateSelect('propType', index);
    } else {
        $('#propType').replaceWith(type);
        //propertyManager can only be reached so complicatedly from inside listener:
        EntityObject.propertyManager.setValueEditTool(type, index);
    }
}


/*
 * Set an entry editable
 */
PropertyEntries.prototype.setEditable = function(index){
    if(this.currEditable < 0){
        this.currEditable = index;
        this.putEditableEntryIntoRow(index)

        //only one property can be edited at a time. 
        $('.editButton').attr("disabled","disaled")
        $("#add-property").attr("disabled","disaled")
    } 
}


/*
 * Set the currently editable entry (incl. its geometry if necessary) non-editable. 
 */
PropertyEntries.prototype.cancelEdit = function(){
    if(this.currEditable >= 0){
        this.putUneditableEntryIntoRow(this.currEditable)

        //remove empty property.
        if(this.creatingProp){
            var toRemove = this.properties.length - 1;
            this.properties.pop();
            $('#propEntry'+toRemove).replaceWith('');
        }

        //not in creating phase anymore...
        this.creatingProp = false;

        //allow to edit all the props and add a new one
        $('.editButton').removeAttr('disabled');
        $("#add-property").removeAttr('disabled');

        this.drawer.disable();
        
        this.currEditable = -1;
    }
}


/*
 * This method gets called when edit or new property gets saved.
 */
PropertyEntries.prototype.saveProperty = function(){

    var entityID   = Number(EntityObject.loadedEntity);
    var propertyID = this.properties[this.currEditable].property_id;
    var type       = Number($("#propType option:selected").val());
    var value      = '';
    var year       = Number($("#valid-at").val());
    var isStart    = $("#startCheck").is(":checked")?'start':'default';
    var source     = $("#source").val();

    if(this.creatingProp){
        if($("#propType option:selected").text() == 'geom'){
            value = this.drawer.currDrawing;
        } else {
            value = $("#setValue").val()
        }
    } else {
        value = this.drawer.getEditedGeom()
        if(value == ''){
            value = $("#setValue").val()
        } else {
        }
    }


    //saving property (create new or update existing)
    if(this.creatingProp){
        console.log('Property Manager: Savaing new property...');
        $.ajax({
            type: "GET",
            dataType: "json",
            url: settings_api_url,
            data: {'query'         : 'create_new_property',
                   'entityID'      : entityID,
                   'propertyType'  : type,
                   'value'         : value,
                   'date'          : year,
                   'interpolation' : isStart,
                   'source'        : source},

            success: function(data,textStatus,jqXHR){
                console.log("Property Manager: Source '"+ source +"' created.");
                MapObject.reloadData();
            },
            error: function( jqXHR, textStatus, errorThrown ){
                console.log('Property Manager: Error saving new source!\n' + jqXHR.responseText);
            }
        });

    } else {
        console.log("Property Manager: Saving property change..." + propertyID);
	$.ajax({
            type: "GET",
            dataType: "json",
            url: settings_api_url,
            data: {'query'         : 'update_property',
                   'propertyID'    : propertyID,
                   'date'          : year,
                   'interpolation' : isStart,
                   'value'         : value,
                   'source'        : source},

            success: function(data,textStatus,jqXHR){
                console.log('Property Manager: Saved change of property #'+ propertyID);
                MapObject.reloadData();
            },
            error: function( jqXHR, textStatus, errorThrown ){
                console.log('Property Manager: Error saving changes!\n' + jqXHR.responseText);
            }
        });
    }


    //calculate start/end date of created/edited property
    $.ajax({
        type: "GET",
        dataType: "json",
        url: settings_api_url,
        data: {'query'         : 'calculate_dates',
               'entityID'      : entityID,
               'propertyID'    : propertyID},

        success: function(data,textStatus,jqXHR){
            console.log("Property Manager: Start and end dates of calculated.");
        },
        error: function( jqXHR, textStatus, errorThrown ){
            console.log('Property Manager: Error calculating dates!\n' + jqXHR.responseText);
        }
    });



    //set row uneditable
    this.putUneditableEntryIntoRow(this.currEditable)

    //not in creating phase anymore...
    this.creatingProp = false;

    //allow to edit all the props and add a new one
    $('.editButton').removeAttr('disabled');
    $("#add-property").removeAttr('disabled');

    this.drawer.disable();
        
    this.currEditable = -1;
}


/*
 * This method needs to be called when inspector is closed.
 */
PropertyEntries.prototype.reset = function(){
    this.cancelEdit();
}


/*
 * Create new empty property (only locally) and set it editable.
 */
PropertyEntries.prototype.createNewProperty = function(){
    //indicate that we're in the property creating phase
    this.creatingProp = true;

    //create empty property
    var newProp = {property_name       : 'geom',
                   computed_date_start : '',
                   date                : '',
                   computed_date_end   : '',
                   value               : '',
                   source_name         : ''};
    this.properties.push(newProp);

    var index = this.properties.length - 1;

    //set it editable (first create empty table row, then replace it by editable row)
    $(this.tableID).append('<tr id="propEntry'+ index +'"/>')
    this.setEditable(index);
}


/*
 * Populates a table entry's select. 
 */
PropertyEntries.prototype.populateSelect = function(selectID, index){
    switch(selectID){
        case 'propType': 
            var standardType = 'geom';
            $.ajax({
                type: "GET",
                dataType: "json",
                url: settings_api_url,
                data: {'query': 'get_property_types'},
                success: function(types,textStatus,jqXHR){
                    $.each(types,function(i,item){ 
                        $('#propType').append($("<option />")
                                          .val(item.id).text(item.name));
                    });

                    //set current value selected
                    $("#propType option").filter(function() {
                        return $(this).text() == standardType; 
                    }).attr('selected', true);
                },
                error: function( jqXHR, textStatus, errorThrown ){
                    console.log('EntityObject: error getting property types! \n'+jqXHR.responseText);
                } 
            });
        break;
    }
    //set correct edit tool at the beginning
    this.setValueEditTool(standardType, index);

    //Set according edit tool when other type is selected.
    $("#propType").change(function(){
        //propertyManager can only be reached so complicatedly from inside listener:
        EntityObject.propertyManager
            .setValueEditTool($(this).find("option:selected").text(), index);
    });
};	



/*
 * Sets the property value edit tool according to chosen property type.
 */
PropertyEntries.prototype.setValueEditTool = function(type, index){
    var tool = '';

    switch(type) {
        case 'geom': 
            if(this.creatingProp) {
                tool = '<form style="display: inline">\
                            <div id="draw-radio" style="display: inline">\
                                <input type="radio" id="dRadioPoint" name="dRadio">\
                                <label for="dRadioPoint">Point</label>\
                                <input type="radio" id="dRadioLine" name="dRadio">\
                                <label for="dRadioLine">Line</label>\
                                <input type="radio" id="dRadioArea" name="dRadio">\
                                <label for="dRadioArea">Area</label>\
                            </div>\
                        </form>';
            } else {
                tool = '<button id="editGeom">Edit Geometry</button>';
            }
            break;


        //TODO: We're concentrating on borders, so this part here is rather dummy ;-)
        case 'succession_relation':
        case 'height':
            var val = 0;
            if(!isNaN(this.properties[index].value))
                val = parseFloat(this.properties[index].value);
            tool += '<input id="setValue" type="number" value="'+ val +'"/>'
            break;


        default:
            tool += '<input id="setValue" type="text" value="'+this.properties[index].value+'"/>'
            break;

    }

    // insert tool into HTML
    $("#propValue").empty().append(tool);

    // now that tool is loaded, the appropriate listeners need to be instantiated and elements
    // rendered correctly.
    if(type == 'geom'){
        if(this.creatingProp) {
            $("#draw-radio").buttonset()
            $("#draw-radio").find('span.ui-button-text').addClass('drawRadioStyle');

            var drawType = '';

            //Enable drawing when clicking on one of the Draw-radios
            $("#dRadioPoint").click(function(){
                $("#draw-radio").buttonset("disable");
                EntityObject.propertyManager.drawer.createGeometry('marker');
            });
            $("#dRadioLine").click(function(){
                $("#draw-radio").buttonset("disable");
                EntityObject.propertyManager.drawer.createGeometry('polyline');
            });
            $("#dRadioArea").click(function(){
                $("#draw-radio").buttonset("disable");
                EntityObject.propertyManager.drawer.createGeometry('polygon');
            });

        } else {
            $("#editGeom").click(function(){
                //propertyManager can only be reached so complicatedly from inside listener:
                propMgr = EntityObject.propertyManager
                var geom = propMgr.properties[index].value;

                //set the editGeom button disabled
                $("#editGeom").attr("disabled","disaled");
        
                //set geometry editable
                propMgr.drawer.loadGeometry(geom);
            });
        }
    }
};
