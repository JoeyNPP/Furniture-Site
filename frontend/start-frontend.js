const express = require("express");
const path = require("path");
const app = express();

// Serve the compiled React app from the build folder
app.use(express.static(path.join(__dirname, "build")));

// All other requests return the React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Use port from environment or default to 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Frontend listening on port ${PORT}`);
});
