# VTMApp

## The corresponding DB schema
The most important points are:

- All things on the map are entities (saved in the **entities** table), the database schema is built around that idea. Entities are timeless, they simly "are". There's nothing more to it. However, entities are "containers" for properties, an entitiy without a property is void and doesn't make sense.

- There can be many properties (saved in the **properties** table) for each entity, the most obvious is *geom* which defines the shape of an entity on the map. All properties have a date (e.g. because for that date we have a source telling us that the entity had that property at that time), but also a computed start and an end date (i.e. the system detects that another property is valid after or before a certain date and not the one at hand). Other examples for properties could be: Height, Owner, Borders (e.g. if entity is a country), etc.

- Entities can be related to each other (saved in **related_entities**).

You can have a look at the database schema in doc/dbanalysis/index.html

### How to generate schema analysis

Done with Schemaspy (http://schemaspy.sourceforge.net/) and the corresponding 
postgresql jdbc module (https://jdbc.postgresql.org/download.html) by issuing
the following command:

java -jar schemaSpy_5.0.0.jar -t pgsql -db vtm_dev -u <user> -p <pass> -o data -host dhlabpc3.epfl.ch -dp postgresql-9.4-1201.jdbc41.jar -schemas "vtm,data_external"

This saves the schema into the data/ directory of the working directory.
I then moved this data/ directory to doc/dbanalysis in this project.
