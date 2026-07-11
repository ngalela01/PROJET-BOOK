MATCH (n)
RETURN labels(n)[0] AS type, count(n) AS total
ORDER BY type;

MATCH (:Book {id: "book_001"})-[:SIMILAR_TO]-(book:Book)
RETURN DISTINCT book.id AS bookId, book.title AS title, book.author AS author
ORDER BY title;

MATCH (user:User)-[:LIKES]->(:Book {id: "book_001"})
RETURN user.id AS userId, user.firstName AS firstName, user.lastName AS lastName
ORDER BY userId;

MATCH (:User {id: "user_002"})-[:LIKES]->(:Book)-[:SIMILAR_TO]->(recommendation:Book)
WHERE NOT (:User {id: "user_002"})-[:LIKES]->(recommendation)
RETURN DISTINCT recommendation.id AS bookId, recommendation.title AS title
ORDER BY title;

MATCH (:User {id: "user_001"})-[:FOLLOWS]->(followed:User)-[:LIKES]->(book:Book)
WHERE NOT (:User {id: "user_001"})-[:LIKES]->(book)
RETURN DISTINCT followed.firstName AS followedUser, book.id AS bookId, book.title AS title
ORDER BY followedUser, title;

MATCH (book:Book)-[:IN_CATEGORY]->(category:Category)
RETURN category.name AS category, count(book) AS totalBooks
ORDER BY totalBooks DESC, category;

MATCH (user:User)-[:LIKES]->(book:Book)
RETURN book.id AS bookId, book.title AS title, count(user) AS likes
ORDER BY likes DESC, title;
