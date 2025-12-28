// Test script to verify the /process endpoint exists
// Run this with: node test-endpoint.js

const axios = require("axios");

const API_URL = "http://localhost:5000/api/articles";

async function testEndpoints() {
  console.log("🧪 Testing Backend Endpoints...\n");

  // Test 1: Get all articles
  try {
    const response = await axios.get(API_URL);
    console.log("✅ GET /api/articles - Working");
    console.log(`   Found ${response.data.length} articles\n`);

    if (response.data.length > 0) {
      const firstArticle = response.data[0];
      console.log(`   First article: "${firstArticle.title}"`);
      console.log(`   ID: ${firstArticle._id}`);
      console.log(`   Status: ${firstArticle.status}\n`);

      // Test 2: Try to process the first article
      if (firstArticle.status === "pending") {
        console.log("🧪 Testing POST /api/articles/process/:id...\n");
        try {
          const processResponse = await axios.post(
            `${API_URL}/process/${firstArticle._id}`
          );
          console.log("✅ POST /api/articles/process/:id - Working!");
          console.log(`   Response: ${processResponse.data.message}\n`);
        } catch (error) {
          if (error.response) {
            console.log(
              `❌ POST /api/articles/process/:id - ${error.response.status} Error`
            );
            console.log(
              `   Message: ${
                error.response.data.message || error.response.statusText
              }`
            );
            console.log(
              `   This means the route exists but there was an error processing\n`
            );
          } else {
            console.log("❌ POST /api/articles/process/:id - Route NOT FOUND");
            console.log("   Make sure you:");
            console.log(
              "   1. Updated articleController.js with the processArticle function"
            );
            console.log(
              "   2. Updated articleRoutes.js to include the process route"
            );
            console.log("   3. Restarted your backend server\n");
          }
        }
      } else {
        console.log("⚠️  No pending articles to test with");
        console.log("   Run the scraper first to get pending articles\n");
      }
    } else {
      console.log("⚠️  No articles in database");
      console.log("   Run GET /api/articles/scrape first\n");
    }
  } catch (error) {
    console.log("❌ Cannot connect to backend");
    console.log(
      "   Make sure your backend is running on http://localhost:5000\n"
    );
    console.log(`   Error: ${error.message}\n`);
  }
}

testEndpoints();
