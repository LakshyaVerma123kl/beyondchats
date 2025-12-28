const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");
const articleRoutes = require("./routes/articleRoutes");

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);
app.use(express.json());

connectDB();

app.get("/", (req, res) => {
  res.send("BeyondChats Assignment Backend is Running!");
});

app.use("/api/articles", articleRoutes);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

module.exports = app;
