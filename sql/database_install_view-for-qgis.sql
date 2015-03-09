DROP VIEW IF EXISTS vtm.events_for_qgis;

CREATE VIEW vtm.events_for_qgis AS
SELECT 	ev.id,
		ev.description,
		ev.key,
		ev.value,
		ev.geovalue,
		ev.date,
		ev.entity_id,
		ev.source_id,
		ev.source_description,
		ev.computed_date_start,
		ev.computed_date_end,
		ent.name as entity_name,
		type.name as entity_type_name
FROM vtm.events as ev
JOIN vtm.entities as ent ON ev.entity_id=ent.id
JOIN vtm.entity_types as type ON ent.type_id=type.id;



DROP FUNCTION IF EXISTS vtm.proxy_events_for_qgis();
CREATE FUNCTION vtm.proxy_events_for_qgis() RETURNS trigger AS    
$$
    BEGIN

      IF TG_OP='INSERT' THEN

      	INSERT INTO vtm.events( description, key, value, geovalue, date, entity_id, source_id, source_description	)
      	VALUES ( NEW.description, NEW.key, NEW.value, NEW.geovalue, NEW.date, NEW.entity_id, NEW.source_id, NEW.source_description);
	      RETURN NEW;


      ELSIF TG_OP='UPDATE' THEN

      	UPDATE vtm.events SET
	      	id=NEW.id,
	      	description=NEW.description,
	      	key=NEW.key,
	      	value=NEW.value,
	      	geovalue=NEW.geovalue,
	      	date=NEW.date,
	      	entity_id=NEW.entity_id,
	      	source_id=NEW.source_id,
	      	source_description=NEW.source_description
	    WHERE id=OLD.id;
		RETURN NEW;


      ELSIF TG_OP='DELETE' THEN

		DELETE FROM vtm.events WHERE id=OLD.id;
		RETURN OLD;


      END IF;


    END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER proxy_events_for_qgis INSTEAD OF INSERT OR UPDATE OR DELETE ON vtm.events_for_qgis FOR EACH ROW
    EXECUTE PROCEDURE vtm.proxy_events_for_qgis();