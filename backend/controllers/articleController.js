const Article = require("../models/Article");
const scrapeArticles = require("../utils/scraper");
const axios = require("axios");
const cheerio = require("cheerio");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");

// Initialize AI clients
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;
const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

// @desc    Trigger Scraper & Save to DB
// @route   GET /api/articles/scrape
exports.triggerScrape = async (req, res) => {
  try {
    const scrapedData = await scrapeArticles();
    let savedCount = 0;

    for (const item of scrapedData) {
      const exists = await Article.findOne({ original_url: item.original_url });
      if (!exists) {
        await Article.create(item);
        savedCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Scraping complete. Added ${savedCount} new articles.`,
      total_found: scrapedData.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get All Articles
// @route   GET /api/articles
exports.getArticles = async (req, res) => {
  try {
    const articles = await Article.find().sort({ createdAt: -1 });
    res.status(200).json(articles);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get Single Article by ID
// @route   GET /api/articles/:id
exports.getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article)
      return res
        .status(404)
        .json({ success: false, message: "Article not found" });
    res.status(200).json(article);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update an Article
// @route   PUT /api/articles/:id
exports.updateArticle = async (req, res) => {
  try {
    const updatedArticle = await Article.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedArticle)
      return res
        .status(404)
        .json({ success: false, message: "Article not found" });

    res.status(200).json({ success: true, data: updatedArticle });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete an Article
// @route   DELETE /api/articles/:id
exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);

    if (!article)
      return res
        .status(404)
        .json({ success: false, message: "Article not found" });

    res.status(200).json({ success: true, message: "Article deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ========== AI PROCESSING HELPER FUNCTIONS ==========

async function searchWeb(query) {
  console.log(`🔎 Searching for: "${query}"...`);

  // Try Google Scholar first
  let results = await searchGoogleScholar(query);
  if (results.length > 0) return results;

  // Fallback to building source URLs
  results = await buildSourceUrls(query);
  return results;
}

async function searchGoogleScholar(query) {
  try {
    console.log("  → Trying Google Scholar...");
    const response = await axios.get(
      `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        timeout: 10000,
      }
    );

    const $ = cheerio.load(response.data);
    const results = [];

    $(".gs_ri").each((i, element) => {
      const $element = $(element);
      const title = $element.find(".gs_rt").text().trim();
      const link = $element.find(".gs_rt a").attr("href");

      if (link && title && link.startsWith("http")) {
        results.push({ title, url: link });
      }
    });

    if (results.length > 0) {
      console.log(`  ✓ Found ${results.length} results from Google Scholar`);
    }
    return results.slice(0, 3);
  } catch (error) {
    console.log(`  ✗ Google Scholar failed`);
    return [];
  }
}

async function buildSourceUrls(query) {
  console.log("  → Building URLs from reliable sources...");

  const lowercaseQuery = query.toLowerCase();
  const results = [];

  if (
    lowercaseQuery.includes("ai") ||
    lowercaseQuery.includes("artificial intelligence")
  ) {
    results.push(
      {
        title: "AI Research - arXiv",
        url: `https://arxiv.org/search/?query=${encodeURIComponent(
          query
        )}&searchtype=all`,
      },
      {
        title: "AI News - VentureBeat",
        url: "https://venturebeat.com/ai/",
      },
      {
        title: "AI Technology - MIT Technology Review",
        url: "https://www.technologyreview.com/topic/artificial-intelligence/",
      }
    );
  }

  if (lowercaseQuery.includes("health") || lowercaseQuery.includes("medical")) {
    results.push(
      {
        title: "Healthcare Research - PubMed",
        url: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(
          query
        )}`,
      },
      {
        title: "Medical News - Healthcare IT News",
        url: "https://www.healthcareitnews.com/",
      }
    );
  }

  if (results.length < 3) {
    results.push(
      {
        title: "Technology News - TechCrunch",
        url: `https://techcrunch.com/`,
      },
      {
        title: "Tech Articles - The Verge",
        url: "https://www.theverge.com/tech",
      },
      {
        title: "Industry Analysis - Forbes Technology",
        url: "https://www.forbes.com/technology/",
      }
    );
  }

  console.log(`  ✓ Built ${results.length} source URLs`);
  return results.slice(0, 3);
}

async function scrapeUrlContent(url) {
  console.log(`📄 Fetching: ${url}...`);

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.google.com/",
      },
      timeout: 20000,
      maxRedirects: 5,
    });

    const $ = cheerio.load(response.data);

    $(
      "script, style, nav, header, footer, iframe, .ad, .advertisement, aside, .sidebar, .comments"
    ).remove();

    let content = "";

    if ($("article").length > 0) {
      content = $("article").text();
    }

    if (!content || content.length < 300) {
      const selectors = [
        "main",
        ".main-content",
        ".content",
        ".post-content",
        ".article-content",
        ".entry-content",
        ".story-body",
        "[role='main']",
        "#main-content",
      ];

      for (const selector of selectors) {
        const element = $(selector);
        if (element.length > 0) {
          const text = element.text();
          if (text.length > content.length) {
            content = text;
          }
        }
      }
    }

    if (!content || content.length < 300) {
      const paragraphs = [];
      $("p").each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 50) {
          paragraphs.push(text);
        }
      });
      content = paragraphs.join("\n\n");
    }

    content = content
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n/g, "\n\n")
      .trim()
      .slice(0, 6000);

    if (content.length > 300) {
      console.log(`✅ Extracted ${content.length} characters`);
      return content;
    } else {
      console.log(`⚠️ Content too short: ${content.length} characters`);
      return "";
    }
  } catch (error) {
    console.error(`⚠️ Error: ${error.message}`);
    return "";
  }
}

async function generateWithFallback(prompt) {
  if (genAI) {
    const geminiModels = ["gemini-2.5-flash", "gemini-1.5-pro"];

    for (const modelName of geminiModels) {
      try {
        console.log(`⚡ Generating with ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        console.log(`✅ ${modelName} succeeded!`);
        return result.response.text();
      } catch (err) {
        console.warn(`⚠️ ${modelName} failed: ${err.message.split("\n")[0]}`);
      }
    }
  }

  if (groq) {
    const groqModels = [
      "llama-3.3-70b-versatile",
      "llama-3.1-70b-versatile",
      "mixtral-8x7b-32768",
    ];

    for (const modelName of groqModels) {
      try {
        console.log(`🚀 Generating with ${modelName}...`);
        const completion = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: modelName,
          temperature: 0.7,
          max_tokens: 2048,
        });
        console.log(`✅ ${modelName} succeeded!`);
        return completion.choices[0]?.message?.content || "";
      } catch (err) {
        console.warn(`⚠️ ${modelName} failed: ${err.message.split("\n")[0]}`);
      }
    }
  }

  return null;
}

// @desc    Process a single article with AI
// @route   POST /api/articles/process/:id
exports.processArticle = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the article
    const article = await Article.findById(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    if (article.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Article already processed",
      });
    }

    console.log(`\n🚀 PROCESSING: "${article.title}"\n`);

    // 1. Search for sources
    const searchResults = await searchWeb(article.title);

    if (searchResults.length === 0) {
      article.status = "failed";
      article.error = "No search results found";
      await article.save();
      return res.status(500).json({
        success: false,
        message: "No search results found",
      });
    }

    console.log(`✅ Found ${searchResults.length} sources`);

    // 2. Scrape content from sources
    const validSources = [];
    for (const result of searchResults) {
      const content = await scrapeUrlContent(result.url);
      if (content.length > 300) {
        validSources.push({
          title: result.title,
          url: result.url,
          content: content,
        });
      }
      // Polite delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    if (validSources.length === 0) {
      article.status = "failed";
      article.error = "Content extraction failed";
      await article.save();
      return res.status(500).json({
        success: false,
        message: "Could not extract content from sources",
      });
    }

    console.log(`✅ Scraped ${validSources.length} sources`);

    // 3. Generate AI content
    const sourceText = validSources
      .map(
        (s, i) => `
SOURCE ${i + 1}: ${s.title}
URL: ${s.url}
CONTENT:
${s.content.slice(0, 2000)}
`
      )
      .join("\n" + "=".repeat(80) + "\n");

    const prompt = `You are an expert tech journalist. Write a comprehensive article about: "${article.title}"

Use these scraped sources for information:

${sourceText}

Requirements:
- Format in clean HTML: <h2>, <h3>, <p>, <ul>, <li>
- NO markdown, NO code blocks, NO backticks
- 400-600 words minimum
- Include facts and insights from the sources
- Add a "References" section at the end with source links
- Professional and informative tone

Output only the HTML:`;

    const generatedContent = await generateWithFallback(prompt);

    if (!generatedContent) {
      article.status = "failed";
      article.error = "AI generation failed";
      await article.save();
      return res.status(500).json({
        success: false,
        message: "AI generation failed",
      });
    }

    // 4. Save results
    const cleanContent = generatedContent
      .replace(/```html/gi, "")
      .replace(/```/g, "")
      .trim();

    article.updated_content = cleanContent;
    article.references = validSources.map((s) => ({
      title: s.title,
      url: s.url,
    }));
    article.status = "completed";
    await article.save();

    console.log("✅ Article processed successfully!");

    res.json({
      success: true,
      message: "Article processed successfully",
      article: article,
    });
  } catch (error) {
    console.error("❌ Processing error:", error);
    res.status(500).json({
      success: false,
      message: "Processing failed",
      error: error.message,
    });
  }
};
