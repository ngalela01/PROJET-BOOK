#!/bin/bash

set -e

CONTAINER_NAME="projet-book-neo4j-1"
QUERIES_FILE="seeds/neo4j/queries.cypher"
DB_USER="neo4j"
DB_PASSWORD="neo4j_pass"

echo "Test de Neo4j..."

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Erreur : le conteneur ${CONTAINER_NAME} n'est pas lance."
  echo "Lance d'abord :"
  echo "  docker compose up -d"
  exit 1
fi

if [ ! -f "$QUERIES_FILE" ]; then
  echo "Erreur : fichier introuvable : $QUERIES_FILE"
  exit 1
fi

echo "Requetes de demonstration :"
docker exec -i "$CONTAINER_NAME" cypher-shell -u "$DB_USER" -p "$DB_PASSWORD" < "$QUERIES_FILE"

echo "Tests Neo4j termines avec succes."
