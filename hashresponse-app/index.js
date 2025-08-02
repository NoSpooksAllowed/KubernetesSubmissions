const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const createRandomString = () => Math.random().toString(36).substr(2, 6);

const startingString = createRandomString();

app.get("/", (req, res) => {
  if (req.path.includes("favicon.ico")) {
    return res.end();
  }

  const stringNow = createRandomString();
  console.log("--------------------");
  console.log(`Responding with ${stringNow}`);
  res.send(`${startingString}: ${stringNow}`);
});

console.log(`Started with ${startingString}`);
app.listen(PORT, () => {
  console.log(`Express app listening on port ${PORT}`);
});
