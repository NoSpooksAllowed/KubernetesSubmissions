const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

let requestCounter = 0;

app.use(express.json());

/**
 * Writes the current request counter with timestamp to the log file.
 */
function writeCounterToLog() {
  const logDir = path.join("/", "app", "logs");
  const logFile = path.join(logDir, "output.log");
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} - Request counter: ${requestCounter}\n`;

  try {
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Append the log entry to the file
    fs.appendFileSync(logFile, logEntry);
    console.log(`Logged: ${logEntry.trim()}`);
  } catch (error) {
    console.error(`Error writing to log file: ${error.message}`);
  }
}

app.get("/pingpong", (req, res) => {
  requestCounter++;
  res.send(`pong ${requestCounter}`);

  // Write the counter to log file
  writeCounterToLog();
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
  console.log(`Log file location: /app/logs/output.log`);
});

process.on("SIGINT", () => {
  console.log("\nReceived SIGINT. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nReceived SIGTERM. Shutting down gracefully...");
  process.exit(0);
});
