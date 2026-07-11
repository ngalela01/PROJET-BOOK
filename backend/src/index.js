const express = require("express");
const { connectMongo, pgPool, redis, neo4jDriver } = require("./db");

const postgresRoutes = require("./routes/postgres");
const mongoRoutes = require("./routes/mongo");
const redisRoutes = require("./routes/redis");
const neo4jRoutes = require("./routes/neo4j");

const app = express();
app.use(express.json());

app.use("/pg", postgresRoutes);
app.use("/mongo", mongoRoutes);
app.use("/redis", redisRoutes);
app.use("/neo4j", neo4jRoutes);

app.get("/health", async (req, res) => {
  const status = { postgres: false, mongodb: false, redis: false, neo4j: false };

  try {
    await pgPool.query("SELECT 1");
    status.postgres = true;
  } catch (e) {
    console.error("PostgreSQL:", e.message);
  }

  try {
    const { getMongoDB } = require("./db");
    await getMongoDB().command({ ping: 1 });
    status.mongodb = true;
  } catch (e) {
    console.error("MongoDB:", e.message);
  }

  try {
    await redis.ping();
    status.redis = true;
  } catch (e) {
    console.error("Redis:", e.message);
  }

  try {
    const session = neo4jDriver.session();
    await session.run("RETURN 1");
    await session.close();
    status.neo4j = true;
  } catch (e) {
    console.error("Neo4j:", e.message);
  }

  const allOk = Object.values(status).every(Boolean);
  res.status(allOk ? 200 : 500).json({ status, ok: allOk });
});

async function start() {
  await connectMongo();

  await pgPool.connect().then(() => console.log("✅ PostgreSQL connecté"));
  redis.on("connect", () => console.log("✅ Redis connecté"));
  await neo4jDriver.verifyConnectivity().then(() => console.log("✅ Neo4j connecté"));

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\n🚀 BookHub backend démarré sur http://localhost:${PORT}`);
    console.log(`   GET  /health              → état des 4 connexions`);
    console.log(`   GET  /pg/books            → livres disponibles (PostgreSQL)`);
    console.log(`   GET  /pg/loans/active     → emprunts actifs avec jointures`);
    console.log(`   GET  /mongo/books/:id     → détails enrichis (MongoDB)`);
    console.log(`   GET  /mongo/stats/tags    → agrégation par tag`);
    console.log(`   GET  /redis/popular       → top livres (Sorted Set)`);
    console.log(`   GET  /neo4j/recommendations/:userId → recommandations graphe`);
  });
}

start().catch((err) => {
  console.error("Erreur au démarrage:", err);
  process.exit(1);
});
