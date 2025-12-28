const puppeteer = require("puppeteer");

const scrapeArticles = async () => {
  let browser;
  try {
    console.log("🚀 Launching Puppeteer...");
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage();

    // 1. Go to the blogs listing page
    await page.goto("https://beyondchats.com/blogs/", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // 2. Extract article URLs and titles
    const articleLinks = await page.evaluate(() => {
      const data = [];
      const links = document.querySelectorAll("a");

      links.forEach((link) => {
        const href = link.href;
        const title = link.innerText.trim();

        // STRICT FILTERS:
        if (
          href.includes("/blogs/") &&
          !href.includes("#") &&
          title.length > 20 &&
          !title.toLowerCase().includes("read more")
        ) {
          data.push({
            title: title,
            url: href,
          });
        }
      });
      return data;
    });

    // Deduplicate
    const uniqueLinks = Array.from(
      new Map(articleLinks.map((item) => [item.url, item])).values()
    );

    console.log(`📋 Found ${uniqueLinks.length} unique article links`);

    // 3. Visit each article page and scrape content
    const articles = [];
    const maxArticles = 5;

    for (let i = 0; i < Math.min(uniqueLinks.length, maxArticles); i++) {
      const link = uniqueLinks[uniqueLinks.length - 1 - i]; // Get oldest first (reverse)

      try {
        console.log(
          `📄 [${i + 1}/${maxArticles}] Scraping: ${link.title.substring(
            0,
            50
          )}...`
        );

        await page.goto(link.url, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });

        // Wait a bit for content to load
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Extract content from the article page
        const content = await page.evaluate(() => {
          // Remove unwanted elements
          const unwantedSelectors = [
            "script",
            "style",
            "nav",
            "header",
            "footer",
            ".sidebar",
            ".menu",
            ".advertisement",
            ".ad",
          ];

          unwantedSelectors.forEach((selector) => {
            document.querySelectorAll(selector).forEach((el) => el.remove());
          });

          // Try multiple selectors to find article content
          let text = "";

          // Strategy 1: Look for article tag
          const article = document.querySelector("article");
          if (article) {
            text = article.innerText;
          }

          // Strategy 2: Look for main content area
          if (!text || text.length < 200) {
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
              const element = document.querySelector(selector);
              if (element) {
                const elementText = element.innerText;
                if (elementText.length > text.length) {
                  text = elementText;
                }
              }
            }
          }

          // Strategy 3: Get all paragraphs if nothing else worked
          if (!text || text.length < 200) {
            const paragraphs = Array.from(document.querySelectorAll("p"))
              .map((p) => p.innerText.trim())
              .filter((t) => t.length > 50);
            text = paragraphs.join("\n\n");
          }

          // Clean up the text
          return text
            .replace(/\s+/g, " ")
            .replace(/\n\s*\n/g, "\n\n")
            .trim()
            .slice(0, 3000); // Limit to first 3000 chars
        });

        if (content && content.length > 100) {
          articles.push({
            title: link.title,
            original_url: link.url,
            original_content: content,
            status: "pending",
          });
          console.log(`   ✅ Extracted ${content.length} characters`);
        } else {
          // If we couldn't get content, still add the article with placeholder
          articles.push({
            title: link.title,
            original_url: link.url,
            original_content: "Content could not be extracted from this page.",
            status: "pending",
          });
          console.log(
            `   ⚠️  Could not extract content (${content.length} chars)`
          );
        }

        // Small delay to be polite
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.log(`   ❌ Error scraping this article: ${error.message}`);
        // Still add the article even if scraping failed
        articles.push({
          title: link.title,
          original_url: link.url,
          original_content: `Error fetching content: ${error.message}`,
          status: "pending",
        });
      }
    }

    console.log(`\n✅ Successfully scraped ${articles.length} articles`);
    return articles;
  } catch (error) {
    console.error("❌ Scraping Error:", error.message);
    return [];
  } finally {
    if (browser) await browser.close();
  }
};

module.exports = scrapeArticles;
