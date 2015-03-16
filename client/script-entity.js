

EntityObject.loadedEntity = null;

EntityObject.init = function(){

	/* GET THE HASH */

	EntityObject.loadedEntity = (hash['loadedEntity']?hash['loadedEntity']:null);

    $('#inspector #hidebox').click(EntityObject.closeInspector);

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

	$.ajax({
        type: "GET",
        dataType: "json",
        url: settings_api_url,
        data: {'query': 'entity','id': EntityObject.loadedEntity},
        success: function(data,textStatus,jqXHR){
        	$('#inspector').show();
        	$('#inspector h1').html('<span class="entity">'+data[0].name+'</span> <span class="type">('+data[0].entity_type_name+')</span>');
        },
        error: function( jqXHR, textStatus, errorThrown ){
        	console.log('EntityObject: error getting features !');
        }
    });

	$.ajax({
        type: "GET",
        dataType: "json",
        url: settings_api_url,
        data: {'query': 'properties_for_entity','id': EntityObject.loadedEntity,'date': MapObject.date},
        success: function(data,textStatus,jqXHR){
        	$('#inspector').show();
        	$('#inspector_properties').empty();
        	$.each(data,function(i,item){
        		var html = '';

				html += '<tr>';
				html += '	<td class="key">'+item.key+'</td>';
				html += '	<td class="date"><span class="bounds">'+(item.computed_date_start?item.computed_date_start:'∞')+'&#8239;&lt;&#8239;</span>'+item.date+'<span class="bounds">&#8239;&lt;&#8239;'+(item.computed_date_end?item.computed_date_end:"∞")+'</span></td>';
				html += '	<td class="value">'+item.value+'</td>';
				html += '	<td class="source">['+item.source_name+']</td>';
				html += '</tr>';

        		$('#inspector_properties').append(html);
        	});
        },
        error: function( jqXHR, textStatus, errorThrown ){
        	console.log('EntityObject: error getting features !');
        }
    });

	$.ajax({
        type: "GET",
        dataType: "json",
        url: settings_api_url,
        data: {'query': 'succession_for_entity','id': EntityObject.loadedEntity},
        success: function(data,textStatus,jqXHR){
        	$('#inspector').show();
        	$('#inspector_succession').empty();
        	$.each(data,function(i,item){
        		var html = '';

				html += '<tr>';
				html += '	<td class="key">'+item.name+'</td>';
				html += '	<td class="value">'+item.status+' <span class="bounds">'+item.mindate+'-'+item.maxdate+'</span></td>';
				html += '</tr>';

        		$('#inspector_succession').append(html);
        	});
        },
        error: function( jqXHR, textStatus, errorThrown ){
        	console.log('EntityObject: error getting features !');
        }
    });
}