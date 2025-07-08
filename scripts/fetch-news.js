import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchNews() {
  const apiKey = process.env.NEWS_API_KEY;

  // Validate API key
  if (!apiKey) {
    console.error("Error: NEWS_API_KEY environment variable is not set");
    return;
  }

  // Define query groups (11 groups from previous fix)
  const queryGroups = [
    // Cryptids 1
    "bigfoot OR sasquatch OR yeti OR 'abominable snowman' OR mothman OR 'mothman museum' OR chupacabra OR 'loch ness monster' OR nessie OR 'jersey devil'",
    // Cryptids 2
    "wendigo OR skinwalker OR thunderbird OR ogopogo OR champ OR 'flatwoods monster' OR 'dover demon' OR 'loveland frog' OR 'mokele-mbembe' OR bunyip",
    // Cryptids 3
    "yowie OR ropen OR 'lizard man' OR 'beast of bray road' OR goatman OR kraken OR megalodon OR jackalope OR hodag OR pukwudgie",
    // Cryptids 4
    "snallygaster OR chessie OR 'altamaha-ha' OR 'bear lake monster' OR 'mongolian death worm' OR 'nandi bear' OR 'ozark howler' OR 'honey island swamp monster' OR 'fouke monster' OR 'mothman prophecies'",
    // Aliens/UFOs 1
    "ufo OR 'unidentified flying object' OR extraterrestrial OR alien OR 'alien sighting' OR 'flying saucer' OR roswell OR 'area 51' OR 'crop circle' OR 'alien abduction'",
    // Aliens/UFOs 2
    "'grey alien' OR reptilian OR 'men in black' OR 'ufo sighting' OR 'extraterrestrial life' OR 'close encounter' OR 'alien invasion' OR uap OR 'foo fighter' OR martian",
    // Aliens/UFOs 3
    "'zeta reticuli' OR 'little green men' OR 'alien encounter' OR 'ufo crash' OR 'extraterrestrial contact' OR 'kecksburg ufo' OR 'phoenix lights' OR 'rendlesham forest' OR 'betty and barney hill' OR 'ancient aliens'",
    // Monsters/Supernatural 1
    "werewolf OR vampire OR zombie OR ghost OR 'ghost sighting' OR poltergeist OR banshee OR demon OR djinn OR golem",
    // Monsters/Supernatural 2
    "changelings OR dullahan OR kelpie OR selkie OR leprechaun OR troll OR ogre OR 'bigfoot-like creature' OR 'sea monster' OR 'lake monster'",
    // Monsters/Supernatural 3a
    "'supernatural creature' OR 'paranormal activity' OR 'unexplained phenomenon' OR 'shadow person' OR hellhound",
    // Monsters/Supernatural 3b
    "'black-eyed children' OR 'moth-like creature' OR 'spectral entity' OR phantom OR 'cryptid creature'",
  ];

  // Simplified exclusions
  const exclusions =
    "-('illegal alien' OR immigration OR movie OR film OR hollywood OR gaming OR 'video game' OR nasa OR astronaut OR 'space exploration' OR 'elon musk' OR trump OR celebrity)";

  // Use verified News API source IDs
  const allowedSources = [
    "forbes",
    "the-sun",
    "daily-star",
    "daily-mirror",
    "daily-express",
  ];

  // Define sources to exclude
  const excludedSources = [
    "gizmodo",
    "kotaku",
    "theverge",
    "beforeitsnews.com",
    "mysteriousuniverse.org",
    "anomalien.com",
  ];

  const allArticles = new Set(); // Deduplicate by URL
  const allSources = new Set(); // Track unique sources

  // Process each query group
  for (const [index, queryBase] of queryGroups.entries()) {
    const query = `${queryBase} ${exclusions}`;
    const encodedQuery = encodeURIComponent(query);
    const url = `https://newsapi.org/v2/everything?q=${encodedQuery}&language=en&sortBy=relevancy&pageSize=100&sources=${allowedSources.join(
      ","
    )}&apiKey=${apiKey}`;
    // Fallback URL without sources (uncomment to test)
    // const url = `https://newsapi.org/v2/everything?q=${encodedQuery}&language=en&sortBy=relevancy&pageSize=100&apiKey=${apiKey}`;

    try {
      console.log(`Fetching query ${index + 1}:`, query);
      console.log("Encoded query length:", encodedQuery.length);
      console.log("Full URL length:", url.length);

      if (encodedQuery.length > 500) {
        console.warn(
          `Warning: Query ${index + 1} exceeds 500 characters (${
            encodedQuery.length
          }). Consider splitting further.`
        );
      }

      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Network error for query ${index + 1}: ${
            response.status
          } - ${errorText}`
        );
      }

      const data = await response.json();

      // Check for API errors
      if (data.status === "error") {
        throw new Error(`API error for query ${index + 1}: ${data.message}`);
      }

      console.log(`Total results for query ${index + 1}:`, data.totalResults);

      // Filter articles and add to Set
      let excludedCount = 0;
      data.articles.forEach((article) => {
        const sourceName = (article.source.name || "").toLowerCase();
        allSources.add(sourceName); // Track source
        // Check if article source is in excludedSources
        if (excludedSources.some((excluded) => sourceName.includes(excluded))) {
          excludedCount++;
          return; // Skip this article
        }
        allArticles.add(
          JSON.stringify({
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
          })
        );
      });
      console.log(
        `Excluded ${excludedCount} articles from query ${
          index + 1
        } due to source restrictions`
      );
    } catch (error) {
      console.error(`Error fetching query ${index + 1}:`, error.message);
    }
  }

  // Log all unique sources
  console.log("All unique sources found:", Array.from(allSources));

  // Convert Set to array and limit to 15 articles
  const articles = Array.from(allArticles)
    .map((article) => JSON.parse(article))
    .slice(0, 15);

  // Save to file
  try {
    const outputDir = path.join(__dirname, "..", "public");
    await fs.mkdir(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, "news.json");
    await fs.writeFile(outputPath, JSON.stringify({ articles }, null, 2));
    console.log("News data saved to", outputPath);
    console.log(`Total unique articles saved: ${articles.length}`);
  } catch (error) {
    console.error("Error saving news data:", error.message);
  }
}

fetchNews();
