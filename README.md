# BookHub

BookHub est une application de gestion et d'emprunt de livres réalisée dans le cadre du projet NoSQL sur la persistance polyglotte.

L'objectif est de montrer comment une même application peut utiliser plusieurs bases de données selon leur rôle :

- PostgreSQL pour les données relationnelles principales ;
- MongoDB pour les documents enrichis ;
- Redis pour les données rapides ou temporaires ;
- Neo4j pour les relations et recommandations.

L'application reste volontairement simple. Le cœur du projet est la mise en place des bases, leur alimentation, leur utilisation et la justification de la répartition des données.

---

## Technologies utilisées

- Docker Compose
- PostgreSQL
- MongoDB
- Redis
- Neo4j

Les parties backend et frontend pourront être ajoutées ensuite.

## Rôle des fichiers principaux

- `docker-compose.yml` lance les quatre bases de données du projet.
- `seeds/common/data.json` contient les données communes et les identifiants partagés entre les bases.
- `seeds/postgres/init.sql` crée les tables PostgreSQL.
- `seeds/postgres/seed.sql` insère les données de test dans PostgreSQL.
- `scripts/seed-postgres.sh` initialise PostgreSQL automatiquement en lançant `init.sql` puis `seed.sql`.

Le fichier `data.json` sert de base commune pour garder les mêmes identifiants dans toutes les bases.

Exemples :

```txt
user_001
book_001
loan_001
reservation_001
```

Ces identifiants permettent de relier les données entre PostgreSQL, MongoDB, Redis et Neo4j.

---

## Lancer le projet

Depuis la racine du projet :

```bash
docker compose up -d
bash scripts/seed-postgres.sh
```

Cette commande lance les conteneurs suivants :

- PostgreSQL
- MongoDB
- Redis
- Neo4j

Pour vérifier que les conteneurs tournent :

```bash
docker compose ps
```

ou :

```bash
docker ps
```

---

## Initialiser PostgreSQL

Après avoir lancé les conteneurs Docker, il faut initialiser PostgreSQL.

Depuis la racine du projet :

```bash
chmod +x scripts/seed-postgres.sh
./scripts/seed-postgres.sh
```

Ce script :

1. vérifie que le conteneur PostgreSQL est lancé ;
2. crée les tables avec `seeds/postgres/init.sql` ;
3. insère les données avec `seeds/postgres/seed.sql` ;
4. affiche la liste des tables créées.

Cette méthode est recommandée car elle fonctionne pour tous les membres du groupe sans dépendre des extensions SQL de VS Code.

---

## Vérifier PostgreSQL manuellement

Pour entrer dans PostgreSQL :

```bash
docker exec -it projet-book-postgres-1 psql -U bookhub -d bookhub_db
```

Lister les tables :

```sql
\dt
```

Résultat attendu :

```txt
books
loans
reservations
users
```

Tester les données :

```sql
SELECT * FROM users;
SELECT * FROM books;
SELECT * FROM loans;
SELECT * FROM reservations;
```

Pour quitter PostgreSQL :

```sql
\q
```

---

## Modèle PostgreSQL

PostgreSQL est la base principale du projet. Elle contient les données structurées et relationnelles.

Tables utilisées :

- `users` : utilisateurs de l'application ;
- `books` : livres disponibles dans la bibliothèque ;
- `loans` : emprunts de livres ;
- `reservations` : réservations de livres.

### Relations entre les tables

```txt
users 1 ---- N loans
books 1 ---- N loans

users 1 ---- N reservations
books 1 ---- N reservations
```

Cela signifie que :

- un utilisateur peut avoir plusieurs emprunts ;
- un livre peut être emprunté plusieurs fois dans le temps ;
- un utilisateur peut faire plusieurs réservations ;
- un livre peut avoir plusieurs réservations.

Clés étrangères principales :

```txt
loans.user_id          -> users.id
loans.book_id          -> books.id
reservations.user_id   -> users.id
reservations.book_id   -> books.id
```

## Workflow conseillé

Pour récupérer et lancer le projet :

```bash
git clone <url-du-repo>
cd PROJET-BOOK
docker compose up -d
chmod +x scripts/seed-postgres.sh
./scripts/seed-postgres.sh
```

Pour vérifier que PostgreSQL fonctionne :

```bash
docker exec -it projet-book-postgres-1 psql -U bookhub -d bookhub_db
```

Puis :

```sql
\dt
SELECT * FROM users;
```

Pour quitter :

```sql
\q
```

## Arrêter le projet

Arrêter les conteneurs :

```bash
docker compose down
```

Arrêter les conteneurs et supprimer les volumes :

```bash
docker compose down -v
```

Attention : `docker compose down -v` supprime les données enregistrées dans les volumes Docker.

---

## Initialiser et tester MongoDB

Apres avoir lance les conteneurs Docker, MongoDB peut etre initialise avec :

```bash
bash scripts/seed-mongo.sh
```

Ce script cree les collections `book_details` et `reviews`, insere les details enrichis des livres, les avis utilisateurs et les index MongoDB.

Pour lancer les requetes de demonstration :

```bash
bash scripts/test-mongo.sh
```

Ce script verifie les collections, compte les documents et execute `seeds/mongo/queries.js`.

---

## Initialiser et tester Redis

Apres avoir lance les conteneurs Docker, Redis peut etre initialise avec :

```bash
bash scripts/seed-redis.sh
```

Ce script insere les vues des livres, le classement de popularite, les sessions temporaires et un cache de statistiques.

Pour tester Redis :

```bash
bash scripts/test-redis.sh
```

Ce script verifie les compteurs de vues, le top des livres populaires, le TTL d'une session et le cache `bookhub:stats`.

---

## Initialiser et tester Neo4j

Apres avoir lance les conteneurs Docker, Neo4j peut etre initialise avec :

```bash
bash scripts/seed-neo4j.sh
```

Ce script cree le graphe de recommandation avec les noeuds `User`, `Book` et `Category`, puis ajoute les relations `LIKES`, `FOLLOWS`, `SIMILAR_TO` et `IN_CATEGORY`.

Pour lancer les requetes de demonstration :

```bash
bash scripts/test-neo4j.sh
```

Ce script execute `seeds/neo4j/queries.cypher` et montre notamment les recommandations de livres, les utilisateurs qui aiment un livre, les livres par categorie et les relations sociales entre utilisateurs.

---

## Collaborateurs

- Nayir GALELA
- Imane BICHON
- Clara LICETTE
