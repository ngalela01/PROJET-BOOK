#!/bin/bash

set -e

CONTAINER_NAME="projet-book-neo4j-1"
SEED_FILE="seeds/neo4j/init.cypher"
DB_USER="neo4j"
DB_PASSWORD="neo4j_pass"

echo "Initialisation de Neo4j..."

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Erreur : le conteneur ${CONTAINER_NAME} n'est pas lance."
  echo "Lance d'abord :"
  echo "  docker compose up -d"
  exit 1
fi

if [ ! -f "$SEED_FILE" ]; then
  echo "Erreur : fichier introuvable : $SEED_FILE"
  exit 1
fi

echo "Creation du graphe Neo4j..."
docker exec -i "$CONTAINER_NAME" cypher-shell -u "$DB_USER" -p "$DB_PASSWORD" < "$SEED_FILE"

echo "Verification Neo4j..."
docker exec -i "$CONTAINER_NAME" cypher-shell -u "$DB_USER" -p "$DB_PASSWORD" \
  "MATCH (n) RETURN labels(n)[0] AS type, count(n) AS total ORDER BY type;"

echo "Neo4j a ete initialise avec succes."
