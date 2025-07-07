import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchNews() {
  const query =
    "cryptids OR bigfoot OR mothman OR 'loch ness monster' OR chupacabra OR yeti OR sasquatch OR 'jersey devil' -('illegal alien' OR immigration OR movie OR hollywood OR gaming)";
  const apiKey = process.env.NEWS_API_KEY;

  // Validate API key
  if (!apiKey) {
    console.error("Error: NEWS_API_KEY environment variable is not set");
    return;
  }

  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
    query
  )}&language=en&sortBy=relevancy&pageSize=100&apiKey=${apiKey}`;

  try {
    console.log("Fetching URL:", url);
    console.log("URL length:", url.length);

    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Network error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Check for API errors
    if (data.status === "error") {
      throw new Error(`API error: ${data.message}`);
    }

    console.log("Total results:", data.totalResults);

    // Map articles to desired format
    const articles = data.articles.slice(0, 15).map((article) => ({
      source: article.source.name || "Unknown source",
      author: article.author || "Unknown author",
      title: article.title,
      description: article.description || "No description available",
      url: article.url,
      urlToImage: article.urlToImage || null,
      publishedAt: article.publishedAt || null,
      content: article.content
        ? article.content.slice(0, 200) + "..."
        : "No content available",
    }));

    // Ensure output directory exists
    const outputDir = path.join(__dirname, "..", "public");
    await fs.mkdir(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, "news.json");
    await fs.writeFile(outputPath, JSON.stringify({ articles }, null, 2));
    console.log("News data saved to", outputPath);
  } catch (error) {
    console.error("Error fetching news:", error.message);
  }
}

fetchNews();
