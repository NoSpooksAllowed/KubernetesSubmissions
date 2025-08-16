const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

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

/**
 * Writes a log entry with timestamp and random string to the output file.
 * @param {string} randomString - The random string to log.
 * @param {string} filename - The output file name.
 */
function writeToFile(randomString, filename = "output.log") {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} - ${randomString}\n`;

  const logDir = "logs";
  const logFilePath = path.join(logDir, filename);

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  fs.appendFileSync(logFilePath, logEntry);
  console.log(`Written: ${logEntry.trim()}`);
}

// Generate initial random hash on startup
const randomHash = generateRandomHash();
console.log(`Application started with random string: ${randomHash}`);

// Write initial hash to file
writeToFile(randomHash);

// Generate new random string and write to file every 5 seconds
const intervalId = setInterval(() => {
  const newRandomHash = generateRandomHash();
  writeToFile(newRandomHash);
}, 5000);

// Graceful shutdown handling
process.on("SIGINT", () => {
  console.log("\nReceived SIGINT. Stopping random string generation...");
  clearInterval(intervalId);
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nReceived SIGTERM. Stopping random string generation...");
  clearInterval(intervalId);
  process.exit(0);
});
