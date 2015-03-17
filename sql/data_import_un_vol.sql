/*******************************/
/* SOURCES                     */
/*******************************/

INSERT INTO vtm.sources(name)
SELECT 'UN_VOL'
WHERE NOT EXISTS ( SELECT id FROM vtm.sources WHERE name = 'UN_VOL' );


/*******************************/
/* ENTITY_TYPES                */
/*******************************/

INSERT INTO vtm.entity_types(name,min_zoom,max_zoom,zindex)
SELECT 'building', 15, null, 3.0
WHERE NOT EXISTS ( SELECT id FROM vtm.entity_types WHERE name = 'building' );


/*******************************/
/* ENTITIES                    */
/*******************************/

INSERT INTO vtm.entities (name, type_id)
SELECT 	'un_vol_entity_'||id as name,
		(SELECT id FROM vtm.entity_types WHERE name='building') as type_id
FROM 	"data_external"."un_vol" as source
WHERE 	ST_Intersects(ST_Transform(source.geom,4326), ST_MakeEnvelope(12.3328,45.4365,12.3401,45.4401, 4326));


/*******************************/
/* EVENTS (geom)               */
/*******************************/

INSERT INTO vtm.events(entity_id, key, geovalue, date, source_id)
SELECT 	(SELECT id FROM vtm.entities WHERE name=('un_vol_entity_'||source.id) LIMIT 1) as entity_id,
		'geom' as key,
		ST_Transform(source.geom,4326) as geovalue,
		2015 as date,
		(SELECT id FROM vtm.sources WHERE name='UN_VOL') as source_id
FROM 	"data_external"."un_vol" as source
WHERE 	ST_Intersects(ST_Transform(source.geom,4326), ST_MakeEnvelope(12.3328,45.4365,12.3401,45.4401, 4326));



/*******************************/
/* EVENTS (height              */
/*******************************/

INSERT INTO vtm.entity_types(name) VALUES ('height');

INSERT INTO vtm.events(entity_id, key, value, date, source_id)
SELECT 	(SELECT id FROM vtm.entities WHERE name=('un_vol_entity_'||source.id) LIMIT 1) as entity_id,
		'height' as key,
		uv_qcolmo as value,
		2015 as date,
		(SELECT id FROM vtm.sources WHERE name='UN_VOL') as source_id
FROM 	"data_external"."un_vol" as source
WHERE 	ST_Intersects(ST_Transform(source.geom,4326), ST_MakeEnvelope(12.3328,45.4365,12.3401,45.4401, 4326));