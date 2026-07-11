// Requetes de demonstration MongoDB pour BookHub.
// A lancer dans mongosh apres l'initialisation de seeds/mongo/init.js.

const dbName = process.env.MONGO_INITDB_DATABASE || "bookhub";

db = db.getSiblingDB(dbName);

if (typeof config !== "undefined") {
  config.set("displayBatchSize", 100);
}

// 1. Afficher les details enrichis d'un livre.
db.book_details.findOne(
  { bookId: "book_001" },
  { _id: 0, bookId: 1, title: 1, summary: 1, tags: 1, metadata: 1 }
);

// 2. Trouver les livres qui possedent un tag precis.
db.book_details.find(
  { tags: "science-fiction" },
  { _id: 0, bookId: 1, title: 1, tags: 1 }
);

// 3. Trouver les livres destines a un public donne.
db.book_details.find(
  { "metadata.targetAudience": "lycee" },
  { _id: 0, bookId: 1, title: 1, "metadata.targetAudience": 1 }
);

// 4. Afficher les avis d'un livre.
db.reviews.find(
  { bookId: "book_001" },
  { _id: 0, id: 1, userId: 1, rating: 1, comment: 1, createdAt: 1 }
);

// 5. Calculer la moyenne des notes par livre.
db.reviews.aggregate([
  {
    $group: {
      _id: "$bookId",
      averageRating: { $avg: "$rating" },
      reviewCount: { $sum: 1 }
    }
  },
  { $sort: { averageRating: -1, reviewCount: -1 } }
]);

// 6. Afficher les meilleurs avis.
db.reviews.find(
  { rating: { $gte: 4 } },
  { _id: 0, bookId: 1, userId: 1, rating: 1, comment: 1 }
).sort({ rating: -1, createdAt: -1 });

// 7. Compter le nombre de livres par tag.
db.book_details.aggregate([
  { $unwind: "$tags" },
  {
    $group: {
      _id: "$tags",
      bookCount: { $sum: 1 }
    }
  },
  { $sort: { bookCount: -1, _id: 1 } }
]);

// 8. Associer details de livres et avis avec $lookup.
db.book_details.aggregate([
  {
    $lookup: {
      from: "reviews",
      localField: "bookId",
      foreignField: "bookId",
      as: "reviews"
    }
  },
  {
    $project: {
      _id: 0,
      bookId: 1,
      title: 1,
      tags: 1,
      reviewCount: { $size: "$reviews" },
      averageRating: { $avg: "$reviews.rating" }
    }
  },
  { $sort: { averageRating: -1, reviewCount: -1 } }
]);

// 9. Rechercher dans le resume avec une expression reguliere.
db.book_details.find(
  { summary: /science-fiction/i },
  { _id: 0, bookId: 1, title: 1, summary: 1 }
);

// 10. Verifier les index crees.
db.book_details.getIndexes();
db.reviews.getIndexes();
