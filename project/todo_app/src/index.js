// Import required modules
const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Initialize the Express application
const app = express();
const port = process.env.PORT || 3000;

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve the cache directory as static content
app.use(express.static(path.join("/", "app", "cache")));

// Middleware for parsing JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cache configuration
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds
const CACHE_DIR = "/app/cache";
const IMAGE_FILE = "hourly-image.jpg";
const METADATA_FILE = "image-metadata.json";
const IMAGE_PATH = path.join(CACHE_DIR, IMAGE_FILE);
const METADATA_PATH = path.join(CACHE_DIR, METADATA_FILE);

// The URL of the image to download
const imageUrl = process.env.IMAGE_URL;

// Todo backend configuration
const TODO_BACKEND_URL = process.env.TODO_BACKEND_URL;

// Load or create metadata
function loadMetadata() {
  try {
    if (fs.existsSync(METADATA_PATH)) {
      const data = fs.readFileSync(METADATA_PATH, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading metadata:", error);
  }
  return { lastUpdated: 0, imageId: null };
}

// Save metadata
function saveMetadata(metadata) {
  try {
    fs.writeFileSync(METADATA_PATH, JSON.stringify(metadata, null, 2));
  } catch (error) {
    console.error("Error saving metadata:", error);
  }
}

// Download and save image
async function downloadImageAndSave(url) {
  try {
    console.log(`Downloading new image from ${url}...`);

    // Make an HTTP GET request with axios, expecting a stream
    const response = await axios({
      method: "get",
      url: url,
      responseType: "stream",
    });

    // Create a write stream to save the file locally
    const writer = fs.createWriteStream(IMAGE_PATH);

    // Pipe the response data stream to the file writer stream
    response.data.pipe(writer);

    // Wait for the stream to finish writing before resolving
    return new Promise((resolve, reject) => {
      writer.on("finish", () => {
        console.log(`Image saved to ${IMAGE_PATH}`);
        resolve();
      });
      writer.on("error", reject);
    });
  } catch (error) {
    console.error("Error during image download:", error);
    throw error;
  }
}

// Get or refresh cached image
async function getCachedImage() {
  const metadata = loadMetadata();
  const now = Date.now();
  const timeSinceUpdate = now - metadata.lastUpdated;

  // Check if we need to refresh the image
  const shouldRefresh =
    !fs.existsSync(IMAGE_PATH) || timeSinceUpdate >= CACHE_DURATION;

  if (shouldRefresh) {
    try {
      // Generate a random image ID for consistent image during cache period
      const imageId = Math.floor(Math.random() * 1000);
      const randomImageUrl = `${imageUrl}?random=${imageId}`;

      await downloadImageAndSave(randomImageUrl);

      // Update metadata
      const newMetadata = {
        lastUpdated: now,
        imageId: imageId,
        imageUrl: randomImageUrl,
      };
      saveMetadata(newMetadata);

      console.log("Image cache refreshed successfully");
      return { isCached: false, metadata: newMetadata };
    } catch (error) {
      console.error("Error refreshing image:", error);
      // If download fails and we have an old image, keep using it
      if (fs.existsSync(IMAGE_PATH)) {
        console.log("Using existing cached image due to download failure");
        return { isCached: true, metadata: metadata };
      }
      throw error;
    }
  }

  return { isCached: true, metadata: metadata };
}

// Create a new todo in backend
async function createTodo(text) {
  try {
    const response = await axios.post(`${TODO_BACKEND_URL}/todos`, { text });
    return response.data;
  } catch (error) {
    console.error("Error creating todo in backend:", error.message);
    throw error;
  }
}

// Fetch todos from backend
async function fetchTodos() {
  try {
    const response = await axios.get(`${TODO_BACKEND_URL}/todos`);
    return response.data.todos || [];
  } catch (error) {
    console.error("Error fetching todos from backend:", error.message);
    return [];
  }
}

// Serve the cached image
app.get("/image", async (req, res) => {
  try {
    const imageData = await getCachedImage();

    if (fs.existsSync(IMAGE_PATH)) {
      // Set cache headers for browser caching
      res.setHeader("Cache-Control", "public, max-age=300"); // 5 minutes browser cache
      res.setHeader(
        "Last-Modified",
        new Date(imageData.metadata.lastUpdated).toUTCString(),
      );

      res.sendFile(IMAGE_PATH);
    } else {
      res.status(404).json({ error: "Image not found" });
    }
  } catch (error) {
    console.error("Error serving image:", error);
    res.status(500).json({ error: "Failed to load image" });
  }
});

// Get image metadata
app.get("/image/metadata", async (req, res) => {
  try {
    const imageData = await getCachedImage();
    res.json({
      lastUpdated: imageData.metadata.lastUpdated,
      imageId: imageData.metadata.imageId,
      isCached: imageData.isCached,
      nextRefresh: imageData.metadata.lastUpdated + CACHE_DURATION,
      timeUntilRefresh: Math.max(
        0,
        imageData.metadata.lastUpdated + CACHE_DURATION - Date.now(),
      ),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get image metadata" });
  }
});

// Home page with image display and todos
app.get("/", async (req, res) => {
  try {
    const imageData = await getCachedImage();
    const todos = await fetchTodos();

    res.render("index", {
      title: "Todo App - Home",
      port: port,
      imageUrl: "/image",
      imageMetadata: imageData.metadata,
      isCached: imageData.isCached,
      nextRefresh: imageData.metadata.lastUpdated + CACHE_DURATION,
      todos: todos,
    });
  } catch (error) {
    console.error("Error in home controller:", error);
    const todos = await fetchTodos(); // Still try to fetch todos even if image fails

    res.render("index", {
      title: "Todo App - Home",
      port: port,
      imageUrl: null,
      imageMetadata: null,
      isCached: false,
      nextRefresh: null,
      todos: todos,
    });
  }
});

// Create a new todo
app.post("/todos", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        error: "Todo text is required",
      });
    }

    if (text.length > 140) {
      return res.status(400).json({
        error: "Todo text must be 140 characters or less",
      });
    }

    const result = await createTodo(text.trim());
    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating todo:", error);
    res.status(500).json({
      error: "Failed to create todo",
    });
  }
});

// Health check
app.get("/healtcheck", (req, res) => {
  res.json({
    status: "Server is up and running!",
    port: port,
    timestamp: new Date().toISOString(),
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
  console.log(`Image cache directory: ${CACHE_DIR}`);
  console.log(`Cache duration: ${CACHE_DURATION / 1000 / 60} minutes`);
});
