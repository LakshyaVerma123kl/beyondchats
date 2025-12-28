const express = require("express");
const router = express.Router();
const {
  triggerScrape,
  getArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  processArticle,
} = require("../controllers/articleController");

// Scrape route - MUST be before /:id to avoid conflicts
router.get("/scrape", triggerScrape);

// Process route
router.post("/process/:id", processArticle);

// CRUD routes
router.get("/", getArticles);
router.get("/:id", getArticleById);
router.put("/:id", updateArticle);
router.delete("/:id", deleteArticle);

module.exports = router;
