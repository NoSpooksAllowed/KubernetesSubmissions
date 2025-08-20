const express = require("express");

const app = express();
const port = process.env.PORT || 3000;

let requestCounter = 0;

app.use(express.json());

app.get("/pingpong", (req, res) => {
  requestCounter++;
  res.send(`pong ${requestCounter}`);
});

app.get("/", (req, res) => {
  res.json({
    message: "Ping-Pong Application",
    endpoints: {
      pingpong: "/pingpong",
    },
    currentCounter: requestCounter,
  });
});

app.listen(port, () => {
  console.log(`Ping-pong server is running on port ${port}`);
  console.log(`Access ping-pong at: http://localhost:${port}/pingpong`);
});

process.on("SIGINT", () => {
  console.log("\nReceived SIGINT. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nReceived SIGTERM. Shutting down gracefully...");
  process.exit(0);
});

