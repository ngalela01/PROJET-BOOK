# Requêtes représentatives

## PostgreSQL

Les requêtes suivantes sont exécutées par `scripts/test-postgres.sh` via le client `psql` dans le conteneur Docker.

### 1. Livres disponibles par catégorie

```sql
SELECT category, count(*) AS available_books
FROM books
WHERE status = 'available'
GROUP BY category
ORDER BY available_books DESC, category;
```

Illustre un filtrage avec agrégation sur la table centrale `books`.

### 2. Emprunts actifs ou en retard (jointures)

```sql
SELECT l.id AS loan_id, u.first_name, u.last_name, b.title,
       l.borrowed_at, l.due_at, l.status
FROM loans l
JOIN users u ON u.id = l.user_id
JOIN books b ON b.id = l.book_id
WHERE l.status IN ('active', 'late')
ORDER BY l.due_at;
```

Illustre la force de PostgreSQL : jointures entre trois tables avec intégrité référentielle (`loans.user_id → users.id`, `loans.book_id → books.id`).

### 3. Réservations en attente (jointures)

```sql
SELECT r.id AS reservation_id, u.first_name, u.last_name, b.title,
       r.reserved_at, r.status
FROM reservations r
JOIN users u ON u.id = r.user_id
JOIN books b ON b.id = r.book_id
WHERE r.status = 'waiting'
ORDER BY r.reserved_at;
```

### 4. Volume de données par table

```sql
SELECT 'users'        AS table_name, count(*) AS total FROM users
UNION ALL
SELECT 'books',        count(*) FROM books
UNION ALL
SELECT 'loans',        count(*) FROM loans
UNION ALL
SELECT 'reservations', count(*) FROM reservations
ORDER BY table_name;
```

---

## MongoDB

Les requêtes suivantes sont dans `seeds/mongo/queries.js`, exécutées via `mongosh`.

### 1. Détails enrichis d'un livre

```js
db.book_details.findOne(
  { bookId: "book_001" },
  { _id: 0, bookId: 1, title: 1, summary: 1, tags: 1, metadata: 1 }
);
```

Lecture d'un document riche avec champs variables (tags, métadonnées) — impossible à modéliser proprement en SQL sans tables supplémentaires.

### 2. Recherche par tag

```js
db.book_details.find(
  { tags: "science-fiction" },
  { _id: 0, bookId: 1, title: 1, tags: 1 }
);
```

Requête sur un champ tableau : MongoDB traite nativement les tableaux sans table de jointure intermédiaire.

### 3. Moyenne des notes par livre (agrégation)

```js
db.reviews.aggregate([
  {
    $group: {
      _id: "$bookId",
      averageRating: { $avg: "$rating" },
      reviewCount: { $sum: 1 }
    }
  },
  { $sort: { averageRating: -1, reviewCount: -1 } }
]);
```

Pipeline d'agrégation : calcul de moyenne et tri en une seule opération.

### 4. Jointure entre collections avec $lookup

```js
db.book_details.aggregate([
  {
    $lookup: {
      from: "reviews",
      localField: "bookId",
      foreignField: "bookId",
      as: "reviews"
    }
  },
  {
    $project: {
      _id: 0,
      bookId: 1,
      title: 1,
      tags: 1,
      reviewCount: { $size: "$reviews" },
      averageRating: { $avg: "$reviews.rating" }
    }
  },
  { $sort: { averageRating: -1 } }
]);
```

Illustre le lien entre `book_details` et `reviews` via `bookId` partagé, avec calcul inline du nombre d'avis et de la note moyenne.

### 5. Nombre de livres par tag (dénormalisation)

```js
db.book_details.aggregate([
  { $unwind: "$tags" },
  { $group: { _id: "$tags", bookCount: { $sum: 1 } } },
  { $sort: { bookCount: -1 } }
]);
```

`$unwind` décompose le tableau `tags` pour agréger par valeur — opération native et performante sur des documents MongoDB.

---

## Redis

Les commandes suivantes sont exécutées par `scripts/test-redis.sh` via `redis-cli` dans le conteneur Docker.

### 1. Compteur de vues (String)

```redis
MGET bookhub:book:book_001:views
        bookhub:book:book_002:views
        bookhub:book:book_003:views
```

Lecture de plusieurs compteurs en une seule commande. L'incrément se fait par `INCR bookhub:book:book_001:views`.

### 2. Classement de popularité (Sorted Set)

```redis
ZREVRANGE bookhub:books:popular 0 4 WITHSCORES
```

Retourne les 5 livres les plus populaires avec leur score. Le Sorted Set maintient automatiquement l'ordre — parfait pour un classement en temps réel mis à jour par `ZINCRBY`.

### 3. Session utilisateur avec TTL (String + expiration)

```redis
GET bookhub:session:user_001
TTL bookhub:session:user_001
```

La session a été créée avec `SETEX bookhub:session:user_001 3600 <data>` (expire après 1 heure). `TTL` retourne le temps restant en secondes — une donnée expirable impossible à gérer aussi simplement en SQL.

### 4. Cache de statistiques globales (Hash)

```redis
HGETALL bookhub:stats
```

Le Hash stocke plusieurs champs dans une seule clé (`total_books`, `total_users`, `active_loans`, etc.), évitant de recalculer ces valeurs à chaque requête.

---

## Neo4j

Les requêtes suivantes sont dans `seeds/neo4j/queries.cypher`, exécutées via `cypher-shell` dans le conteneur Docker.

### 1. Livres similaires à un livre donné

```cypher
MATCH (:Book {id: "book_001"})-[:SIMILAR_TO]-(book:Book)
RETURN DISTINCT book.id AS bookId, book.title AS title, book.author AS author
ORDER BY title;
```

Parcours direct d'une relation `SIMILAR_TO` en une ligne — équivalent à une auto-jointure complexe en SQL.

### 2. Recommandations par similarité (2 niveaux de relations)

```cypher
MATCH (:User {id: "user_002"})-[:LIKES]->(:Book)-[:SIMILAR_TO]->(recommendation:Book)
WHERE NOT (:User {id: "user_002"})-[:LIKES]->(recommendation)
RETURN DISTINCT recommendation.id AS bookId, recommendation.title AS title
ORDER BY title;
```

Recommande des livres similaires à ceux qu'un utilisateur aime, en excluant ce qu'il a déjà liké. Ce parcours multi-niveaux est la valeur centrale de Neo4j.

### 3. Recommandations via le réseau social (amis d'amis)

```cypher
MATCH (:User {id: "user_001"})-[:FOLLOWS]->(followed:User)-[:LIKES]->(book:Book)
WHERE NOT (:User {id: "user_001"})-[:LIKES]->(book)
RETURN DISTINCT followed.firstName AS followedUser, book.id AS bookId, book.title AS title
ORDER BY followedUser, title;
```

Parcourt deux relations (`FOLLOWS` puis `LIKES`) pour proposer des livres aimés par les utilisateurs suivis — pattern "amis d'amis" natif en graphe, très coûteux en SQL (double jointure + sous-requête d'exclusion).

### 4. Livres les plus likés

```cypher
MATCH (user:User)-[:LIKES]->(book:Book)
RETURN book.id AS bookId, book.title AS title, count(user) AS likes
ORDER BY likes DESC, title;
```

### 5. Distribution par catégorie

```cypher
MATCH (book:Book)-[:IN_CATEGORY]->(category:Category)
RETURN category.name AS category, count(book) AS totalBooks
ORDER BY totalBooks DESC, category;
```