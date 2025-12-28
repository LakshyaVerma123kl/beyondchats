const mongoose = require("mongoose");
require("dotenv").config();
const Article = require("../models/Article");

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("🧹 Cleaning Database...");
  await Article.deleteMany({}); // Deletes ALL articles
  console.log("✅ Database empty.");
  process.exit();
});
