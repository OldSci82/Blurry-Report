import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// Generate default output filename based on current date
const currentDate = new Date();
const dayOfMonth = currentDate.getDate();
const monthNumber = currentDate.getMonth() + 1;
const fullYear = currentDate.getFullYear();

const url =
  "https://real-time-news-data.p.rapidapi.com/search?query=-sex%20AND%20-monsterhunternow.com%20AND%20-pelosi%20AND%20(sighting%20OR%20sighted%20OR%20spotting%20OR%20spotted)%20AND%20(mystery%20OR%20creature%20OR%20cryptid%20OR%20bigfoot%20OR%20sasquatch%20OR%20yeti%20OR%20mothman%20OR%20chupacabra%20OR%20thunderbird)&limit=50&time_published=7d&lang=en";
const options = {
  method: "GET",
  headers: {
    "x-rapidapi-key": process.env.RAPIDAPI_KEY,
    "x-rapidapi-host": "real-time-news-data.p.rapidapi.com",
  },
};

// Phrases to exclude (case-insensitive)
const forbiddenPhrases = [
  "mystery man",
  "mystery men",
  "mystery woman",
  "mystery women",
  "Murder Mysteries",
  "Donald Trump",
];

async function fetchAndSaveNews() {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Response body:", errorText);
      if (response.status === 429) {
        throw new Error("API rate limit exceeded. Try again later.");
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    console.log("API Response:", result); // Debug: Log raw response

    // Filter and map data, excluding forbidden phrases
    const newsData = result.data
      .filter((item) => {
        const text = `${item.title} ${
          item.snippet || item.description || ""
        }`.toLowerCase();
        return !forbiddenPhrases.some((phrase) =>
          text.includes(phrase.toLowerCase())
        );
      })
      .map((item) => ({
        headline: item.title,
        snippet: item.snippet || item.description || "No snippet available",
        source: item.source_name,
        date: item.published_datetime_utc,
        link: item.link,
      }));

    // Save daily JSON file
    const dailyOutputFile = path.resolve(
      process.cwd(),
      `real-time-news-data-${monthNumber}-${dayOfMonth}-${fullYear}.json`
    );
    await fs.writeFile(dailyOutputFile, JSON.stringify(newsData, null, 2));
    console.log(`Daily news data saved to ${dailyOutputFile}`);
    console.log("Sample daily data:", newsData.slice(0, 2));

    // Append to news-master.json, excluding duplicates
    const masterOutputFile = path.resolve(
      process.cwd(),
      "..",
      "news-master.json"
    );
    let existingData = [];
    try {
      const fileContent = await fs.readFile(masterOutputFile, "utf8");
      existingData = JSON.parse(fileContent);
      if (!Array.isArray(existingData)) {
        console.warn(
          "news-master.json is not an array, initializing as empty array"
        );
        existingData = [];
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        console.log("news-master.json not found, creating new file");
      } else {
        throw error; // Rethrow non-file-not-found errors
      }
    }

    // Filter out duplicates based on link
    const existingLinks = new Set(existingData.map((item) => item.link));
    const newUniqueData = newsData.filter(
      (item) => !existingLinks.has(item.link)
    );
    const combinedData = [...existingData, ...newUniqueData];

    // Save to news-master.json
    await fs.writeFile(masterOutputFile, JSON.stringify(combinedData, null, 2));
    console.log(`Master news data updated at ${masterOutputFile}`);
    //console.log("New entries added:", newUniqueData.length);
    //console.log("Sample master data:", combinedData.slice(0, 2));
  } catch (error) {
    console.error("Error fetching or saving news:", error.message);
  }
}

fetchAndSaveNews();
