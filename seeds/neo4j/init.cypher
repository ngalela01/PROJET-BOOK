MATCH (n) DETACH DELETE n;

CREATE CONSTRAINT user_id IF NOT EXISTS
FOR (u:User)
REQUIRE u.id IS UNIQUE;

CREATE CONSTRAINT book_id IF NOT EXISTS
FOR (b:Book)
REQUIRE b.id IS UNIQUE;

CREATE CONSTRAINT category_name IF NOT EXISTS
FOR (c:Category)
REQUIRE c.name IS UNIQUE;

UNWIND [
  {id: "user_001", firstName: "Alice", lastName: "Martin", role: "student"},
  {id: "user_002", firstName: "Nassim", lastName: "Benali", role: "student"},
  {id: "user_003", firstName: "Chloe", lastName: "Durand", role: "student"},
  {id: "user_004", firstName: "Yanis", lastName: "Morel", role: "student"},
  {id: "user_005", firstName: "Emma", lastName: "Petit", role: "librarian"},
  {id: "user_006", firstName: "Lucas", lastName: "Bernard", role: "student"},
  {id: "user_007", firstName: "Ines", lastName: "Robert", role: "student"},
  {id: "user_008", firstName: "Mehdi", lastName: "Leroy", role: "student"}
] AS row
MERGE (u:User {id: row.id})
SET u.firstName = row.firstName,
    u.lastName = row.lastName,
    u.role = row.role;

UNWIND [
  {id: "book_001", title: "Dune", author: "Frank Herbert", category: "science-fiction", status: "borrowed"},
  {id: "book_002", title: "1984", author: "George Orwell", category: "dystopie", status: "available"},
  {id: "book_003", title: "Le Petit Prince", author: "Antoine de Saint-Exupery", category: "conte", status: "available"},
  {id: "book_004", title: "L'Etranger", author: "Albert Camus", category: "roman", status: "borrowed"},
  {id: "book_005", title: "Harry Potter a l'ecole des sorciers", author: "J. K. Rowling", category: "fantasy", status: "reserved"},
  {id: "book_006", title: "Fondation", author: "Isaac Asimov", category: "science-fiction", status: "available"},
  {id: "book_007", title: "Les Miserables", author: "Victor Hugo", category: "classique", status: "available"},
  {id: "book_008", title: "Fahrenheit 451", author: "Ray Bradbury", category: "dystopie", status: "borrowed"},
  {id: "book_009", title: "La Nuit des temps", author: "Rene Barjavel", category: "science-fiction", status: "available"},
  {id: "book_010", title: "Le Seigneur des Anneaux", author: "J. R. R. Tolkien", category: "fantasy", status: "reserved"}
] AS row
MERGE (b:Book {id: row.id})
SET b.title = row.title,
    b.author = row.author,
    b.category = row.category,
    b.status = row.status
MERGE (c:Category {name: row.category})
MERGE (b)-[:IN_CATEGORY]->(c);

UNWIND [
  {userId: "user_001", bookId: "book_001"},
  {userId: "user_001", bookId: "book_006"},
  {userId: "user_002", bookId: "book_002"},
  {userId: "user_003", bookId: "book_004"},
  {userId: "user_004", bookId: "book_008"},
  {userId: "user_006", bookId: "book_006"},
  {userId: "user_007", bookId: "book_010"}
] AS row
MATCH (u:User {id: row.userId})
MATCH (b:Book {id: row.bookId})
MERGE (u)-[:LIKES]->(b);

UNWIND [
  {fromUserId: "user_001", toUserId: "user_002"},
  {fromUserId: "user_002", toUserId: "user_003"},
  {fromUserId: "user_003", toUserId: "user_001"},
  {fromUserId: "user_006", toUserId: "user_001"}
] AS row
MATCH (fromUser:User {id: row.fromUserId})
MATCH (toUser:User {id: row.toUserId})
MERGE (fromUser)-[:FOLLOWS]->(toUser);

UNWIND [
  {fromBookId: "book_001", toBookId: "book_006"},
  {fromBookId: "book_002", toBookId: "book_008"},
  {fromBookId: "book_005", toBookId: "book_010"}
] AS row
MATCH (fromBook:Book {id: row.fromBookId})
MATCH (toBook:Book {id: row.toBookId})
MERGE (fromBook)-[:SIMILAR_TO]->(toBook)
MERGE (toBook)-[:SIMILAR_TO]->(fromBook);
