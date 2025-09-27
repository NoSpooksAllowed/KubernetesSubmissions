const express = require("express");
const { Client } = require("pg");

const app = express();
const port = process.env.PORT || 3000;

const client = new Client({
  host: "postgres",
  port: 5432,
  user: process.env.POSTGRES_USER || "myuser",
  password: process.env.POSTGRES_PASSWORD || "mypassword",
  database: process.env.POSTGRES_DB || "mydb",
});

async function initializeDatabase() {
  try {
    console.log(
      `Attempting to connect to ${client.connectionParameters.host}:${client.connectionParameters.port}...`,
    );

    await client.connect();

    await client.query(`
      CREATE TABLE IF NOT EXISTS pong_counter (
        id SERIAL PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const result = await client.query("SELECT COUNT(*) FROM pong_counter");
    if (result.rows[0].count === "0") {
      await client.query("INSERT INTO pong_counter (count) VALUES (0)");
      console.log("Initialized pong counter in database");
    }

    console.log("SUCCESSFULLY CONNECTED AND INITIALIZED DATABASE!");
  } catch (err) {
    console.error("ERROR CONNECTING TO DATABASE:", err.message);
    process.exit(1);
  }
}
(async () => {
  await initializeDatabase();
})();

app.use(express.json());

app.get("/pingpong", async (req, res) => {
  try {
    const fetchResult = await client.query(
      "SELECT count FROM pong_counter ORDER BY id DESC LIMIT 1",
    );
    const currentCount = fetchResult.rows[0] ? fetchResult.rows[0].count : 0;

    const newCount = currentCount + 1;

    await client.query(
      "UPDATE pong_counter SET count = $1, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT id FROM pong_counter ORDER BY id DESC LIMIT 1)",
      [newCount],
    );

    res.send(`pong ${newCount}`);
  } catch (err) {
    console.error("Error in /pingpong endpoint:", err.message);
    res.status(500).send("Internal server error");
  }
});

app.get("/", async (req, res) => {
  try {
    const result = await client.query(
      "SELECT count FROM pong_counter ORDER BY id DESC LIMIT 1",
    );
    const currentCount = result.rows[0] ? result.rows[0].count : 0;

    res.json({
      message: "Ping-Pong Application",
      endpoints: {
        pingpong: "/pingpong",
        pings: "/pings",
      },
      currentCounter: currentCount,
    });
  } catch (err) {
    console.error("Error in / endpoint:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/pings", async (req, res) => {
  try {
    const result = await client.query(
      "SELECT count FROM pong_counter ORDER BY id DESC LIMIT 1",
    );
    const currentCount = result.rows[0] ? result.rows[0].count : 0;

    res.json({ pings: currentCount });
  } catch (err) {
    console.error("Error in /pings endpoint:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Ping-pong server is running on port ${port}`);
  console.log(`Access ping-pong at: http://localhost:${port}/pingpong`);
});

process.on("SIGINT", async () => {
  console.log("\nReceived SIGINT. Shutting down gracefully...");
  try {
    await client.end();
  } catch (err) {
    console.error("Error closing database connection:", err.message);
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nReceived SIGTERM. Shutting down gracefully...");
  try {
    await client.end();
  } catch (err) {
    console.error("Error closing database connection:", err.message);
  }
  process.exit(0);
});
