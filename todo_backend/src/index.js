const express = require("express");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// In-memory storage for todos
let todos = [];
let nextId = 1;

// Root endpoint - shows available endpoints
app.get("/", (req, res) => {
  res.json({
    message: "Todo Backend Service",
    description: "RESTful API for managing todos",
    endpoints: {
      getTodos: "GET /todos - Get all todos",
      createTodo: "POST /todos - Create a new todo",
    },
    totalTodos: todos.length,
  });
});

// GET /todos - Fetch all todos
app.get("/todos", (req, res) => {
  res.json({
    count: todos.length,
    todos: todos,
  });
});

// POST /todos - Create a new todo
app.post("/todos", (req, res) => {
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

  // Create new todo
  const newTodo = {
    id: nextId++,
    text: text,
    createdAt: new Date().toISOString(),
  };

  todos.push(newTodo);

  res.status(201).json({
    message: "Todo created successfully",
    todo: newTodo,
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    totalTodos: todos.length,
  });
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
