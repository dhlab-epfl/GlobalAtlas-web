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
		(computed_date_start IS NULL OR computed_date_start<=:date) -- we only want properties that have started
		AND
		(computed_date_end IS NULL OR computed_date_end>:date) -- we only want properties that have not ended
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
	ini_set('display_errors', 'on');

		$default_params = [
			'id' => 0, // entity_id
			'date' => 2015 // date
		];

		$sql = <<<EOT
SELECT 	date,
                prop.id as property_id,
                prop.interpolation,
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
		flush(); ob_flush();
	break;



	/************************************************************/
	/* CREATE_NEW_ENTITY                                        */
	/* inserts a new entity                                     */
	/************************************************************/
	
	case 'create_new_entity':
	ini_set('display_errors', 'on');

		$default_params = [
			'name'        => '', 
			'entity_type' => 1,
		];

		$sql = <<<EOT
INSERT INTO
  vtm.entities(name, type_id) 
VALUES 
  (:name, :entity_type)
RETURNING id
EOT;
		echo query($sql, $_GET, $default_params);
	
		flush(); ob_flush();
	break;



	/************************************************************/
	/* CREATE_NEW_PROPERTY                                      */
	/* saves a new property for an existing entity.             */
	/************************************************************/
	
	case 'create_new_property':
		ini_set('display_errors', 'on');

		$default_params = [
                        'entityID'      => 0,
                        'propertyType'  => 1,
			'date'          => 0,
			'interpolation' => 'default',
			'value'         => '',
			'source'        => 'no source'
		];


		$sql = <<<EOT
WITH insert AS (
	INSERT INTO vtm.sources (name)
        SELECT :source
         WHERE NOT EXISTS (
                   SELECT id 
                     FROM vtm.sources
                    WHERE name = :source)),
     source AS (
        SELECT id 
          FROM vtm.sources
         WHERE name = :source)
         

INSERT INTO vtm.properties(entity_id, 
			   property_type_id, 
			   date, 
                           interpolation,
			   value, 
			   source_id)
     VALUES (:entityID, 
	     :propertyType,
	     :date,
             :interpolation,
	     :value, 
	     (SELECT id FROM source))

EOT;
		echo query($sql, $_GET, $default_params);
		flush(); ob_flush();
	break;


    /************************************************************/
    /* UPDATE_ENTITY                                            */
    /* saves changes of an entity                               */
    /************************************************************/

    case 'update_entity':
        ini_set('display_errors', 'on');

        $default_params = [
            'id'    => 0,
            'name'  => 'default_name',
            'type'  => '1',
        ];

        $sql = <<<EOT
UPDATE
  vtm.entities 
SET
  name          = :name,
  type_id       = :type
WHERE
  id = :id
EOT;


        echo query($sql, $_GET, $default_params);

        flush(); ob_flush();
    break;


	/************************************************************/
	/* UPDATE_PROPERTY                                          */
	/* saves changes of an entity (a property and it's assigned */
	/* source                                                   */
	/************************************************************/

	case 'update_property':
		ini_set('display_errors', 'on');

		$default_params = [
                        'propertyID'    => 0,
			'date'          => 0,
			'interpolation' => 'default',
			'value'         => '',
			'source'        => 'no source'
		];

		$sql = <<<EOT
WITH update_s AS (
          INSERT INTO vtm.sources (name)
          SELECT :source
           WHERE NOT EXISTS (
                     SELECT id 
                       FROM vtm.sources
                      WHERE name = :source)),
       source AS (
          SELECT id 
            FROM vtm.sources
           WHERE name = :source)


UPDATE vtm.properties
   SET date          = :date,
       value         = :value,
       interpolation = :interpolation,
       source_id     = (SELECT id FROM source)
 WHERE id = :propertyID
EOT;


		echo query($sql, $_GET, $default_params);

		flush(); ob_flush();
	break;



	/************************************************************/
	/* CALCULATE_DATES                                          */
	/* Returns all possible types for properties                */
	/************************************************************/

	case 'calculate_dates':
		$default_params = [
			'entityID'    => 0,
            'propertyID'  => 0];

		$sql = 'SELECT vtm.compute_date_for_property_of_entity(:entityID, :propertyID)';

		echo query($sql, $_GET, $default_params);
        break;



	/************************************************************/
	/* GET_PROPERTY_TYPES                                       */
	/* Returns all possible types for properties                */
	/************************************************************/

	case 'get_property_types':
		ini_set('display_errors', 'on');
		$default_params = [];
		$sql = <<<EOT
SELECT id, name, description, type
  FROM vtm.properties_types
EOT;
		echo query($sql, $_GET, $default_params);

        break;

    /************************************************************/
    /* GET_ENTITY_TYPES                                         */
    /* Returns all possible types for entities                  */
    /************************************************************/

    case 'get_entity_types':
        $default_params = [];
        $sql = <<<EOT
SELECT id, name, min_zoom, max_zoom, zindex
  FROM vtm.entity_types
EOT;
        echo query($sql, $_GET, $default_params);

        break;

	/************************************************************/
	/* NEXT_GEOMETRY_FOR_ENTITY                                 */
	/* find the next set of geometries for the entity at hand   */
	/************************************************************/

	case 'next_geometry_for_entity':
		$default_params = [
			'id'        => 0, //entity_id
			'date'      => 2015,
			'direction' => 1, // either 1 (future) or -1 (to go into the past)
			'type'      => 'geom'
		];

		$sql = <<<EOT
SELECT
  prop.date
FROM
  vtm.properties as prop   ,
  vtm.properties_types as proptype
WHERE
  prop.entity_id = :id
  AND  :direction * prop.date > :direction * :date
  AND  proptype.name = :type
  AND  proptype.id = prop.property_type_id
ORDER BY
  :direction * prop.date
LIMIT 1
EOT;
		echo query($sql, $_GET, $default_params);
		break;
}

