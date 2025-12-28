const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");
const articleRoutes = require("./routes/articleRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect Database
connectDB();

// Routes
app.use("/api/articles", articleRoutes);

// Helper route for testing
app.get("/", (req, res) => res.send("BeyondChats API is running..."));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
