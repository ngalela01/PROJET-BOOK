const express = require("express");
const router = express.Router();
const { getMongoDB } = require("../db");

router.get("/books/:bookId", async (req, res) => {
  const db = getMongoDB();
  const doc = await db
    .collection("book_details")
    .findOne({ bookId: req.params.bookId });
  if (!doc) return res.status(404).json({ error: "Livre non trouvé" });
  res.json(doc);
});

router.get("/books/tag/:tag", async (req, res) => {
  const db = getMongoDB();
  const docs = await db
    .collection("book_details")
    .find({ tags: req.params.tag })
    .toArray();
  res.json(docs);
});

router.get("/reviews/:bookId", async (req, res) => {
  const db = getMongoDB();
  const reviews = await db
    .collection("reviews")
    .find({ bookId: req.params.bookId })
    .sort({ rating: -1 })
    .toArray();

  const avg =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  res.json({ bookId: req.params.bookId, averageRating: avg, reviews });
});

router.get("/stats/tags", async (req, res) => {
  const db = getMongoDB();
  const result = await db
    .collection("book_details")
    .aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])
    .toArray();
  res.json(result);
});

router.post("/reviews", async (req, res) => {
  const db = getMongoDB();
  const review = {
    ...req.body,
    createdAt: new Date(),
  };
  const result = await db.collection("reviews").insertOne(review);
  res.status(201).json({ insertedId: result.insertedId, ...review });
});

module.exports = router;
