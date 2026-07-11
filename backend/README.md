# Backend BookHub

Backend minimal de secours pour demontrer une connexion reelle aux quatre bases du projet. Il sert aussi le frontend.

Il ne necessite aucune dependance npm: il utilise Node.js et les clients deja presents dans les conteneurs Docker (`psql`, `mongosh`, `redis-cli`, `cypher-shell`).

## Lancer

Depuis `backend/` :

```bash
npm start
```

Ou directement :

```bash
node server.js
```

Le serveur ecoute par defaut sur :

```txt
http://localhost:3001
```

La page principale du site est disponible directement sur cette URL.

## Routes de verification

```txt
GET  /health
GET  /api/frontend-data
GET  /api/postgres/books
GET  /api/postgres/loans/active
GET  /api/mongo/book-details
GET  /api/mongo/reviews/book_001
GET  /api/redis/popular-books
POST /api/redis/books/book_001/views
GET  /api/neo4j/recommendations/book_001
GET  /api/neo4j/users/user_002/recommendations
```

## Avant de lancer

Les conteneurs doivent etre demarres et les donnees doivent etre chargees :

```bash
docker compose up -d
bash scripts/seed-postgres.sh
bash scripts/seed-mongo.sh
bash scripts/seed-redis.sh
bash scripts/seed-neo4j.sh
```

## Variables d'environnement possibles

Les valeurs par defaut correspondent au `docker-compose.yml` du projet.

```txt
PORT=3001
POSTGRES_CONTAINER=projet-book-postgres-1
MONGO_CONTAINER=projet-book-mongo-1
REDIS_CONTAINER=projet-book-redis-1
NEO4J_CONTAINER=projet-book-neo4j-1
POSTGRES_USER=bookhub
POSTGRES_DB=bookhub_db
MONGO_USER=root
MONGO_PASSWORD=example
MONGO_DB=bookhub
NEO4J_USER=neo4j
NEO4J_PASSWORD=neo4j_pass
```
