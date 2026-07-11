#!/bin/bash

set -e

CONTAINER_NAME="projet-book-redis-1"
SEED_FILE="seeds/redis/init.redis"

echo "Initialisation de Redis..."

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

echo "Insertion des cles Redis..."
docker exec -i "$CONTAINER_NAME" redis-cli < "$SEED_FILE"

echo "Verification Redis..."
docker exec -i "$CONTAINER_NAME" redis-cli GET bookhub:book:book_010:views
docker exec -i "$CONTAINER_NAME" redis-cli ZREVRANGE bookhub:books:popular 0 2 WITHSCORES
docker exec -i "$CONTAINER_NAME" redis-cli HGETALL bookhub:stats

echo "Redis a ete initialise avec succes."
