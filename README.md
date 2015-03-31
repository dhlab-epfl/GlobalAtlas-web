# VTMApp

## The corresponding DB schema

- All things on the map are entities (saved in the **entities** table), the database schema is built around that idea. Entities are timeless, they simly "are". There's nothing more to it. However, entities are "containers" for properties, an entitiy without a property is void and doesn't make sense.

- There can be many properties (saved in the **properties** table) for each entity, the most obvious is *geom* which defines the shape of an entity on the map. All properties have a start and an end date (e.g. when shapes change). Other examples for properties are:

- Entities can be related to each other (saved in **related_entities**).

- The other tables are not as central to the idea of our db structure.
