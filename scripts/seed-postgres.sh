#!/bin/bash

set -e

CONTAINER_NAME="projet-book-postgres-1"
DB_USER="bookhub"
DB_NAME="bookhub_db"

INIT_FILE="seeds/postgres/init.sql"
SEED_FILE="seeds/postgres/seed.sql"

echo "Initialisation de PostgreSQL..."

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Erreur : le conteneur ${CONTAINER_NAME} n'est pas lancé."
  echo "Lance d'abord :"
  echo "  docker compose up -d"
  exit 1
fi

if [ ! -f "$INIT_FILE" ]; then
  echo "Erreur : fichier introuvable : $INIT_FILE"
  exit 1
fi

if [ ! -f "$SEED_FILE" ]; then
  echo "Erreur : fichier introuvable : $SEED_FILE"
  exit 1
fi

echo "Création / réinitialisation des tables..."
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$INIT_FILE"

echo "Insertion des données..."
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$SEED_FILE"

echo "Vérification des tables..."
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "\dt"

echo "PostgreSQL a été initialisé avec succès."