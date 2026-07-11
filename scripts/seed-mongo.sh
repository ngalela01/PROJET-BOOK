#!/bin/bash

set -e

CONTAINER_NAME="projet-book-mongo-1"
DB_USER="root"
DB_PASSWORD="example"
DB_NAME="bookhub"
INIT_FILE="seeds/mongo/init.js"

echo "Initialisation de MongoDB..."

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Erreur : le conteneur ${CONTAINER_NAME} n'est pas lance."
  echo "Lance d'abord :"
  echo "  docker compose up -d"
  exit 1
fi

if [ ! -f "$INIT_FILE" ]; then
  echo "Erreur : fichier introuvable : $INIT_FILE"
  exit 1
fi

echo "Creation / reinitalisation des collections MongoDB..."
docker exec -i "$CONTAINER_NAME" mongosh \
  -u "$DB_USER" \
  -p "$DB_PASSWORD" \
  --authenticationDatabase admin \
  "$DB_NAME" < "$INIT_FILE"

echo "Verification des collections..."
docker exec -i "$CONTAINER_NAME" mongosh \
  -u "$DB_USER" \
  -p "$DB_PASSWORD" \
  --authenticationDatabase admin \
  "$DB_NAME" \
  --quiet \
  --eval "print('book_details=' + db.book_details.countDocuments()); print('reviews=' + db.reviews.countDocuments());"

echo "MongoDB a ete initialise avec succes."
