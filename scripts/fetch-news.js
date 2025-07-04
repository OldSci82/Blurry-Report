import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchNews() {
  const query = "cryptids bigfoot monster abduction sighting mothman";
  const apiKey = process.env.NEWS_API_KEY;
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
    query
  )}&language=en&apiKey=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network error or invalid API key");
    const data = await response.json();

    const articles = data.articles.slice(0, 10).map((article) => ({
      title: article.title,
      description: article.description || "No description available",
      url: article.url,
    }));

    const outputPath = path.join(__dirname, "..", "public", "news.json");
    await fs.writeFile(outputPath, JSON.stringify({ articles }, null, 2));
    console.log("News data saved to public/news.json");
  } catch (error) {
    console.error("Error fetching news:", error.message);
  }
}

fetchNews();
