<?php


//////////////////////////////////////////////////////////////
// CONNECTION
// connection to the postgis database
//////////////////////////////////////////////////////////////

// We get the DATABASE_URL from Heroku (or some default string)
$database_url = getenv('DATABASE_URL');
if(!$database_url){
	$database_url = 'postgres://postgres:postgres@localhost:5432/globalatlas';
}

// We convert from psql connection string to PDO connection string
preg_match("/postgres:\/\/(.*):(.*)@(.*):(.*)\/(.*)/", $database_url, $db_conf);
$pdo_string = sprintf('pgsql:host=%s;port=%s;dbname=%s;user=%s;password=%s',$db_conf[3],$db_conf[4],$db_conf[5],$db_conf[1],$db_conf[2]);

$pdo = new PDO($pdo_string);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);


//////////////////////////////////////////////////////////////
// FUNCTIONS
// helpers to query the database
//////////////////////////////////////////////////////////////

/*
 * FUNCTION  	geojson_query
 * PARAMS 		sql (string) : The SQL query. The geometric column must be called "geojson" and be a string produced by ST_AsGeoJSON().
 * 				http_params (dict[string]) : The parameters sent by the client. Parameters sent by the client that have no default value will be ignored.
 * 				bindings (dict[string]) : The parameters used by the query (key) with their default value (value). Parameters with the same key sent by the client will be replaced.
 * RETURNS 		string : geojson string
 */
function geojson_query($sql, $http_params, $bindings){
	global $pdo;

	$geojson = [
		'type' => 'FeatureCollection',
		'features' => []
	];


	$statement = $pdo->prepare($sql);

	$bound_args = [];
	foreach($bindings as $key=>$default){
		$val = ( isset($http_params[$key])?$http_params[$key]:$default );
		$bound_args[':'.$key] = $val;
	}
	$statement->execute($bound_args);

	while($row = $statement->fetch(PDO::FETCH_OBJ)){
		$feature = [
			'type' => 'Feature',
			'geometry' => null,
			'properties' => []
		];
		foreach($row as $key=>$value){
			if($key=='geojson'){
				$feature['geometry'] = json_decode($value);
			}
			else{
				$feature['properties'][$key] = $value;
			}
		}
		$geojson['features'][] = $feature;
    }

	return json_encode($geojson);
}

function query($sql, $http_params, $bindings){
	global $pdo;

	$json = [];

	$statement = $pdo->prepare($sql);

	$bound_args = [];
	foreach($bindings as $key=>$default){ $bound_args[':'.$key] = @$http_params[$key]?:$default; }
	$statement->execute($bound_args);

	while($row = $statement->fetch(PDO::FETCH_OBJ)){
		$feature = [];
		foreach($row as $key=>$value){
			$feature[$key] = $value;
		}
		$json[] = $feature;
    }

	return json_encode($json);
}

//for inserting new content into the DB...
function insert($sql, $http_params, $bindigs){
	global $pdo;

	$statement = $pdo->prepare($sql);

	$bound_args = [];
	
	//fill bound_args with the bound values or with a default value 
        //(e.g. bound_args[':name'] = 'entityName')
	foreach($bindings as $value){ $bound_args[':'.$value] = @$http_params[$value]; }

	$statement->execute($bound_args);

	return true;
}
