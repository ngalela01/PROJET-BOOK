# BookHub

Project provisoire: BookHub — application de bibliothèque pour démonstration de persistance polyglotte.

## Description

Application démonstrative pour expérimenter plusieurs bases de données (relationnelle, document, clé-valeur, graphe) au sein d'un même projet.

## Technologies utilisées

- Backend: NestJS (Node.js)
- Frontend: React + Vite
- Bases de données:
  - PostgreSQL (relationnel)
  - MongoDB (document)
  - Redis (clé-valeur / cache)
  - Neo4j (graphe)
- Conteneurs: Docker Compose

## Commandes Docker

Lancer les services en arrière-plan:

```bash
docker compose up -d
```

Arrêter les services:

```bash
docker compose down
```

Arrêter et supprimer les volumes de données:

```bash
docker compose down -v
```

## Rôle des bases

- PostgreSQL: stockage relationnel principal (ex: transactions, relations structurées)
- MongoDB: stockage de documents flexibles (ex: contenus enrichis, métadonnées)
- Redis: cache et stockage clé-valeur rapide (ex: sessions, compteurs)
- Neo4j: modélisation et requêtes de graphe (ex: recommandations, relations entre entités)

## Structure

Voir l'arborescence du projet pour les fichiers initiaux et les seeds.

## Collaborateurs

- Nayir GALELA
- Imane BICHON
- Clara LICETTE
