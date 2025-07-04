import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sites =
  "cryptidz.fandom.com, bfro.net, phantomsandmonsters.com, cryptozoology.com, thecryptidzoo.com, cryptoseeker.com, paranormaldatabase.com, atlasobscura.com, mysteriousuniverse.org, cryptozoonews.com, bigfootencounters.com, sasquatchchronicles.com, northamericanbigfoot.com, cryptozoologynews.com, unexplained-mysteries.com, yourghoststories.com, weirdus.com, cryptozoologymuseum.com, blm.gov, americanforests.org, proxi.co, news.maryland.gov, creelighting.com, blogs.loc.gov, fandomania.com, southernstylesweettees.com, theconversation.com, sciencefriday.com, lithub.com, hangar1publishing.com, web.simmons.edu, reddit.com, forbes.com, mattgyver.com, newanimal.org";

async function fetchNews() {
  const query =
    '(cryptids OR bigfoot OR mothman OR "loch ness monster" OR chupacabra OR yeti OR sasquatch OR "jersey devil" OR ufo OR "unidentified flying object" OR extraterrestrial OR alien OR "alien sighting" OR paranormal OR "ghost sighting" OR supernatural OR cryptid OR monster OR "unexplained phenomenon") -("illegal alien" OR immigration OR border OR "space exploration" OR astronaut OR nasa)';
  const apiKey = process.env.NEWS_API_KEY;
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
    query
  )}&language=en&sortBy=relevancy&apiKey=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network error or invalid API key");
    const data = await response.json();

    // Include additional fields from the API response
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

    const outputPath = path.join(__dirname, "..", "public", "news.json");
    await fs.writeFile(outputPath, JSON.stringify({ articles }, null, 2));
    console.log("News data saved to public/news.json");
  } catch (error) {
    console.error("Error fetching news:", error.message);
  }
}

fetchNews();
