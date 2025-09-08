const express = require("express");
const crypto = require("crypto");
const http = require("http");
const port = process.env.PORT || 3000;

// Array to store generated hashes
let hashLogs = [];

/**
 * Generates a cryptographically secure random hash.
 * @param {number} [length=32] - The number of random bytes to generate (determines entropy).
 * @param {string} [algorithm='sha256'] - The hashing algorithm to use (e.g., 'sha256', 'sha512').
 * @returns {string} The generated hash as a hexadecimal string.
 */
function generateRandomHash(length = 32, algorithm = "sha256") {
  const randomBytes = crypto.randomBytes(length);
  const hash = crypto.createHash(algorithm);
  hash.update(randomBytes);

  return hash.digest("hex");
}

// Create Express app
const app = express();

// Middleware
app.use(express.json());

// Removed readLogFile and getLogEntries functions as per request

// Function to continuously generate and store hashes
function startHashGeneration() {
  setInterval(() => {
    const timestamp = new Date().toISOString();
    const hash = generateRandomHash();
    const logEntry = {
      timestamp: timestamp,
      hash: hash,
    };

    hashLogs.push(logEntry);
    console.log(`Generated hash: ${hash} at ${timestamp}`);
  }, 5000); // Generate every 5 seconds
}

// Root endpoint - shows available endpoints
app.get("/", (req, res) => {
  res.json({
    message: "Log Output Reader Service",
    description:
      "Web service to read random string logs from generate_output application",
    endpoints: {
      logs: "/logs - Get all stored hashes",
      logsJson: "/logs/json - Get all stored hashes as JSON array",
      latest: "/logs/latest - Get the latest stored hash",
      count: "/logs/count - Get the number of stored hashes",
    },
    totalHashes: hashLogs.length,
  });
});

// Get all logs as text
app.get("/logs", async (req, res) => {
  try {
    // Make HTTP request to pingpong app
    const pingpongResponse = await new Promise((resolve, reject) => {
      const request = http.get(
        "http://pingpong-app-svc:3002/pings",
        (response) => {
          let data = "";
          response.on("data", (chunk) => {
            data += chunk;
          });
          response.on("end", () => {
            resolve(data);
          });
        },
      );

      request.on("error", (error) => {
        reject(error);
      });
    });

    // Parse the pingpong response
    const pingpongData = JSON.parse(pingpongResponse);

    // Create logs text with hashLogs and pingpong data
    const logsText = hashLogs
      .map((entry) => `${entry.timestamp} - ${entry.hash}`)
      .join("\n");
    const combinedLogs =
      logsText + "\n" + `Pingpong pings count: ${pingpongData.pings}`;

    res.set("Content-Type", "text/plain");
    res.send(combinedLogs || "No hashes generated yet");
  } catch (error) {
    console.error("Error fetching pingpong data:", error.message);
    res.set("Content-Type", "text/plain");
    const logsText = hashLogs
      .map((entry) => `${entry.timestamp} - ${entry.hash}`)
      .join("\n");
    res.send(logsText || "No hashes generated yet");
  }
});

// Get all logs as JSON
app.get("/logs/json", (req, res) => {
  res.json({
    count: hashLogs.length,
    entries: hashLogs,
  });
});

// Get latest log entry
app.get("/logs/latest", (req, res) => {
  if (hashLogs.length > 0) {
    res.json(hashLogs[hashLogs.length - 1]);
  } else {
    res.status(404).json({
      error: "No hashes generated yet",
    });
  }
});

// Get count of log entries
app.get("/logs/count", (req, res) => {
  res.json({
    count: hashLogs.length,
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    totalHashes: hashLogs.length,
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Log reader service is running on port ${port}`);
  console.log(`Available endpoints:`);
  console.log(`  - http://localhost:${port}/ - Service info`);
  console.log(`  - http://localhost:${port}/logs - Get all hashes as text`);
  console.log(
    `  - http://localhost:${port}/logs/json - Get all hashes as JSON`,
  );
  console.log(`  - http://localhost:${port}/logs/latest - Get latest hash`);
  console.log(`  - http://localhost:${port}/logs/count - Get hash count`);
  console.log(`  - http://localhost:${port}/health - Health check`);
  console.log(`Starting automatic hash generation every 5 seconds...`);

  // Start the automatic hash generation
  startHashGeneration();
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
