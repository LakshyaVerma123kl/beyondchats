const axios = require("axios");
const cheerio = require("cheerio");

const scrapeArticles = async () => {
  try {
    console.log("🚀 Starting scrape with Axios/Cheerio...");

    // Fetch the blogs listing page
    const response = await axios.get("https://beyondchats.com/blogs/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);
    const articleLinks = [];

    // Extract article links
    $("a").each((i, link) => {
      const href = $(link).attr("href");
      const title = $(link).text().trim();

      // Filter for valid blog links
      if (
        href &&
        href.includes("/blogs/") &&
        !href.includes("#") &&
        title.length > 20 &&
        !title.toLowerCase().includes("read more")
      ) {
        // Convert relative URLs to absolute
        const fullUrl = href.startsWith("http")
          ? href
          : `https://beyondchats.com${href.startsWith("/") ? "" : "/"}${href}`;

        articleLinks.push({
          title: title,
          url: fullUrl,
        });
      }
    });

    // Deduplicate
    const uniqueLinks = Array.from(
      new Map(articleLinks.map((item) => [item.url, item])).values()
    );

    console.log(`📋 Found ${uniqueLinks.length} unique article links`);

    // Scrape content from each article
    const articles = [];
    const maxArticles = 5;

    for (let i = 0; i < Math.min(uniqueLinks.length, maxArticles); i++) {
      const link = uniqueLinks[uniqueLinks.length - 1 - i]; // Get oldest first

      try {
        console.log(
          `📄 [${i + 1}/${maxArticles}] Scraping: ${link.title.substring(
            0,
            50
          )}...`
        );

        const articleResponse = await axios.get(link.url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          timeout: 30000,
        });

        const $article = cheerio.load(articleResponse.data);

        // Remove unwanted elements
        $article(
          "script, style, nav, header, footer, .sidebar, .menu, .advertisement, .ad"
        ).remove();

        let content = "";

        // Strategy 1: Look for article tag
        if ($article("article").length > 0) {
          content = $article("article").text();
        }

        // Strategy 2: Look for main content area
        if (!content || content.length < 200) {
          const selectors = [
            "main",
            ".main-content",
            ".content",
            ".post-content",
            ".article-content",
            ".blog-content",
            ".entry-content",
            '[role="main"]',
          ];

          for (const selector of selectors) {
            const element = $article(selector);
            if (element.length > 0) {
              const elementText = element.text();
              if (elementText.length > content.length) {
                content = elementText;
              }
            }
          }
        }

        // Strategy 3: Get all paragraphs
        if (!content || content.length < 200) {
          const paragraphs = [];
          $article("p").each((idx, p) => {
            const text = $article(p).text().trim();
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
          .slice(0, 3000);

        if (content && content.length > 100) {
          articles.push({
            title: link.title,
            original_url: link.url,
            original_content: content,
            status: "pending",
          });
          console.log(`   ✅ Extracted ${content.length} characters`);
        } else {
          // Add with placeholder if content extraction failed
          articles.push({
            title: link.title,
            original_url: link.url,
            original_content: "Content fetch pending",
            status: "pending",
          });
          console.log(
            `   ⚠️  Could not extract content (${content.length} chars)`
          );
        }

        // Polite delay between requests
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.log(`   ❌ Error scraping article: ${error.message}`);
        // Still add the article even if scraping failed
        articles.push({
          title: link.title,
          original_url: link.url,
          original_content: "Content fetch pending",
          status: "pending",
        });
      }
    }

    console.log(`\n✅ Successfully scraped ${articles.length} articles`);
    return articles;
  } catch (error) {
    console.error("❌ Scraping Error:", error.message);
    return [];
  }
};

module.exports = scrapeArticles;
