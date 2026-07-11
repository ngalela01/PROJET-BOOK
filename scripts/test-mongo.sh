#!/bin/bash

set -e

CONTAINER_NAME="projet-book-mongo-1"
DB_USER="root"
DB_PASSWORD="example"
DB_NAME="bookhub"
QUERIES_FILE="seeds/mongo/queries.js"

echo "Test de MongoDB..."

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

echo "Collections et volumes de donnees :"
docker exec -i "$CONTAINER_NAME" mongosh \
  -u "$DB_USER" \
  -p "$DB_PASSWORD" \
  --authenticationDatabase admin \
  "$DB_NAME" \
  --quiet \
  --eval "print('collections=' + db.getCollectionNames().join(',')); print('book_details=' + db.book_details.countDocuments()); print('reviews=' + db.reviews.countDocuments());"

echo "Execution des requetes de demonstration..."
docker exec -i "$CONTAINER_NAME" mongosh \
  -u "$DB_USER" \
  -p "$DB_PASSWORD" \
  --authenticationDatabase admin \
  "$DB_NAME" \
  --quiet < "$QUERIES_FILE"

echo "Tests MongoDB termines avec succes."
