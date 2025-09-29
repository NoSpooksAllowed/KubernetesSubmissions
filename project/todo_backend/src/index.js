const express = require("express");
const { Client } = require("pg");

const app = express();
const port = process.env.PORT || 3000;

const client = new Client({
  host: "postgres",
  port: 5432,
  user: process.env.POSTGRES_USER || "myuser",
  password: process.env.POSTGRES_PASSWORD || "mypassword",
  database: process.env.POSTGRES_DB || "todo_db",
});

async function initializeDatabase() {
  try {
    console.log(
      `Attempting to connect to ${client.connectionParameters.host}:${client.connectionParameters.port}...`,
    );

    await client.connect();

    await client.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        text VARCHAR(140) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("SUCCESSFULLY CONNECTED AND INITIALIZED DATABASE!");
  } catch (err) {
    console.error("ERROR CONNECTING TO DATABASE:", err.message);
    process.exit(1);
  }
}
(async () => {
  await initializeDatabase();
})();

// Middleware
app.use(express.json());

// Root endpoint - shows available endpoints
app.get("/", (req, res) => {
  res.json({
    message: "Todo Backend Service",
    description: "RESTful API for managing todos",
    endpoints: {
      getTodos: "GET /todos - Get all todos",
      createTodo: "POST /todos - Create a new todo",
    },
  });
});

// GET /todos - Fetch all todos
app.get("/todos", async (req, res) => {
  try {
    const result = await client.query(
      "SELECT id, text, created_at FROM todos ORDER BY created_at DESC",
    );
    const todos = result.rows.map((row) => ({
      id: row.id,
      text: row.text,
      createdAt: row.created_at.toISOString(),
    }));

    res.json({
      count: todos.length,
      todos: todos,
    });
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).json({
      error: "Failed to fetch todos",
    });
  }
});

// POST /todos - Create a new todo
app.post("/todos", async (req, res) => {
  const { text } = req.body;

  // Validate required fields
  if (!text) {
    return res.status(400).json({
      error: "Text is required",
    });
  }

  // Validate text length (max 140 characters as shown in frontend)
  if (text.length > 140) {
    return res.status(400).json({
      error: "Todo text must be 140 characters or less",
    });
  }

  try {
    // Insert new todo into database
    const result = await client.query(
      "INSERT INTO todos (text) VALUES ($1) RETURNING id, text, created_at",
      [text],
    );

    const newTodo = {
      id: result.rows[0].id,
      text: result.rows[0].text,
      createdAt: result.rows[0].created_at.toISOString(),
    };

    res.status(201).json({
      message: "Todo created successfully",
      todo: newTodo,
    });
  } catch (error) {
    console.error("Error creating todo:", error);
    res.status(500).json({
      error: "Failed to create todo",
    });
  }
});

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const result = await client.query("SELECT COUNT(*) FROM todos");
    const totalTodos = parseInt(result.rows[0].count);

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      totalTodos: totalTodos,
    });
  } catch (error) {
    console.error("Error in health check:", error);
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Database connection failed",
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Todo backend service is running on port ${port}`);
  console.log(`Available endpoints:`);
  console.log(`  - http://localhost:${port}/ - Service info`);
  console.log(`  - GET http://localhost:${port}/todos - Get all todos`);
  console.log(`  - POST http://localhost:${port}/todos - Create new todo`);
  console.log(`  - http://localhost:${port}/health - Health check`);
});

// Graceful shutdown handling
process.on("SIGINT", () => {
  console.log("\nReceived SIGINT. Shutting down todo backend service...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nReceived SIGTERM. Shutting down todo backend service...");
  process.exit(0);
});
