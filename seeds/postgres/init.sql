SELECT current_database();

DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS loans;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS users;


CREATE TABLE users (
  id VARCHAR(20) PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'librarian', 'admin'))
);

CREATE TABLE books (
  id VARCHAR(20) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  published_year INT,
  category VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('available', 'borrowed', 'reserved', 'unavailable'))
);

CREATE TABLE loans (
  id VARCHAR(20) PRIMARY KEY,
  user_id VARCHAR(20) NOT NULL,
  book_id VARCHAR(20) NOT NULL,
  borrowed_at DATE NOT NULL,
  due_at DATE NOT NULL,
  returned_at DATE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'returned', 'late')),

  CONSTRAINT fk_loans_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_loans_book
    FOREIGN KEY (book_id)
    REFERENCES books(id)
    ON DELETE CASCADE
);

CREATE TABLE reservations (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(20) NOT NULL,
  book_id VARCHAR(20) NOT NULL,
  reserved_at DATE NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('waiting', 'cancelled', 'completed')),

  CONSTRAINT fk_reservations_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_reservations_book
    FOREIGN KEY (book_id)
    REFERENCES books(id)
    ON DELETE CASCADE
);