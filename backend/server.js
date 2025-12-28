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

// Default Route (Helpful to check if Vercel deployment is working)
app.get("/", (req, res) => {
  res.send("BeyondChats Assignment Backend is Running!");
});

// Main Routes
app.use("/api/articles", articleRoutes);

const PORT = process.env.PORT || 5000;

// --- CRITICAL FOR VERCEL DEPLOYMENT ---
// Only listen to the port if running locally.
// Vercel handles the server execution itself, so we skip this block there.
if (require.main === module) {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

// Export the app so Vercel can run it as a serverless function
module.exports = app;
