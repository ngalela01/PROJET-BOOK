#!/bin/bash

set -e

CONTAINER_NAME="projet-book-redis-1"

echo "Test de Redis..."

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Erreur : le conteneur ${CONTAINER_NAME} n'est pas lance."
  echo "Lance d'abord :"
  echo "  docker compose up -d"
  exit 1
fi

echo "Vues par livre :"
docker exec -i "$CONTAINER_NAME" redis-cli MGET \
  bookhub:book:book_001:views \
  bookhub:book:book_002:views \
  bookhub:book:book_003:views \
  bookhub:book:book_006:views \
  bookhub:book:book_010:views

echo "Top livres populaires :"
docker exec -i "$CONTAINER_NAME" redis-cli ZREVRANGE bookhub:books:popular 0 4 WITHSCORES

echo "Sessions et TTL :"
docker exec -i "$CONTAINER_NAME" redis-cli GET bookhub:session:user_001
docker exec -i "$CONTAINER_NAME" redis-cli TTL bookhub:session:user_001

echo "Cache de statistiques :"
docker exec -i "$CONTAINER_NAME" redis-cli HGETALL bookhub:stats

echo "Tests Redis termines avec succes."
