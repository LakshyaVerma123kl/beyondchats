const express = require("express");
const router = express.Router();
const {
  triggerScrape,
  getArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  processArticle, // ← ADD THIS
} = require("../controllers/articleController");

router.get("/scrape", triggerScrape);
router.post("/process/:id", processArticle); // ← ADD THIS LINE
router.get("/", getArticles);
router.get("/:id", getArticleById);
router.put("/:id", updateArticle);
router.delete("/:id", deleteArticle);

module.exports = router;
