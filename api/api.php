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
SELECT 	ev.id,
		ev.date,
		ent.id as entity_id,
		ent.name as entity_name,
		type.name as entity_type_name,
		ST_AsGeoJSON(
			ST_Simplify(
				geovalue,
				360.0/pow(2.0,:zoom+9.0)
			)
		) as geojson
FROM vtm.events as ev
JOIN vtm.entities as ent ON ev.entity_id=ent.id
JOIN vtm.entity_types as type ON ent.type_id=type.id
WHERE 	property_type_id=0 -- we only want geometrical events
		AND
		NOT (type.name = ANY (STRING_TO_ARRAY(:filtertype,',')) )
		AND
		(computed_date_start IS NULL OR computed_date_start<=:date) -- we only want events that have started
		AND
		(computed_date_end IS NULL OR computed_date_end>:date) -- we only want events that have not ended
		AND
		(type.min_zoom IS NULL OR :zoom>=type.min_zoom) -- we only get features whose size makes sense at actual zoom level
		AND
		(type.max_zoom IS NULL OR :zoom<=type.max_zoom) -- we only get features whose size makes sense at actual zoom level
		--AND
		--(computed_size IS NULL OR (computed_size<=360.0/pow(2.0,:zoom-6.0) AND computed_size>=360.0/pow(2.0,:zoom+6.0))) -- we only get features whose size makes sense at actual zoom level
		AND
		ST_Intersects( ST_MakeEnvelope(:e,:s,:w,:n, 4326), geovalue ) -- we only want events that intersect the current view'
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
		prop.name as property_name
FROM 	vtm.events as ev
LEFT JOIN 	vtm.sources as src ON src.id=ev.source_id
LEFT JOIN 	vtm.properties as prop ON prop.id=ev.property_type_id
WHERE 	ev.entity_id=:id
		AND
		(computed_date_start IS NULL OR computed_date_start<=:date) -- we only want events that have started
		AND
		(computed_date_end IS NULL OR computed_date_end>:date) -- we only want events that have not ended
EOT;
		echo query($sql, $_GET, $default_params);
		break;


	/************************************************************/
	/* SUCCESSION_FOR_ENTITY                                    */
	/* get all succession relation for an entity                */
	/************************************************************/

	case 'succession_for_entity':

		$default_params = [
			'id' => 0 // entity_id
		];
		
		$sql = <<<EOT
WITH 	entity AS (SELECT   CASE
								WHEN (SELECT EXISTS ( SELECT 1 FROM UNNEST(ARRAY_AGG( computed_date_start )) s(a) WHERE a IS NULL)) THEN NULL
								ELSE MIN(computed_date_start)
							END as mindate,
							CASE
								WHEN (SELECT EXISTS ( SELECT 1 FROM UNNEST(ARRAY_AGG( computed_date_end )) s(a) WHERE a IS NULL)) THEN NULL
								ELSE MAX(computed_date_end)
							END as maxdate
							FROM vtm.events
							WHERE entity_id=:id)

SELECT 	b_id,
		name,
		mindate,
		maxdate,
		CASE
			WHEN other.maxdate<=(SELECT mindate FROM entity) THEN 'ancestor'
			WHEN other.mindate>=(SELECT maxdate FROM entity) THEN 'sucessor'
			ELSE 'contemporary'
		END as status
FROM (
	SELECT 	b_id,
			ent.name,
			CASE
				WHEN (SELECT EXISTS ( SELECT 1 FROM UNNEST(ARRAY_AGG( computed_date_start )) s(a) WHERE a IS NULL)) THEN NULL
				ELSE MIN(computed_date_start)
			END as mindate,
			CASE
				WHEN (SELECT EXISTS ( SELECT 1 FROM UNNEST(ARRAY_AGG( computed_date_end )) s(a) WHERE a IS NULL)) THEN NULL
				ELSE MAX(computed_date_end)
			END as maxdate
	FROM 	vtm.related_entities as rel
	JOIN 	vtm.entities as ent ON ent.id=rel.b_id
	JOIN 	vtm.events as evt ON evt.entity_id=ent.id
	WHERE 	rel.a_id=:id
	GROUP BY b_id, ent.name
) as other
ORDER BY status
EOT;


		echo query($sql, $_GET, $default_params);
		break;
}


