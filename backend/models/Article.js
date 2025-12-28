const mongoose = require("mongoose");

const ArticleSchema = new mongoose.Schema(
  {
    // Phase 1 Fields (Scraped Data)
    title: {
      type: String,
      required: true,
    },
    original_url: {
      type: String,
      required: true,
      unique: true, // Prevent duplicate scrapes
    },
    original_content: {
      type: String,
    },
    published_date: {
      type: Date,
    },

    // Phase 2 Fields (Placeholders for now)
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    updated_content: {
      type: String,
    },
    references: [
      {
        title: String,
        url: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Article", ArticleSchema);
