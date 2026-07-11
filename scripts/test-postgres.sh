#!/bin/bash

set -e

CONTAINER_NAME="projet-book-postgres-1"
DB_USER="bookhub"
DB_NAME="bookhub_db"

echo "Test de PostgreSQL..."

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Erreur : le conteneur ${CONTAINER_NAME} n'est pas lance."
  echo "Lance d'abord :"
  echo "  docker compose up -d"
  exit 1
fi

echo "Tables presentes :"
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "\dt"

echo "Volumes de donnees :"
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 'users' AS table_name, count(*) AS total FROM users UNION ALL SELECT 'books', count(*) FROM books UNION ALL SELECT 'loans', count(*) FROM loans UNION ALL SELECT 'reservations', count(*) FROM reservations ORDER BY table_name;"

echo "Livres disponibles par categorie :"
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT category, count(*) AS available_books FROM books WHERE status = 'available' GROUP BY category ORDER BY available_books DESC, category;"

echo "Emprunts actifs ou en retard avec jointures :"
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT l.id AS loan_id, u.first_name, u.last_name, b.title, l.borrowed_at, l.due_at, l.status FROM loans l JOIN users u ON u.id = l.user_id JOIN books b ON b.id = l.book_id WHERE l.status IN ('active', 'late') ORDER BY l.due_at;"

echo "Reservations en attente avec jointures :"
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT r.id AS reservation_id, u.first_name, u.last_name, b.title, r.reserved_at, r.status FROM reservations r JOIN users u ON u.id = r.user_id JOIN books b ON b.id = r.book_id WHERE r.status = 'waiting' ORDER BY r.reserved_at;"

echo "Tests PostgreSQL termines avec succes."
