# Dossier de conception - BookHub

## Sujet

BookHub est une application de gestion de bibliotheque. Elle permet de gerer des livres, des utilisateurs, des emprunts, des reservations, des avis et des recommandations.

L'objectif du projet est de montrer une persistance polyglotte: chaque base de donnees est utilisee pour le type de donnees qui lui correspond le mieux.

## Repartition des bases

- PostgreSQL: donnees relationnelles principales comme les utilisateurs, les livres, les emprunts et les reservations.
- MongoDB: donnees flexibles comme les details enrichis des livres, les tags, les metadonnees et les avis.
- Redis: donnees rapides comme les vues, scores de popularite et sessions.
- Neo4j: relations et recommandations entre utilisateurs et livres.

## Architecture globale

```txt
                 +-----------------------+
                 | Application BookHub   |
                 | Frontend / API        |
                 +-----------+-----------+
                             |
        +--------------------+--------------------+
        |                    |                    |
        v                    v                    v
 +-------------+      +-------------+      +-------------+
 | PostgreSQL  |      | MongoDB     |      | Redis       |
 | donnees     |      | documents   |      | cache, TTL, |
 | centrales   |      | enrichis    |      | popularite  |
 +-------------+      +-------------+      +-------------+
                             |
                             v
                       +-------------+
                       | Neo4j       |
                       | relations   |
                       | recomm.     |
                       +-------------+
```

Toutes les bases partagent les memes identifiants fonctionnels (`book_001`, `user_001`, etc.) afin de garder une coherence entre les donnees.

## Connexion reelle aux bases

Un backend minimal est prevu dans le dossier `backend/` pour verifier que l'application interroge reellement les quatre bases.

Routes principales:

```txt
GET  /health
GET  /api/postgres/books
GET  /api/postgres/loans/active
GET  /api/mongo/book-details
GET  /api/mongo/reviews/book_001
GET  /api/redis/popular-books
POST /api/redis/books/book_001/views
GET  /api/neo4j/recommendations/book_001
GET  /api/neo4j/users/user_002/recommendations
```

Ces routes servent de preuve technique:

- PostgreSQL est lu avec des requetes SQL;
- MongoDB est lu avec des requetes sur les collections documentaires;
- Redis est lu et mis a jour avec un compteur de vues;
- Neo4j est lu avec des requetes Cypher de recommandation.

## Tableau de repartition des donnees

| Donnee | Base principale | Pourquoi |
| --- | --- | --- |
| Utilisateurs | PostgreSQL | Donnees structurees avec email unique, role controle et liens vers emprunts/reservations. |
| Livres principaux | PostgreSQL | Entite centrale stable avec titre, auteur, categorie, statut et contraintes. |
| Emprunts | PostgreSQL | Donnees transactionnelles avec integrite referentielle vers utilisateurs et livres. |
| Reservations | PostgreSQL | Donnees relationnelles avec statut et contraintes entre utilisateur et livre. |
| Details enrichis des livres | MongoDB | Resume, tags et metadonnees variables selon les livres. |
| Avis utilisateurs | MongoDB | Documents contenant note, commentaire libre et date de creation. |
| Vues des livres | Redis | Compteurs rapides a lire et a mettre a jour. |
| Classement de popularite | Redis | Sorted set adapte aux tops et scores. |
| Sessions utilisateurs | Redis | Donnees temporaires avec expiration TTL. |
| Statistiques globales cachees | Redis | Cache rapide pour eviter de recalculer des informations frequentes. |
| Likes utilisateur-livre | Neo4j | Relations utiles aux recommandations. |
| Follows entre utilisateurs | Neo4j | Graphe social permettant les recommandations via utilisateurs suivis. |
| Livres similaires | Neo4j | Relation directe entre livres pour proposer des suggestions. |
| Categories de graphe | Neo4j | Parcours par categorie et liens entre livres dans le graphe. |

Certaines informations comme l'identifiant du livre apparaissent dans plusieurs bases. Cette redondance est volontaire: elle permet de relier les donnees entre les bases sans recopier toutes les informations relationnelles partout.

## Partie PostgreSQL

PostgreSQL est utilise comme base relationnelle principale. Elle contient les donnees centrales et transactionnelles de l'application.

### Tables utilisees

```txt
users
books
loans
reservations
```

### Table `users`

Cette table contient les utilisateurs:

- identifiant unique;
- prenom;
- nom;
- email unique;
- role (`student`, `librarian`, `admin`).

L'email est unique et le role est controle par une contrainte `CHECK`.

### Table `books`

Cette table contient les livres principaux:

- identifiant unique;
- titre;
- auteur;
- annee de publication;
- categorie;
- statut (`available`, `borrowed`, `reserved`, `unavailable`).

Le statut est controle par une contrainte `CHECK`, ce qui evite d'avoir des valeurs incoherentes.

### Table `loans`

Cette table represente les emprunts:

- identifiant unique;
- utilisateur;
- livre;
- date d'emprunt;
- date de retour prevue;
- date de retour effective;
- statut (`active`, `returned`, `late`).

Elle utilise deux cles etrangeres:

```txt
loans.user_id -> users.id
loans.book_id -> books.id
```

### Table `reservations`

Cette table represente les reservations:

- identifiant unique;
- utilisateur;
- livre;
- date de reservation;
- statut (`waiting`, `cancelled`, `completed`).

Elle utilise deux cles etrangeres:

```txt
reservations.user_id -> users.id
reservations.book_id -> books.id
```

### Schema relationnel

```txt
users 1 ---- N loans N ---- 1 books
users 1 ---- N reservations N ---- 1 books
```

Un utilisateur peut avoir plusieurs emprunts et plusieurs reservations. Un livre peut etre emprunte ou reserve plusieurs fois dans le temps.

### Requetes de demonstration

Les requetes PostgreSQL sont lancees avec:

```txt
scripts/test-postgres.sh
```

Elles montrent notamment:

- le comptage des lignes par table;
- les livres disponibles par categorie;
- les emprunts actifs ou en retard avec jointures entre `loans`, `users` et `books`;
- les reservations en attente avec jointures entre `reservations`, `users` et `books`.

### Justification du choix PostgreSQL

PostgreSQL est pertinent pour cette partie car les utilisateurs, les livres, les emprunts et les reservations sont des donnees structurees avec des relations fortes. Les cles primaires, cles etrangeres, contraintes `CHECK` et jointures permettent de garantir l'integrite des donnees.

## Partie MongoDB

MongoDB est utilise pour stocker les donnees qui peuvent varier d'un livre a l'autre et qui ne necessitent pas un schema relationnel strict.

### Base utilisee

```txt
bookhub
```

### Collections

```txt
book_details
reviews
```

### Collection `book_details`

Cette collection contient les informations enrichies des livres:

- resume detaille;
- tags;
- metadonnees;
- public cible;
- nombre de pages;
- editeur.

Exemple de document:

```js
{
  bookId: "book_001",
  title: "Dune",
  summary: "Roman de science-fiction centre sur Arrakis...",
  tags: ["science-fiction", "politique", "ecologie", "saga"],
  metadata: {
    language: "fr",
    pages: 688,
    publisher: "Robert Laffont",
    targetAudience: "adultes"
  }
}
```

Cette structure est adaptee a MongoDB car les tags et les metadonnees peuvent evoluer sans modifier un schema SQL.

### Collection `reviews`

Cette collection contient les avis des utilisateurs:

- identifiant de l'avis;
- identifiant utilisateur;
- identifiant livre;
- note;
- commentaire;
- date de creation.

Exemple de document:

```js
{
  id: "review_001",
  userId: "user_001",
  bookId: "book_001",
  rating: 5,
  comment: "Un classique de la science-fiction.",
  createdAt: ISODate("2025-10-08T00:00:00Z")
}
```

Les avis sont stockes dans MongoDB car ils correspondent a des documents pouvant contenir du texte libre et des informations variables.

### Index MongoDB

Les index crees sont:

```js
db.book_details.createIndex({ bookId: 1 }, { unique: true });
db.book_details.createIndex({ tags: 1 });
db.book_details.createIndex({ "metadata.targetAudience": 1 });

db.reviews.createIndex({ id: 1 }, { unique: true });
db.reviews.createIndex({ bookId: 1 });
db.reviews.createIndex({ userId: 1 });
db.reviews.createIndex({ rating: -1 });
db.reviews.createIndex({ createdAt: -1 });
```

Ces index permettent:

- de retrouver rapidement les details d'un livre avec `bookId`;
- de rechercher les livres par tag;
- de filtrer les livres par public cible;
- de retrouver les avis d'un livre;
- de retrouver les avis d'un utilisateur;
- de trier les avis par note ou date.

### Requetes de demonstration

Les requetes MongoDB sont dans:

```txt
seeds/mongo/queries.js
```

Elles montrent notamment:

- la consultation des details enrichis d'un livre;
- la recherche de livres par tag;
- la recherche par public cible;
- l'affichage des avis d'un livre;
- le calcul de la moyenne des notes par livre;
- le classement des meilleurs avis;
- le comptage des livres par tag;
- l'utilisation de `$lookup` entre `book_details` et `reviews`;
- la verification des index.

### Justification du choix MongoDB

MongoDB est pertinent pour cette partie car les details de livres et les avis sont des donnees documentaires:

- un livre peut avoir un nombre variable de tags;
- les metadonnees peuvent changer selon les livres;
- les avis contiennent du texte libre;
- les recherches par tag, note ou public cible sont simples a exprimer en documents JSON.

PostgreSQL reste plus adapte aux donnees relationnelles strictes comme les emprunts et reservations, tandis que MongoDB apporte de la flexibilite pour les informations enrichies.

## Partie Redis

Redis est utilise pour stocker des donnees rapides ou temporaires. Dans BookHub, il sert principalement a representer:

- les vues des livres;
- le classement des livres populaires;
- des sessions utilisateurs avec expiration;
- un cache de statistiques globales.

### Cles utilisees

```txt
bookhub:book:<bookId>:views
bookhub:books:popular
bookhub:session:<userId>
bookhub:stats
```

### Types Redis utilises

- `String`: compteur de vues par livre, par exemple `bookhub:book:book_001:views`.
- `Sorted Set`: classement des livres populaires avec `bookhub:books:popular`.
- `String avec TTL`: sessions utilisateurs avec `SETEX`.
- `Hash`: cache de statistiques globales avec `bookhub:stats`.

### Exemples de commandes

```redis
GET bookhub:book:book_010:views
ZREVRANGE bookhub:books:popular 0 4 WITHSCORES
TTL bookhub:session:user_001
HGETALL bookhub:stats
```

### Scripts

Les scripts Redis sont:

```txt
scripts/seed-redis.sh
scripts/test-redis.sh
```

`seed-redis.sh` initialise les cles Redis a partir des donnees du projet.

`test-redis.sh` verifie les vues, le classement de popularite, les sessions et le cache de statistiques.

### Justification du choix Redis

Redis est pertinent car les vues, les scores de popularite et les sessions sont des donnees rapides a lire et souvent temporaires. Ces donnees ne necessitent pas de relations complexes et peuvent etre consultees tres frequemment par l'application.

## Partie Neo4j

Neo4j est utilise pour representer les relations entre les utilisateurs, les livres et les categories. Cette base est adaptee aux recommandations, car elle permet de parcourir facilement un graphe de relations.

Le service Docker utilise l'image `neo4j:2025.06`, afin de respecter la contrainte du sujet sur une version Neo4j recente.

### Noeuds utilises

```txt
User
Book
Category
```

- `User`: represente un utilisateur de l'application.
- `Book`: represente un livre.
- `Category`: represente une categorie de livre.

### Relations utilisees

```txt
(User)-[:LIKES]->(Book)
(User)-[:FOLLOWS]->(User)
(Book)-[:SIMILAR_TO]->(Book)
(Book)-[:IN_CATEGORY]->(Category)
```

Ces relations permettent de repondre a des questions comme:

- quels utilisateurs aiment un livre precis;
- quels livres sont similaires a un livre donne;
- quels livres recommander a un utilisateur selon ses likes;
- quels livres recommander selon les utilisateurs suivis;
- combien de livres existent par categorie.

### Requetes de demonstration

Les requetes Neo4j sont dans:

```txt
seeds/neo4j/queries.cypher
```

Elles montrent notamment:

- le comptage des noeuds par type;
- les livres similaires a `Dune`;
- les utilisateurs qui aiment `Dune`;
- les recommandations pour un utilisateur selon les livres qu'il aime;
- les recommandations basees sur les utilisateurs suivis;
- le nombre de livres par categorie;
- le classement des livres par nombre de likes.

### Scripts

Les scripts Neo4j sont:

```txt
scripts/seed-neo4j.sh
scripts/test-neo4j.sh
```

`seed-neo4j.sh` initialise le graphe Neo4j avec les donnees du projet.

`test-neo4j.sh` lance les requetes de demonstration pour verifier que les relations et recommandations fonctionnent.

### Justification du choix Neo4j

Neo4j est pertinent pour cette partie car les recommandations reposent sur des relations entre donnees. Dans une base relationnelle, ces parcours demanderaient plusieurs jointures. Dans Neo4j, les chemins comme `User -> LIKES -> Book -> SIMILAR_TO -> Book` sont naturels et lisibles.
