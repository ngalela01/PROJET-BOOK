// Seed minimal pour MongoDB
const dbName = process.env.MONGO_INITDB_DATABASE || 'bookhub';

db = db.getSiblingDB(dbName);

if (!db.books.findOne()) {
  db.books.insertMany([
    { title: 'Example Book', author: 'Author Example', year: 2020 }
  ]);
}
