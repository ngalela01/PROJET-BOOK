const express = require("express");
const router = express.Router();
const { pgPool } = require("../db");

router.get("/books", async (req, res) => {
  const result = await pgPool.query(
    "SELECT * FROM books WHERE status = $1 ORDER BY title",
    ["available"]
  );
  res.json(result.rows);
});

router.get("/users", async (req, res) => {
  const result = await pgPool.query(
    "SELECT id, firstname, lastname, email, role FROM users ORDER BY lastname"
  );
  res.json(result.rows);
});

router.get("/loans/active", async (req, res) => {
  const result = await pgPool.query(`
    SELECT l.id, u.firstname, u.lastname, b.title, l.loan_date, l.due_date, l.status
    FROM loans l
    JOIN users u ON l.user_id = u.id
    JOIN books b ON l.book_id = b.id
    WHERE l.status IN ('active', 'late')
    ORDER BY l.due_date
  `);
  res.json(result.rows);
});

router.get("/books/category/:cat", async (req, res) => {
  const result = await pgPool.query(
    "SELECT * FROM books WHERE category = $1 ORDER BY title",
    [req.params.cat]
  );
  res.json(result.rows);
});

router.post("/loans", async (req, res) => {
  const { user_id, book_id, due_date } = req.body;
  const result = await pgPool.query(
    `INSERT INTO loans (user_id, book_id, due_date, status)
     VALUES ($1, $2, $3, 'active') RETURNING *`,
    [user_id, book_id, due_date]
  );
  await pgPool.query("UPDATE books SET status = 'borrowed' WHERE id = $1", [
    book_id,
  ]);
  res.status(201).json(result.rows[0]);
});

module.exports = router;
