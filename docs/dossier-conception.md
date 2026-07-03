# Dossier de conception - BookHub

## Sujet

BookHub est une application de gestion de bibliotheque. Elle permet de gerer des livres, des utilisateurs, des emprunts, des reservations, des avis et des recommandations.

L'objectif du projet est de montrer une persistance polyglotte: chaque base de donnees est utilisee pour le type de donnees qui lui correspond le mieux.

## Repartition des bases

- PostgreSQL: donnees relationnelles principales comme les utilisateurs, les livres, les emprunts et les reservations.
- MongoDB: donnees flexibles comme les details enrichis des livres, les tags, les metadonnees et les avis.
- Redis: donnees rapides comme les vues, scores de popularite et sessions.
- Neo4j: relations et recommandations entre utilisateurs et livres.

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
