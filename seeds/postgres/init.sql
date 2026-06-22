-- Seed minimal pour PostgreSQL
CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  published_year INT
);

INSERT INTO books (title, author, published_year)
VALUES ('Example Book', 'Author Example', 2020)
ON CONFLICT DO NOTHING;
