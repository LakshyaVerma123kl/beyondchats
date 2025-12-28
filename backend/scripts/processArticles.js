require("dotenv").config();
const mongoose = require("mongoose");
const axios = require("axios");
const cheerio = require("cheerio");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");
const Article = require("../models/Article");

// --- CONFIGURATION ---
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;
const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

// Connect DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Script Connected to DB"));

// --- HELPER: Search using multiple methods ---
async function searchWeb(query) {
  console.log(`🔎 Searching for: "${query}"...`);

  // Method 1: Try Google Scholar (less likely to block)
  let results = await searchGoogleScholar(query);
  if (results.length > 0) return results;

  // Method 2: Try HTML.duckduckgo with lite version
  results = await searchDuckDuckGoLite(query);
  if (results.length > 0) return results;

  // Method 3: Try scraping Google News (less restrictive)
  results = await searchGoogleNews(query);
  if (results.length > 0) return results;

  // Method 4: Build URLs from common sources
  results = await buildSourceUrls(query);
  return results;
}

// Method 1: Google Scholar (academic sources)
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

// Method 2: DuckDuckGo Lite HTML version
async function searchDuckDuckGoLite(query) {
  try {
    console.log("  → Trying DuckDuckGo Lite...");
    const response = await axios.get(
      `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
        timeout: 10000,
      }
    );

    const $ = cheerio.load(response.data);
    const results = [];

    // DuckDuckGo Lite has simpler HTML structure
    $("a.result-link").each((i, element) => {
      const title = $(element).text().trim();
      const url = $(element).attr("href");

      if (
        url &&
        title &&
        url.startsWith("http") &&
        !url.includes("duckduckgo")
      ) {
        results.push({ title, url });
      }
    });

    // Fallback: try different selectors
    if (results.length === 0) {
      $("tr").each((i, element) => {
        const $row = $(element);
        const $links = $row.find("a[href^='http']");

        $links.each((j, link) => {
          const url = $(link).attr("href");
          const title = $(link).text().trim();

          if (
            url &&
            title &&
            !url.includes("duckduckgo.com") &&
            title.length > 10
          ) {
            results.push({ title, url });
          }
        });
      });
    }

    if (results.length > 0) {
      console.log(`  ✓ Found ${results.length} results from DuckDuckGo`);
    }
    return results.slice(0, 3);
  } catch (error) {
    console.log(`  ✗ DuckDuckGo failed`);
    return [];
  }
}

// Method 3: Google News (less strict than regular Google)
async function searchGoogleNews(query) {
  try {
    console.log("  → Trying Google News...");
    const response = await axios.get(
      `https://news.google.com/search?q=${encodeURIComponent(query)}`,
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

    $("article a[href^='./articles/']").each((i, element) => {
      const title = $(element).text().trim();
      let url = $(element).attr("href");

      if (url && title) {
        // Google News URLs need to be converted
        url = `https://news.google.com${url.substring(1)}`;
        results.push({ title, url });
      }
    });

    if (results.length > 0) {
      console.log(`  ✓ Found ${results.length} results from Google News`);
    }
    return results.slice(0, 3);
  } catch (error) {
    console.log(`  ✗ Google News failed`);
    return [];
  }
}

// Method 4: Build URLs from known reliable sources
async function buildSourceUrls(query) {
  console.log("  → Building URLs from reliable sources...");

  const lowercaseQuery = query.toLowerCase();
  const results = [];

  // Detect topic and build relevant URLs
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

  // Add general tech sources
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

// --- HELPER: SCRAPE CONTENT ---
async function scrapeUrlContent(url) {
  console.log(`📄 Fetching: ${url}...`);

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.google.com/",
      },
      timeout: 20000,
      maxRedirects: 5,
    });

    const $ = cheerio.load(response.data);

    // Remove unwanted elements
    $(
      "script, style, nav, header, footer, iframe, .ad, .advertisement, aside, .sidebar, .comments"
    ).remove();

    let content = "";

    // Strategy 1: Article tag
    if ($("article").length > 0) {
      content = $("article").text();
    }

    // Strategy 2: Main content selectors
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

    // Strategy 3: All paragraphs
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

    // Clean up
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
    if (error.response) {
      console.error(`⚠️ HTTP ${error.response.status}: ${url}`);
    } else {
      console.error(`⚠️ Error: ${error.message}`);
    }
    return "";
  }
}

// --- CORE: AI GENERATION ---
async function generateWithFallback(prompt) {
  // Try Gemini
  if (genAI) {
    try {
      console.log("⚡ Generating with Gemini...");
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
      });
      const result = await model.generateContent(prompt);
      console.log("✅ Gemini succeeded!");
      return result.response.text();
    } catch (err) {
      console.warn(`⚠️ Gemini failed: ${err.message}`);

      // Try gemini-pro
      try {
        console.log("🔄 Trying Gemini Pro...");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        console.log("✅ Gemini Pro succeeded!");
        return result.response.text();
      } catch (err2) {
        console.warn(`⚠️ Gemini Pro failed: ${err2.message}`);
      }
    }
  }

  // Try Groq
  if (groq) {
    try {
      console.log("🚀 Generating with Groq...");
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama3-70b-8192",
        temperature: 0.7,
        max_tokens: 2048,
      });
      console.log("✅ Groq succeeded!");
      return completion.choices[0]?.message?.content || "";
    } catch (err) {
      console.error(`❌ Groq failed: ${err.message}`);
    }
  }

  return null;
}

// --- MAIN EXECUTION ---
async function start() {
  try {
    const articles = await Article.find({ status: "pending" }).limit(1);

    if (articles.length === 0) {
      console.log("✅ No pending articles found.");
      process.exit(0);
    }

    const article = articles[0];
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🚀 PROCESSING ARTICLE`);
    console.log(`${"=".repeat(60)}`);
    console.log(`Title: "${article.title}"`);
    console.log(`${"=".repeat(60)}\n`);

    // Step 1: Search (tries multiple methods)
    const searchResults = await searchWeb(article.title);

    if (searchResults.length === 0) {
      console.log("\n❌ All search methods failed. Cannot proceed.");
      article.status = "failed";
      article.error = "No search results from any source";
      await article.save();
      process.exit(1);
    }

    console.log(`\n✅ Got ${searchResults.length} sources:\n`);
    searchResults.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.title}`);
      console.log(`     ${r.url}\n`);
    });

    // Step 2: Scrape content
    console.log("📥 Extracting content from sources...\n");
    const validSources = [];

    for (let i = 0; i < searchResults.length; i++) {
      console.log(`[${i + 1}/${searchResults.length}]`);
      const content = await scrapeUrlContent(searchResults[i].url);

      if (content.length > 300) {
        validSources.push({
          title: searchResults[i].title,
          url: searchResults[i].url,
          content: content,
        });
        console.log(`✓ Added to sources\n`);
      } else {
        console.log(`✗ Skipped\n`);
      }

      // Delay between requests
      if (i < searchResults.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    if (validSources.length === 0) {
      console.log("\n❌ Could not extract content from any source.");
      article.status = "failed";
      article.error = "Content extraction failed";
      await article.save();
      process.exit(1);
    }

    console.log(`\n✅ Successfully scraped ${validSources.length} sources\n`);

    // Step 3: Generate with AI
    console.log("🤖 Generating article...\n");

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
      console.log("\n❌ AI generation failed.");
      article.status = "failed";
      article.error = "AI generation failed";
      await article.save();
      process.exit(1);
    }

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

    console.log(`\n${"=".repeat(60)}`);
    console.log("✨ SUCCESS!");
    console.log(`${"=".repeat(60)}`);
    console.log(`Content: ${cleanContent.length} characters`);
    console.log(`Sources: ${validSources.length}`);
    console.log(`Status: ${article.status}`);
    console.log(`${"=".repeat(60)}\n`);

    process.exit(0);
  } catch (error) {
    console.error("\n❌ FATAL ERROR:", error.message);
    process.exit(1);
  }
}

process.on("SIGINT", () => {
  console.log("\n👋 Shutting down...");
  mongoose.disconnect();
  process.exit(0);
});

start();
