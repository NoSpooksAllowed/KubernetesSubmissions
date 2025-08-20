const express = require("express");
const fs = require("fs");
const path = require("path");

const port = process.env.PORT || 3000;
const logFilePath = path.join("/", "app", "logs", "output.log");

// Create Express app
const app = express();

// Middleware
app.use(express.json());

/**
 * Reads the log file and returns its content.
 * @returns {string} The content of the log file.
 */
function readLogFile() {
  try {
    if (fs.existsSync(logFilePath)) {
      return fs.readFileSync(logFilePath, "utf8");
    } else {
      return "Log file not found. The generate_output application may not be running yet.";
    }
  } catch (error) {
    return `Error reading log file: ${error.message}`;
  }
}

/**
 * Gets log entries as an array of objects.
 * @returns {Array} Array of log entries with timestamp and randomString properties.
 */
function getLogEntries() {
  const content = readLogFile();
  if (content.includes("Error") || content.includes("not found")) {
    return [];
  }

  const lines = content.trim().split("\n");
  return lines
    .map((line) => {
      const parts = line.split(" - ");
      if (parts.length === 2) {
        return {
          timestamp: parts[0],
          randomString: parts[1],
        };
      }
      return null;
    })
    .filter((entry) => entry !== null);
}

// Root endpoint - shows available endpoints
app.get("/", (req, res) => {
  res.json({
    message: "Log Output Reader Service",
    description:
      "Web service to read random string logs from generate_output application",
    endpoints: {
      logs: "/logs - Get all log entries as text",
      logsJson: "/logs/json - Get all log entries as JSON array",
      latest: "/logs/latest - Get the latest log entry",
      count: "/logs/count - Get the number of log entries",
    },
    logFilePath: logFilePath,
  });
});

// Get all logs as text
app.get("/logs", (req, res) => {
  const content = readLogFile();
  res.set("Content-Type", "text/plain");
  res.send(content);
});

// Get all logs as JSON
app.get("/logs/json", (req, res) => {
  const entries = getLogEntries();
  res.json({
    count: entries.length,
    entries: entries,
  });
});

// Get latest log entry
app.get("/logs/latest", (req, res) => {
  const entries = getLogEntries();
  if (entries.length > 0) {
    res.json(entries[entries.length - 1]);
  } else {
    res.status(404).json({
      error: "No log entries found",
    });
  }
});

// Get count of log entries
app.get("/logs/count", (req, res) => {
  const entries = getLogEntries();
  res.json({
    count: entries.length,
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  const fileExists = fs.existsSync(logFilePath);
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    logFileExists: fileExists,
    logFilePath: logFilePath,
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Log reader service is running on port ${port}`);
  console.log(`Available endpoints:`);
  console.log(`  - http://localhost:${port}/ - Service info`);
  console.log(`  - http://localhost:${port}/logs - Get all logs as text`);
  console.log(`  - http://localhost:${port}/logs/json - Get all logs as JSON`);
  console.log(
    `  - http://localhost:${port}/logs/latest - Get latest log entry`,
  );
  console.log(`  - http://localhost:${port}/logs/count - Get log count`);
  console.log(`  - http://localhost:${port}/health - Health check`);
  console.log(`Log file path: ${logFilePath}`);
});

// Graceful shutdown handling
process.on("SIGINT", () => {
  console.log("\nReceived SIGINT. Shutting down log reader service...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nReceived SIGTERM. Shutting down log reader service...");
  process.exit(0);
});
