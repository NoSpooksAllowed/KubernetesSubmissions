const express = require("express");

const app = express();

const port = process.env.PORT || 3000;

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send(`Hello from todo app on port: ${port}`);
});

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
