<?php

//////////////////////////////////////////////////////////////
// API                                                      //
// api to proxy ajax queries to postgis queries             //
//                                                          //
// GET params :                                             //
//     ?query : select the query                            //
//     ?... : params for the query (see below)              // 
//////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////
// SETUP
// display exceptions as plain text
//////////////////////////////////////////////////////////////

ini_set('html_errors', false);
header('Content-Type: application/json');

//////////////////////////////////////////////////////////////
// INCLUDES
// define the geojson_query() function to query the postgis database
//////////////////////////////////////////////////////////////

require('database.php');


//////////////////////////////////////////////////////////////
// PARAMETERS
//////////////////////////////////////////////////////////////

$http_params = $_GET;

$query = @$http_params['query']?:'get';



//////////////////////////////////////////////////////////////
// QUERY
//////////////////////////////////////////////////////////////

$sql = '';
$default_params = [];

switch ($query) {

	
	/************************************************************/
	/* GET (default)                                            */
	/* get the features for the normal map view                 */
	/************************************************************/

	default:
	case 'get':		

		$default_params = [
			'n' => 45.44546951863747, // north boundary
			's' => 45.43008178241529, // south boundary
			'e' => 12.360777854919434, // east boundary
			'w' => 12.307391166687012, // west boundary
			'zoom' => 15, // zoom level (used for filter and TODO simplification)
			'date' => 2015, // date
			'filtertype' => '' // date
		];

		$sql = <<<EOT
SELECT 	prop.id,
		prop.date,
		vtm.fuzzyness(:date, prop.date, computed_date_start, computed_date_end, date_start_if_unknown, date_end_if_unknown) as fuzzyness,
		ent.id as entity_id,
		ent.name as entity_name,
		type.name as entity_type_name,
		ST_AsGeoJSON(
			ST_Simplify(
				geovalue,
				360.0/pow(2.0,:zoom+9.0)
			)
		) as geojson
FROM vtm.properties as prop
LEFT JOIN vtm.entities as ent ON prop.entity_id=ent.id
LEFT JOIN vtm.entity_types as type ON ent.type_id=type.id
WHERE 	NOT (type.name = ANY (STRING_TO_ARRAY(:filtertype,',')) )
		AND
		(computed_date_start<=:date OR (computed_date_start IS NULL AND (date_start_if_unknown IS NULL OR date_start_if_unknown<=:date))) -- we only want properties that have started
		AND
		(computed_date_end>:date OR (computed_date_end IS NULL AND (date_end_if_unknown IS NULL OR date_end_if_unknown>=:date))) -- we only want properties that have not ended
		AND
		(type.min_zoom IS NULL OR :zoom>=type.min_zoom) -- we only get features whose size makes sense at actual zoom level
		AND
		(type.max_zoom IS NULL OR :zoom<=type.max_zoom) -- we only get features whose size makes sense at actual zoom level
		--AND
		--(computed_size IS NULL OR (computed_size<=360.0/pow(2.0,:zoom-6.0) AND computed_size>=360.0/pow(2.0,:zoom+6.0))) -- we only get features whose size makes sense at actual zoom level
		AND
		ST_Intersects( ST_MakeEnvelope(:e,:s,:w,:n, 4326), geovalue ) -- we only want properties that intersect the current view, which also excludes all non-geometrical properties -- TODO : check whether a geovalue IS NULL check is more optimal
ORDER BY type.zindex ASC
EOT;
		echo geojson_query($sql, $_GET, $default_params);
		break;


	/************************************************************/
	/* ENTITY                                                   */
	/* get details of the entity                                */
	/************************************************************/

	case 'entity':

		$default_params = [
			'id' => 0, // entity_id
		];

		$sql = <<<EOT
SELECT 	ent.id, ent.name as name, typ.name as entity_type_name
FROM 	vtm.entities as ent
JOIN	vtm.entity_types as typ ON ent.type_id=typ.id
WHERE 	ent.id=:id
EOT;
		echo query($sql, $_GET, $default_params);
		break;


	/************************************************************/
	/* PROPERTIES_FOR_ENTITY                                    */
	/* get all properties for an entity at a certain date       */
	/************************************************************/

	case 'properties_for_entity':

		$default_params = [
			'id' => 0, // entity_id
			'date' => 2015 // date
		];

		$sql = <<<EOT
SELECT 	date,
		value as value,
		computed_date_start,
		computed_date_end,
		src.name as source_name,
		proptype.name as property_name
FROM 	vtm.properties as prop
LEFT JOIN 	vtm.sources as src ON src.id=prop.source_id
LEFT JOIN 	vtm.properties_types as proptype ON proptype.id=prop.property_type_id
WHERE 	prop.entity_id=:id
		AND
		(computed_date_start IS NULL OR computed_date_start<=:date) -- we only want properties that have started
		AND
		(computed_date_end IS NULL OR computed_date_end>:date) -- we only want properties that have not ended
ORDER BY property_name
EOT;
		echo query($sql, $_GET, $default_params);
		break;
		
}


