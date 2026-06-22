// Seed minimal pour Neo4j
CREATE CONSTRAINT IF NOT EXISTS FOR (b:Book) REQUIRE b.id IS UNIQUE;
CREATE (:Book {id: '1', title: 'Example Book', author: 'Author Example'});
