const express = require("express");
const router = express.Router();
const { neo4jDriver } = require("../db");

router.get("/recommendations/:userId", async (req, res) => {
  const session = neo4jDriver.session();
  try {
    const result = await session.run(
      `MATCH (me:User {id: $userId})-[:FOLLOWS]->(friend)-[:LIKES]->(book)
       WHERE NOT (me)-[:LIKES]->(book)
       RETURN DISTINCT book.id AS bookId, book.title AS title, count(friend) AS score
       ORDER BY score DESC
       LIMIT 5`,
      { userId: req.params.userId }
    );
    res.json(result.records.map((r) => ({
      bookId: r.get("bookId"),
      title: r.get("title"),
      score: r.get("score").toNumber(),
    })));
  } finally {
    await session.close();
  }
});

router.get("/similar/:bookId", async (req, res) => {
  const session = neo4jDriver.session();
  try {
    const result = await session.run(
      `MATCH (b:Book {id: $bookId})-[:SIMILAR_TO]->(similar)
       RETURN similar.id AS bookId, similar.title AS title`,
      { bookId: req.params.bookId }
    );
    res.json(result.records.map((r) => ({
      bookId: r.get("bookId"),
      title: r.get("title"),
    })));
  } finally {
    await session.close();
  }
});

router.get("/books/popular", async (req, res) => {
  const session = neo4jDriver.session();
  try {
    const result = await session.run(
      `MATCH (u:User)-[:LIKES]->(b:Book)
       RETURN b.id AS bookId, b.title AS title, count(u) AS likes
       ORDER BY likes DESC
       LIMIT 10`
    );
    res.json(result.records.map((r) => ({
      bookId: r.get("bookId"),
      title: r.get("title"),
      likes: r.get("likes").toNumber(),
    })));
  } finally {
    await session.close();
  }
});

router.get("/categories", async (req, res) => {
  const session = neo4jDriver.session();
  try {
    const result = await session.run(
      `MATCH (b:Book)-[:IN_CATEGORY]->(c:Category)
       RETURN c.name AS category, count(b) AS total
       ORDER BY total DESC`
    );
    res.json(result.records.map((r) => ({
      category: r.get("category"),
      total: r.get("total").toNumber(),
    })));
  } finally {
    await session.close();
  }
});

router.post("/likes", async (req, res) => {
  const { userId, bookId } = req.body;
  const session = neo4jDriver.session();
  try {
    await session.run(
      `MATCH (u:User {id: $userId}), (b:Book {id: $bookId})
       MERGE (u)-[:LIKES]->(b)`,
      { userId, bookId }
    );
    res.status(201).json({ message: `${userId} aime maintenant ${bookId}` });
  } finally {
    await session.close();
  }
});

module.exports = router;
