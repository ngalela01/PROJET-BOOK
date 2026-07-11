const express = require("express");
const router = express.Router();
const { redis } = require("../db");

router.post("/books/:bookId/view", async (req, res) => {
  const key = `bookhub:book:${req.params.bookId}:views`;
  const views = await redis.incr(key);
  await redis.zincrby("bookhub:books:popular", 1, req.params.bookId);
  res.json({ bookId: req.params.bookId, views });
});

router.get("/books/:bookId/views", async (req, res) => {
  const views = await redis.get(`bookhub:book:${req.params.bookId}:views`);
  res.json({ bookId: req.params.bookId, views: parseInt(views) || 0 });
});

router.get("/popular", async (req, res) => {
  const top = await redis.zrevrange("bookhub:books:popular", 0, 4, "WITHSCORES");
  const result = [];
  for (let i = 0; i < top.length; i += 2) {
    result.push({ bookId: top[i], score: parseInt(top[i + 1]) });
  }
  res.json(result);
});

router.post("/sessions/:userId", async (req, res) => {
  const key = `bookhub:session:${req.params.userId}`;
  const sessionData = JSON.stringify({ userId: req.params.userId, ...req.body });
  await redis.setex(key, 3600, sessionData);
  const ttl = await redis.ttl(key);
  res.status(201).json({ key, ttl, message: "Session créée (expire dans 1h)" });
});

router.get("/sessions/:userId", async (req, res) => {
  const key = `bookhub:session:${req.params.userId}`;
  const data = await redis.get(key);
  if (!data) return res.status(404).json({ error: "Session expirée ou inexistante" });
  const ttl = await redis.ttl(key);
  res.json({ session: JSON.parse(data), ttl });
});

router.get("/stats", async (req, res) => {
  const stats = await redis.hgetall("bookhub:stats");
  res.json(stats);
});

module.exports = router;
