import axios from "axios";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import path from "path";

// Hardcoded bearer token (from getBigfootTweet.js)
const BEARER_TOKEN =
  "AAAAAAAAAAAAAAAAAAAAACCk2wEAAAAApbPIfQLu2gC4vzcxTcaEbDgSDd8%3DS3VkS3cb9W1DN6cSMfNymGZH1vzewy1IujY72Vk8B6minqvy5j"; // Replace if different

// Derive __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Function to get today's date in YYYY-MM-DD format (from getBigfootTweet.js)
function getTodayDate() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

// Function to fetch one X post with rate limit handling
async function fetchXPost() {
  // Validate bearer token
  if (!BEARER_TOKEN) {
    console.error("Missing X API bearer token");
    return {
      message: "Error: Missing X API bearer token",
      timestamp: new Date().toISOString(),
      results: [],
      skipped_urls: [],
      error:
        "BEARER_TOKEN not set. Please update with a valid bearer token from X Developer Portal.",
    };
  }

  const query = "bigfoot -is:retweet -is:reply";
  let results = [];
  let skippedUrls = [];
  const startTime = `${getTodayDate()}T00:00:00Z`; // Today, e.g., 2025-07-08T00:00:00Z
  const endTime = new Date().toISOString(); // Current UTC time (~2025-07-08T13:41:00Z)

  if (query.length > 512) {
    console.warn(`Query too long: ${query.slice(0, 50)}...`);
    skippedUrls.push({
      url: query,
      reason: "Query exceeds 512 character limit",
    });
    return {
      message: `Fetched 0 X post(s) for "bigfoot"`,
      timestamp: new Date().toISOString(),
      results,
      skipped_urls: skippedUrls,
    };
  }

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts && results.length < 1) {
    try {
      console.log(
        `Fetching X post with query: ${query}, start_time: ${startTime}, end_time: ${endTime}`
      );
      const response = await axios.get(
        "https://api.twitter.com/2/tweets/search/recent",
        {
          headers: {
            Authorization: `Bearer ${BEARER_TOKEN}`,
          },
          params: {
            query,
            "tweet.fields": "created_at,author_id",
            max_results: 10, // Fetch up to 10 to ensure at least one valid post
            start_time: startTime,
            end_time: endTime,
          },
        }
      );

      // Log response headers
      console.log("X API Response Headers:", response.headers);

      // Check rate limit headers
      const remaining = response.headers["x-rate-limit-remaining"]
        ? parseInt(response.headers["x-rate-limit-remaining"], 10)
        : null;
      const resetTime = response.headers["x-rate-limit-reset"]
        ? parseInt(response.headers["x-rate-limit-reset"], 10) * 1000
        : null;
      if (remaining === 0 && resetTime) {
        const waitTime = Math.max(
          (resetTime - Math.floor(Date.now() / 1000)) * 1000,
          0
        );
        console.log(
          `Rate limit reached, waiting ${Math.ceil(
            waitTime / 1000
          )} seconds until ${new Date(resetTime).toISOString()}...`
        );
        await delay(waitTime);
        attempts++;
        continue;
      }

      const tweets = response.data.data || [];
      let postCount = 0;
      for (const tweet of tweets) {
        if (postCount >= 1) break; // Stop after one valid post
        if (
          !tweet.text.match(
            /(amazon|ebay|walmart|etsy|shopify|target|teepublic|redbubble|cryptozootees|\/shop|\/store|\/buy|\/cart|\/product|imdb|rottentomatoes|netflix|hulu|disneyplus|\/movie|\/film|\/watch|balatro)/i
          )
        ) {
          results.push({
            url: `https://x.com/statuses/${tweet.id}`,
            title: `X Post by ${tweet.author_id}`,
            content: tweet.text.slice(0, 500),
            created_at: tweet.created_at,
          });
          postCount++;
        } else {
          skippedUrls.push({
            url: `https://x.com/statuses/${tweet.id}`,
            reason: "Excluded due to commercial or media content",
          });
        }
      }
      console.log(`Fetched ${results.length} X posts for query: ${query}`);
      break; // Success, exit loop
    } catch (error) {
      if (error.response?.status === 429) {
        attempts++;
        const resetTime = error.response.headers["x-rate-limit-reset"]
          ? parseInt(error.response.headers["x-rate-limit-reset"], 10)
          : Math.floor(Date.now() / 1000) + 900; // Default 15 min
        const waitTime = Math.max(
          (resetTime - Math.floor(Date.now() / 1000)) * 1000,
          0
        );
        console.error(
          `429 error for query "${query.slice(
            0,
            50
          )}...": Attempt ${attempts}/${maxAttempts}, waiting ${Math.ceil(
            waitTime / 1000
          )} seconds until ${new Date(resetTime * 1000).toISOString()}...`,
          {
            headers: error.response?.headers,
            data: error.response?.data,
          }
        );
        await delay(waitTime);
      } else {
        console.error(
          `Error fetching X posts for query "${query.slice(0, 50)}...":`,
          {
            message: error.message,
            code: error.response?.status,
            data: error.response?.data,
            headers: error.response?.headers,
          }
        );
        skippedUrls.push({ url: query, reason: `API error: ${error.message}` });
        break; // Exit on non-429 errors
      }
    }
  }

  // Save results to ../public/news.json
  const filePath = path.resolve(__dirname, "../public/news.json");
  const output = {
    message: `Fetched ${results.length} X post(s) for "bigfoot"`,
    timestamp: new Date().toISOString(),
    results,
    skipped_urls: skippedUrls,
  };

  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(output, null, 2));
    console.log(`Results saved to ${filePath}`);
  } catch (fileError) {
    console.error("Error saving to news.json:", fileError.message);
    output.error = `Failed to save results: ${fileError.message}`;
  }

  return output;
}

// Example usage
(async () => {
  const result = await fetchXPost();
  console.log(JSON.stringify(result, null, 2));
})();
