/*
 * PropertyEntries keeps track of the currently displayed properties. It produces the HTML code 
 * for feeding the properties table in the inspector. This allows to easily modify the form of a
 * property table entry. 
 */
function PropertyEntries(tableID){
    
    //PRIVATE MEMBERS
    var properties   = [];
    var tableID      = '#' + tableID;
    var currEditable = -1;
    var drawer       = new Drawer();
    var creatingProp = false;



    /*
     * Sets a given entry in the table uneditable.
     */
    function putUneditableEntry(index) {
        var property = properties[index];
        var name     =  property.property_name;
        var date     = (property.date?property.date:'∞');
        var value    =  property.value;
        var source   =  property.source_name;

        var entry = '\
        <tr id="propEntry'+ index +'">\
            <td class="key">'+ name +'</td>\
            <td><span class="prev"/></td>\
            <td class="date">' + date + '\
            <td> <span class="next"/></td>\
            </td>\
            <td class="value">'+ value +'</td>\
            <td class="source">['+ source +']</td>\
            <td>\
                <button class="editButton" title="Edit Property" onclick="EntityObject.editProp('+ index +');">\
                    <img src="icons/edit.png" width="16" height="16">\
                </button>\
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
    function putEditableEntry(index){
        currEditable = index;

        var property = properties[index];
        var type     =  property.property_name;
        var start    = (property.computed_date_start?property.computed_date_start:'∞');
        var date     = (property.date?property.date:'∞');
        var end      = (property.computed_date_end?property.computed_date_end:"∞");
        var value    =  property.value;
        var source   =  property.source_name;

        var editableEntry = '\
        <tr id="propEntry'+ index +'">\
            <td colspan="7">\
                <div class="editable-property-entry">\
                    <ul>\
                        <li>Type: <select id="propType"/></li>\
                        <li>Edit: <div id="propValue" style="display:inline; width=400px;">'+ value +'</div></li>\
                        <li>Valid at: <input id="valid-at" type="number" value="'+ date +'"/></li>\
                        <li>Start of validity:<input id="startCheck" type="checkbox" /></li>\
                        <li>Source: <input id="source" type="text" value="'+ source +'" /></li>\
                    </ul>\
                    <div style="float:right">\
                        <button title="Delete Property" onclick="EntityObject.propertyManager.deleteProperty('+ index +');">\
                            <img src="icons/delete.png" width="16" height="16">\
                        </button>\
                        <button title="Cancel Changes" onclick="EntityObject.cancelEdit();">\
                            <img src="icons/cancel.png" width="16" height="16">\
                        </button>\
                        <button title="Save Changes" onclick="EntityObject.propertyManager.saveProperty('+ index +');">\
                            <img src="icons/save.png" width="16" height="16">\
                        </button>\
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
        if(creatingProp){
            populateSelect('propType', index);
        } else {
            $('#propType').replaceWith(type);
            //propertyManager can only be reached so complicatedly from inside listener:
            setValueEditTool(type, index);
        }
    }



    /*
     * Sets the property value edit tool according to chosen property type.
     */
    function setValueEditTool(type, index){
        var tool = '';

        switch(type) {
            case 'geom': 
                if(creatingProp) {
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
                if(!isNaN(properties[index].value))
                    val = parseFloat(properties[index].value);
                tool += '<input id="setValue" type="number" value="'+ val +'"/>'
                break;


            default:
                tool += '<input id="setValue" type="text" value="'+ properties[index].value+ '"/>'
                break;

        }

        // insert tool into HTML
        $("#propValue").empty().append(tool);

        // now that tool is loaded, the appropriate listeners need to be instantiated and elements
        // rendered correctly.
        if(type == 'geom'){
            if(creatingProp) {
                $("#draw-radio").buttonset()
                $("#draw-radio").find('span.ui-button-text').addClass('drawRadioStyle');

                var drawType = '';

                //Enable drawing when clicking on one of the Draw-radios
                $("#dRadioPoint").click(function(){
                    $("#draw-radio").buttonset("disable");
                    drawer.createGeometry('marker');
                });
                $("#dRadioLine").click(function(){
                    $("#draw-radio").buttonset("disable");
                    drawer.createGeometry('polyline');
                });
                $("#dRadioArea").click(function(){
                    $("#draw-radio").buttonset("disable");
                    drawer.createGeometry('polygon');
                });

            } else {
                $("#editGeom").click(function(){
                    //set the editGeom button disabled
                    $("#editGeom").attr("disabled","disabled");
            
                    //set geometry editable
                    var geom = properties[index].value;
                    drawer.loadGeometry(geom);
                });
            }
        }
    };



    /* TODO: duplicated code here... merge this somehow...
     * Populates a table entry's select. 
     */
    populateSelect = function(selectID, index){
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
            //set correct edit tool at the beginning
            setValueEditTool(standardType, index);

            //Create listener for this select
            $("#propType").change(function(){
                //propertyManager can only be reached so complicatedly from inside listener:
                setValueEditTool($(this).find("option:selected").text(), index);
            });
            break;
        }
    };





    //PRIVILEGED MEMBERS


    /*
     * Set the currently editable entry (incl. its geometry if necessary) non-editable. 
     */
    this.cancelEdit = function(){
        if(currEditable >= 0){
            putUneditableEntry(currEditable)

            //remove empty property.
            if(creatingProp){
                var toRemove = properties.length - 1;
                properties.pop();
                $('#propEntry'+toRemove).replaceWith('');
            }

            //not in creating phase anymore...
            creatingProp = false;

            //allow to edit all the props and add a new one
            $('.editButton').removeAttr('disabled');
            $("#add-property").removeAttr('disabled');

            drawer.disable();
            
            currEditable = -1;
        }
    }



    /*
     * Shows properties in array
     */
    this.showNew = function(props){
        properties = props;
        currEditable = -1;

        //when clicking an entity on map while drawing, inspector is reloaded. Drawing needs to be 
        //disabled in this case.
        drawer.disable();

        $('.editButton').removeAttr('disabled');
        $("#add-property").removeAttr('disabled');
        
        //Creates HTML code for a property entry. Saves it in array. 
        // --> first create empty entry, then fill it with this.setEntry.
        for (i in properties){
            $(tableID).append('<tr id="propEntry'+ i +'"/>')
            putUneditableEntry(i);
        }
    }



    /*
     * Set an entry editable
     */
    this.setEditable = function(index){
        if(currEditable < 0){
            currEditable = index;
            putEditableEntry(index)

            //only one property can be edited at a time. 
            $('.editButton').attr("disabled","disaled")
            $("#add-property").attr("disabled","disaled")
        } 
    }



    /*
     * Create new empty property (only locally) and set it editable.
     */
    this.createNewProperty = function(){
        //indicate that we're in the property creating phase
        creatingProp = true;

        //create empty property
        var newProp = {property_name       : 'geom',
                       computed_date_start : '',
                       date                : '',
                       computed_date_end   : '',
                       value               : '',
                       source_name         : ''};
        properties.push(newProp);

        var index = properties.length - 1;

        //set it editable (first create empty table row, then replace it by editable row)
        $(tableID).append('<tr id="propEntry'+ index +'"/>')
        this.setEditable(index);
    }



    /*
     * Set the currently editable entry (incl. its geometry if necessary) non-editable. 
     */
    this.cancelEdit = function(){
        if(currEditable >= 0){
            putUneditableEntry(currEditable)

            //remove empty property.
            if(creatingProp){
                var toRemove = properties.length - 1;
                properties.pop();
                $('#propEntry'+toRemove).replaceWith('');
            }

            //not in creating phase anymore...
            creatingProp = false;

            //allow to edit all the props and add a new one
            $('.editButton').removeAttr('disabled');
            $("#add-property").removeAttr('disabled');

            drawer.disable();
            
            currEditable = -1;
        }
    }



    /*
     * This method gets called when edit or new property gets saved.
     */
    this.saveProperty = function(){

        var entityID   = Number(EntityObject.loadedEntity);
        var propertyID = properties[currEditable].property_id;
        var type       = Number($("#propType option:selected").val());
        var value      = '';
        var year       = Number($("#valid-at").val());
        var isStart    = $("#startCheck").is(":checked")?'start':'default';
        var source     = $("#source").val();

        //if creating a new property AND creating new geometry...
        if(creatingProp){
            if($("#propType option:selected").text() == 'geom'){
                value = drawer.getGeometry()
            } else {
                value = $("#setValue").val()
            }
        //if editing...
        } else {
            // if geom, get value from drawer. If this is empty, geom itself was not modified. But 
            // maybe another value. So just get the current value...
            if(properties[currEditable].property_name == 'geom'){
                value = drawer.getGeometry()
                if(value == ''){
                    value = properties[currEditable].value
                }
            } else {
                value = $("#setValue").val()
            }
        }


        //saving property (create new or update existing)
        if(creatingProp){
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
        putUneditableEntry(currEditable)

        //not in creating phase anymore...
        creatingProp = false;

        //allow to edit all the props and add a new one
        $('.editButton').removeAttr('disabled');
        $("#add-property").removeAttr('disabled');

        EntityObject.reloadData();

        drawer.disable();
            
        currEditable = -1;
    }



    /*
     * Deletes the currently edited property
     */
    this.deleteProperty = function(index){
        var propertyID = properties[index].property_id
        $.ajax({
            type: "GET",
            dataType: "json",
            url: settings_api_url,
            data: {'query'      : 'delete_property',
                   'propertyID' : propertyID},

            success: function(data,textStatus,jqXHR){
                console.log("Property Manager: Deleted property #" + propertyID);
                currEditable = -1
                EntityObject.reloadData();
            },
            error: function( jqXHR, textStatus, errorThrown ){
                console.log('Property Manager: Error deleting property!\n' + jqXHR.responseText);
            }
        });
        
        //set row uneditable
        putUneditableEntry(currEditable)

        //not in creating phase anymore...
        creatingProp = false;

        //allow to edit all the props and add a new one
        $('.editButton').removeAttr('disabled');
        $("#add-property").removeAttr('disabled');

        EntityObject.reloadData();

        drawer.disable();
            
        currEditable = -1;
    }



    /*
     * This method needs to be called when inspector is closed.
     */
    this.reset = function(){
        this.cancelEdit();
    }
}


























