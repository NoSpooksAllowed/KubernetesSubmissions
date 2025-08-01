const express = require("express");
const path = require("path");

const app = express();

const port = process.env.PORT || 3000;

// Set up view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Controller function for home page
const homeController = (req, res) => {
  res.render("index", {
    title: "Todo App - Home",
    port: port,
  });
};

// Routes
app.get("/", homeController);

app.get("/healtcheck", (req, res) => {
  res.json({
    status: "Server is up and running!",
    port: port,
    timestamp: new Date().toISOString(),
  });
});

app.listen(port, () => {
  console.log(`Express server is listening on port ${port}`);
  console.log(`Access it at: http://localhost:${port}`);
  console.log(
    `To change the port, set the PORT environment variable before running, e.g.:`,
  );
  console.log(`  PORT=8080 node index.js`);
});
