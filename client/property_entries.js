

function PropertyEntries(props){
    this.entries    = [];
    this.properties = props;
};

/**
  * Creates HTML code for a property entry. Saves it in array. 
  * --> first create empty entry, then fill it with this.setEntry.
  */
PropertyEntries.prototype.getNewEntry = function(index){
    this.entries.push('');

    return this.setEntry(index);
}



PropertyEntries.prototype.setUneditable = function(index) {
    var property = this.properties[index];
    var propName =  property.property_name;
    var start    = (property.computed_date_start?property.computed_date_start:'∞');
    var date     = (property.date?property.date:'∞');
    var end      = (property.computed_date_end?property.computed_date_end:"∞");
    var value    =  property.value;
    var source   =  property.source_name;

    var entry = '\
    <tr id="prop'+ index +'">\
        <td class="key">'+ name +'</td>\
        <td class="date">\
            <span class="bounds">\
                <a href="javascript:EntityObject.nextGeom(-1,'+ index +');">\
                    '+ start + '\
                </a>&#8239;&lt;&#8239;\
            </span>\
            '+ date +'\
            <span class="bounds">&#8239;&lt;&#8239;\
                <a href="javascript:EntityObject.nextGeom(1,'+ index +');">\
                    '+ end +'\
                </a>\
            </span>\
        </td>\
        <td class="value">'+ value +'</td>\
        <td class="source">['+ source +']</td>\
        <td>\
            <button onclick="edit('+ index +');">✎</button>\
        </td>\
    </tr>';
    this.entries[index] = entry;
    return entry;
}

 
/**
  * Returns code for editing property.
  */
PropertyEntries.prototype.setEditable = function(i){



}
