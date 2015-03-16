<?php


//////////////////////////////////////////////////////////////
// CONNECTION
// connection to the postgis database
//////////////////////////////////////////////////////////////

require('config.php');

$pdo = new PDO(sprintf('pgsql:host=%s;port=%s;dbname=%s;user=%s;password=%s',$settings_host,$settings_port,$settings_dbname,$settings_user,$settings_pass));
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