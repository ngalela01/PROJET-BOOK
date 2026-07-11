const { Pool } = require("pg");
const { MongoClient } = require("mongodb");
const Redis = require("ioredis");
const neo4j = require("neo4j-driver");

const pgPool = new Pool({
  host: process.env.PG_HOST || "localhost",
  port: process.env.PG_PORT || 5432,
  user: process.env.PG_USER || "bookhub",
  password: process.env.PG_PASSWORD || "bookhub_pass",
  database: process.env.PG_DB || "bookhub_db",
});

const mongoClient = new MongoClient(
  process.env.MONGO_URI || "mongodb://root:example@localhost:27017"
);
let mongoDB = null;

async function connectMongo() {
  await mongoClient.connect();
  mongoDB = mongoClient.db("bookhub");
  console.log("✅ MongoDB connecté");
}

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
});

const neo4jDriver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://localhost:7687",
  neo4j.auth.basic(
    process.env.NEO4J_USER || "neo4j",
    process.env.NEO4J_PASSWORD || "neo4j_pass"
  )
);

function getMongoDB() {
  return mongoDB;
}

module.exports = { pgPool, connectMongo, getMongoDB, redis, neo4jDriver };
