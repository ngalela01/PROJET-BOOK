const { execFile } = require("node:child_process");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { URL } = require("node:url");

const PORT = Number(process.env.PORT || 3001);

const CONTAINERS = {
  postgres: process.env.POSTGRES_CONTAINER || "projet-book-postgres-1",
  mongo: process.env.MONGO_CONTAINER || "projet-book-mongo-1",
  redis: process.env.REDIS_CONTAINER || "projet-book-redis-1",
  neo4j: process.env.NEO4J_CONTAINER || "projet-book-neo4j-1"
};

const CREDENTIALS = {
  postgresUser: process.env.POSTGRES_USER || "bookhub",
  postgresDb: process.env.POSTGRES_DB || "bookhub_db",
  mongoUser: process.env.MONGO_USER || "root",
  mongoPassword: process.env.MONGO_PASSWORD || "example",
  mongoDb: process.env.MONGO_DB || "bookhub",
  neo4jUser: process.env.NEO4J_USER || "neo4j",
  neo4jPassword: process.env.NEO4J_PASSWORD || "neo4j_pass"
};

const FRONTEND_DIR = path.join(__dirname, "..", "frontend");
const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { timeout: 15000, ...options }, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
        return;
      }

      resolve(stdout.trim());
    });
  });
}

function dockerExec(container, args) {
  return run("docker", ["exec", "-i", container, ...args]);
}

function isSafeId(value) {
  return /^[a-z]+_[0-9]{3}$/.test(value);
}

function parseJsonLines(output) {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function parseRedisPopularBooks(output) {
  const values = output.split(/\r?\n/).filter(Boolean);
  const books = [];

  for (let index = 0; index < values.length; index += 2) {
    books.push({
      bookId: values[index],
      score: Number(values[index + 1])
    });
  }

  return books;
}

async function postgresJson(sql) {
  const output = await dockerExec(CONTAINERS.postgres, [
    "psql",
    "-U",
    CREDENTIALS.postgresUser,
    "-d",
    CREDENTIALS.postgresDb,
    "-t",
    "-A",
    "-c",
    sql
  ]);

  if (!output) {
    return [];
  }

  return parseJsonLines(output);
}

async function mongoJson(script) {
  const output = await dockerExec(CONTAINERS.mongo, [
    "mongosh",
    "-u",
    CREDENTIALS.mongoUser,
    "-p",
    CREDENTIALS.mongoPassword,
    "--authenticationDatabase",
    "admin",
    CREDENTIALS.mongoDb,
    "--quiet",
    "--eval",
    script
  ]);

  return output ? JSON.parse(output) : null;
}

async function redis(args) {
  return dockerExec(CONTAINERS.redis, ["redis-cli", ...args]);
}

async function neo4jJson(query) {
  const output = await dockerExec(CONTAINERS.neo4j, [
    "cypher-shell",
    "-u",
    CREDENTIALS.neo4jUser,
    "-p",
    CREDENTIALS.neo4jPassword,
    "--format",
    "plain",
    query
  ]);

  const lines = output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length <= 1) {
    return [];
  }

  const headers = lines[0].split(",").map((header) => header.trim().replace(/^"|"$/g, ""));

  return lines.slice(1).map((line) => {
    const values = line.match(/(".*?"|[^,]+)/g) || [];
    return Object.fromEntries(headers.map((header, index) => [
      header,
      (values[index] || "").trim().replace(/^"|"$/g, "")
    ]));
  });
}

async function postgresSnapshot() {
  const rows = await postgresJson(`
    SELECT json_build_object(
      'books', (
        SELECT COALESCE(json_agg(row_to_json(book_rows)), '[]'::json)
        FROM (
          SELECT
            id,
            title,
            author,
            published_year AS "publishedYear",
            category,
            status
          FROM books
          ORDER BY title
        ) book_rows
      ),
      'users', (
        SELECT COALESCE(json_agg(row_to_json(user_rows)), '[]'::json)
        FROM (
          SELECT
            id,
            first_name AS "firstName",
            last_name AS "lastName",
            email,
            role
          FROM users
          ORDER BY id
        ) user_rows
      ),
      'loans', (
        SELECT COALESCE(json_agg(row_to_json(loan_rows)), '[]'::json)
        FROM (
          SELECT
            id,
            user_id AS "userId",
            book_id AS "bookId",
            borrowed_at AS "borrowedAt",
            due_at AS "dueAt",
            returned_at AS "returnedAt",
            status
          FROM loans
          ORDER BY due_at
        ) loan_rows
      ),
      'reservations', (
        SELECT COALESCE(json_agg(row_to_json(reservation_rows)), '[]'::json)
        FROM (
          SELECT
            id,
            user_id AS "userId",
            book_id AS "bookId",
            reserved_at AS "reservedAt",
            status
          FROM reservations
          ORDER BY reserved_at
        ) reservation_rows
      )
    );
  `);

  return rows[0] || {
    books: [],
    users: [],
    loans: [],
    reservations: []
  };
}

async function mongoSnapshot() {
  return mongoJson(`
    JSON.stringify({
      bookDetails: db.book_details
        .find({}, { _id: 0 })
        .sort({ title: 1 })
        .toArray(),
      reviews: db.reviews
        .find({}, { _id: 0 })
        .sort({ createdAt: -1 })
        .toArray()
    })
  `);
}

const routes = {
  "GET /health": async () => {
    const checks = {};

    try {
      await postgresJson("SELECT json_build_object('ok', 1);");
      checks.postgres = "ok";
    } catch (error) {
      checks.postgres = error.message;
    }

    try {
      await mongoJson("JSON.stringify(db.runCommand({ ping: 1 }))");
      checks.mongo = "ok";
    } catch (error) {
      checks.mongo = error.message;
    }

    try {
      await redis(["PING"]);
      checks.redis = "ok";
    } catch (error) {
      checks.redis = error.message;
    }

    try {
      await neo4jJson("RETURN 1 AS ok;");
      checks.neo4j = "ok";
    } catch (error) {
      checks.neo4j = error.message;
    }

    return {
      status: Object.values(checks).every((value) => value === "ok") ? "ok" : "partial",
      checks
    };
  },

  "GET /api/frontend-data": async () => {
    const [postgresData, mongoData, popularOutput, similarBooks] = await Promise.all([
      postgresSnapshot(),
      mongoSnapshot(),
      redis(["ZREVRANGE", "bookhub:books:popular", "0", "4", "WITHSCORES"]),
      neo4jJson(`
        MATCH (from:Book)-[:SIMILAR_TO]->(to:Book)
        RETURN from.id AS fromBookId, to.id AS toBookId
        ORDER BY fromBookId, toBookId;
      `)
    ]);

    const popularBooks = parseRedisPopularBooks(popularOutput);

    return {
      ...postgresData,
      reviews: mongoData.reviews || [],
      bookDetails: mongoData.bookDetails || [],
      similarBooks,
      redis: {
        popularScores: popularBooks,
        bookViews: popularBooks.map((item) => ({
          bookId: item.bookId,
          views: item.score
        }))
      }
    };
  },

  "GET /api/postgres/books": async () => postgresJson(`
    SELECT json_build_object(
      'id', id,
      'title', title,
      'author', author,
      'publishedYear', published_year,
      'category', category,
      'status', status
    )
    FROM books
    ORDER BY title;
  `),

  "GET /api/postgres/users": async () => postgresJson(`
    SELECT json_build_object(
      'id', id,
      'firstName', first_name,
      'lastName', last_name,
      'email', email,
      'role', role
    )
    FROM users
    ORDER BY id;
  `),

  "GET /api/postgres/loans/active": async () => postgresJson(`
    SELECT json_build_object(
      'loanId', l.id,
      'id', l.id,
      'userId', u.id,
      'bookId', b.id,
      'firstName', u.first_name,
      'lastName', u.last_name,
      'title', b.title,
      'borrowedAt', l.borrowed_at,
      'dueAt', l.due_at,
      'status', l.status
    )
    FROM loans l
    JOIN users u ON u.id = l.user_id
    JOIN books b ON b.id = l.book_id
    WHERE l.status IN ('active', 'late')
    ORDER BY l.due_at;
  `),

  "GET /api/postgres/reservations/waiting": async () => postgresJson(`
    SELECT json_build_object(
      'reservationId', r.id,
      'id', r.id,
      'userId', u.id,
      'bookId', b.id,
      'firstName', u.first_name,
      'lastName', u.last_name,
      'title', b.title,
      'reservedAt', r.reserved_at,
      'status', r.status
    )
    FROM reservations r
    JOIN users u ON u.id = r.user_id
    JOIN books b ON b.id = r.book_id
    WHERE r.status = 'waiting'
    ORDER BY r.reserved_at;
  `),

  "GET /api/mongo/book-details": async () => mongoJson(`
    JSON.stringify(
      db.book_details
        .find({}, { _id: 0 })
        .sort({ title: 1 })
        .toArray()
    )
  `),

  "GET /api/redis/popular-books": async () => {
    const output = await redis(["ZREVRANGE", "bookhub:books:popular", "0", "4", "WITHSCORES"]);
    return parseRedisPopularBooks(output);
  }
};

async function routeRequest(method, pathname) {
  const directRoute = routes[`${method} ${pathname}`];
  if (directRoute) {
    return directRoute();
  }

  const mongoReviewMatch = pathname.match(/^\/api\/mongo\/reviews\/([^/]+)$/);
  if (method === "GET" && mongoReviewMatch) {
    const bookId = mongoReviewMatch[1];
    if (!isSafeId(bookId)) {
      return { statusCode: 400, body: { error: "bookId invalide" } };
    }

    return mongoJson(`
      JSON.stringify(
        db.reviews
          .find({ bookId: "${bookId}" }, { _id: 0 })
          .sort({ createdAt: -1 })
          .toArray()
      )
    `);
  }

  const redisViewsMatch = pathname.match(/^\/api\/redis\/books\/([^/]+)\/views$/);
  if (method === "POST" && redisViewsMatch) {
    const bookId = redisViewsMatch[1];
    if (!isSafeId(bookId)) {
      return { statusCode: 400, body: { error: "bookId invalide" } };
    }

    const key = `bookhub:book:${bookId}:views`;
    const views = Number(await redis(["INCR", key]));
    await redis(["ZADD", "bookhub:books:popular", String(views), bookId]);

    return {
      statusCode: 201,
      body: { bookId, views }
    };
  }

  const neo4jBookMatch = pathname.match(/^\/api\/neo4j\/recommendations\/([^/]+)$/);
  if (method === "GET" && neo4jBookMatch) {
    const bookId = neo4jBookMatch[1];
    if (!isSafeId(bookId)) {
      return { statusCode: 400, body: { error: "bookId invalide" } };
    }

    return neo4jJson(`
      MATCH (:Book {id: "${bookId}"})-[:SIMILAR_TO]-(recommendation:Book)
      RETURN DISTINCT recommendation.id AS bookId, recommendation.title AS title, recommendation.author AS author
      ORDER BY title;
    `);
  }

  const neo4jUserMatch = pathname.match(/^\/api\/neo4j\/users\/([^/]+)\/recommendations$/);
  if (method === "GET" && neo4jUserMatch) {
    const userId = neo4jUserMatch[1];
    if (!isSafeId(userId)) {
      return { statusCode: 400, body: { error: "userId invalide" } };
    }

    return neo4jJson(`
      MATCH (:User {id: "${userId}"})-[:LIKES]->(:Book)-[:SIMILAR_TO]-(recommendation:Book)
      WHERE NOT (:User {id: "${userId}"})-[:LIKES]->(recommendation)
      RETURN DISTINCT recommendation.id AS bookId, recommendation.title AS title, recommendation.author AS author
      ORDER BY title;
    `);
  }

  return {
    statusCode: 404,
    body: {
      error: "Route introuvable",
      routes: Object.keys(routes)
    }
  };
}

async function serveStatic(pathname) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(FRONTEND_DIR, requestedPath));

  if (!filePath.startsWith(FRONTEND_DIR)) {
    return {
      statusCode: 403,
      body: "Acces refuse",
      contentType: "text/plain; charset=utf-8"
    };
  }

  const content = await fs.readFile(filePath);
  return {
    statusCode: 200,
    body: content,
    contentType: CONTENT_TYPES[path.extname(filePath)] || "application/octet-stream"
  };
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (req.method === "GET" && !url.pathname.startsWith("/api/") && url.pathname !== "/health") {
      const staticResult = await serveStatic(url.pathname);
      res.writeHead(staticResult.statusCode, { "Content-Type": staticResult.contentType });
      res.end(staticResult.body);
      return;
    }

    const result = await routeRequest(req.method, url.pathname);
    const statusCode = result && result.statusCode ? result.statusCode : 200;
    const body = result && Object.prototype.hasOwnProperty.call(result, "body")
      ? result.body
      : result;

    res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(body, null, 2));
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({
      error: "Erreur backend BookHub",
      message: error.message,
      details: error.stderr || error.stdout || null
    }, null, 2));
  }
});

server.listen(PORT, () => {
  console.log(`Backend BookHub lance sur http://localhost:${PORT}`);
});
