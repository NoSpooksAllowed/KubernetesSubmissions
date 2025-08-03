const crypto = require("crypto");
const express = require("express");

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

const randomHash = generateRandomHash();
const port = process.env.PORT || 3000;

// Create Express app
const app = express();

// Middleware
app.use(express.json());

// Status endpoint
app.get("/status", (req, res) => {
  const timestamp = new Date().toISOString();
  res.json({
    timestamp: timestamp,
    randomString: randomHash,
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Log Output Application",
    endpoints: {
      status: "/status",
    },
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Status endpoint available at: http://localhost:${port}/status`);
});

const intervalId = setInterval(() => {
  const timestamp = new Date().toISOString();

  console.log(`${timestamp}: ${randomHash}`);
}, 5000);

process.on("SIGINT", () => {
  console.log("\nReceived SIGINT. Stopping hash generation loop...");
  clearInterval(intervalId);
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nReceived SIGTERM. Stopping hash generation loop...");
  clearInterval(intervalId);
  process.exit(0);
});
