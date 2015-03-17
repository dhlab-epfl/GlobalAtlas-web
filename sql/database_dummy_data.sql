
--INSERT INTO vtm.properties_types(id,name) VALUES (0,'geom');
INSERT INTO vtm.properties_types(name) VALUES ('height');-- id 1

--INSERT INTO vtm.entity_types(id,name,zindex) VALUES (0,'autogenerated',10000.0);
INSERT INTO vtm.entity_types(name) VALUES ('building');-- id 1
INSERT INTO vtm.entity_types(name) VALUES ('street');-- id 2
INSERT INTO vtm.entity_types(name) VALUES ('person');-- id 3


INSERT INTO vtm.entities(name,type_id) VALUES ('Fondacco dei Tedeschi',1);-- id 1
INSERT INTO vtm.entities(name,type_id) VALUES ('Main road',2);-- id 2
INSERT INTO vtm.entities(name,type_id) VALUES ('Leonardo da Vinci',3);-- id 3
INSERT INTO vtm.entities(name,type_id) VALUES ('Grand Hôtel of the Future',1);-- id 4


INSERT INTO vtm.sources(name) VALUES ('Some book');-- id 1
INSERT INTO vtm.sources(name) VALUES ('Some simulation');-- id 2


INSERT INTO vtm.properties(entity_id, property_type_id, date, interpolation, source_id, value) VALUES (1,0,1650,NULL,1,'MULTIPOLYGON(((12.3368878497105 45.4380208940809,12.3362694852308 45.4381327117705,12.3364426145651 45.4385343828056,12.3370213383101 45.438458843702,12.3368878497105 45.4380208940809)))');
INSERT INTO vtm.properties(entity_id, property_type_id, date, interpolation, source_id, value) VALUES (1,0,1325,NULL,2,'MULTIPOLYGON(((12.3368878497105 45.4380208940809,12.3362694852308 45.4381327117705,12.3364426145651 45.4385343828056,12.3370213383101 45.438458843702,12.3368878497105 45.4380208940809),(12.3365009742531 45.4384265062985,12.3364229890179 45.4382258647756,12.3367449280656 45.4381725473278,12.3368089159509 45.438361964348,12.3365009742531 45.4384265062985)))');

INSERT INTO vtm.properties(entity_id, property_type_id, date, interpolation, source_id, value) VALUES (2,0,1210,NULL,1,'MULTILINESTRING((12.3354691696034 45.4377523198908,12.3360810537561 45.4382153415991,12.3361830344483 45.4386545071631,12.3361470412628 45.4387934118536))');

INSERT INTO vtm.properties(entity_id, property_type_id, date, interpolation, source_id, value) VALUES (3,0,1513,NULL,1,'MULTIPOINT(12.3359930704139 45.4382925115144)');

INSERT INTO vtm.properties(entity_id, property_type_id, date, interpolation, source_id, value) VALUES (4,0,1995,'start',1,'MULTIPOLYGON(((12.33625902006198771 45.43834091804381359,12.33649497538885775 45.43827637599540736,12.33641699015370641 45.43804346277201489,12.33664294737350708 45.4380083853960528,12.33671293412300152 45.43823007404564152,12.33705886862764878 45.43815851641217307,12.33710485992017247 45.43832548408244065,12.33680891595087914 45.43836336743465409,12.33687290383613266 45.43861592246612702,12.33669693715168592 45.43861031014438367,12.33662895002360749 45.43841387853138514,12.33631700908299855 45.43847842042251273,12.33625902006198771 45.43834091804381359)))');



INSERT INTO vtm.related_entities(a_id,b_id) VALUES (1,4);
INSERT INTO vtm.related_entities(a_id,b_id) VALUES (4,1);