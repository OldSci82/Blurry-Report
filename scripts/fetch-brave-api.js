// Filename: getBigfootSearch.js

import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const X_BEARER_TOKEN =
  process.env.X_BEARER_TOKEN ||
  "AAAAAAAAAAAAAAAAAAAAACCk2wEAAAAA7RxlebF%2FZCcp%2By4Xb20p9nRDKe4%3DpIxP8oJUEm9bYTMjtzgUK2M2Po548QiK20NiHmci2KwHrPdU8i";
const BRAVE_API_KEY =
  process.env.BRAVE_API_KEY || "BSAsdkJ6NZIjFmmSAF-MDaN_TY1YI_b";
const NEWS_API_KEY =
  process.env.NEWS_API_KEY || "3caf7bf4fc3444bf90df1b232ccb9b29";

function getDateRange() {
  const now = new Date();
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days for Brave/News
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days for X
  return {
    to: now.toISOString(),
    from: oneMonthAgo.toISOString(),
    xFrom: sevenDaysAgo.toISOString(),
  };
}

async function saveResultsToFile(results, filename) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const filePath = path.join(__dirname, filename);
  try {
    await fs.writeFile(filePath, JSON.stringify(results, null, 2));
    console.log(`Results saved to ${filePath}`);
  } catch (error) {
    console.error(`Failed to save results to ${filePath}:`, error.message);
  }
}

async function searchX(maxRetries = 2, retryDelay = 60000) {
  const query = "bigfoot -is:retweet lang:en";
  const { xFrom } = getDateRange();
  const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(
    query
  )}&max_results=10&start_time=${xFrom}`;

  try {
    console.log("X API URL:", url);
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${X_BEARER_TOKEN}`,
      },
    });
    console.log("X API Response Status:", response.status);
    if (response.status === 429 && maxRetries > 0) {
      console.log("X API Rate Limit Headers:", {
        remaining: response.headers.get("x-rate-limit-remaining"),
        reset: response.headers.get("x-rate-limit-reset"),
        limit: response.headers.get("x-rate-limit-limit"),
      });
      console.warn(
        `X API rate limit reached. Waiting ${
          retryDelay / 1000
        } seconds... (${maxRetries} retries left)`
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return searchX(maxRetries - 1, retryDelay * 2);
    }
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`X API Error: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    const result = data.data?.[0];
    return result
      ? [
          {
            source: "X",
            id: result.id,
            text: result.text,
            url: `https://twitter.com/i/web/status/${result.id}`,
            created_at: result.created_at,
          },
        ]
      : [];
  } catch (error) {
    console.error("X API Error:", error.message);
    return [];
  }
}

async function searchBrave() {
  const { from, to } = getDateRange();
  const url = `https://api.search.brave.com/res/v1/web/search?q=bigfoot&count=10&freshness=${encodeURIComponent(
    `${from}..${to}`
  )}`;

  try {
    console.log("Brave API URL:", url);
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": BRAVE_API_KEY,
      },
    });
    console.log("Brave API Response Status:", response.status);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Brave API Error: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    console.log("Brave API Raw Results Count:", data.web?.results?.length || 0);
    const result = data.web?.results?.[0];
    return result
      ? [
          {
            source: "Brave",
            title: result.title,
            url: result.url,
            description: result.description,
            created_at: result.page_age || new Date().toISOString(),
          },
        ]
      : [];
  } catch (error) {
    console.error("Brave API Error:", error.message);
    return [];
  }
}

async function searchNews(maxRetries = 2, retryDelay = 120000) {
  // Increased initial delay to 2 minutes
  const { from } = getDateRange();
  const url = `https://newsapi.org/v2/everything?q=bigfoot&from=${from}&sortBy=publishedAt&apiKey=${NEWS_API_KEY}&pageSize=1`;

  try {
    console.log("News API URL:", url);
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    console.log("News API Response Status:", response.status);
    if (response.status === 429 && maxRetries > 0) {
      console.warn(
        `News API rate limit reached. Waiting ${
          retryDelay / 1000
        } seconds... (${maxRetries} retries left)`
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return searchNews(maxRetries - 1, retryDelay * 2);
    }
    if (!response.ok) {
      throw new Error(
        `News API Error: ${response.status} - ${response.statusText}`
      );
    }
    const data = await response.json();
    const result = data.articles?.[0];
    return result
      ? [
          {
            source: "NewsAPI",
            title: result.title,
            url: result.url,
            description: result.description,
            created_at: result.publishedAt,
          },
        ]
      : [];
  } catch (error) {
    console.error("News API Error:", error.message);
    return [];
  }
}

async function getBigfootSearch() {
  try {
    const [xResults, braveResults, newsResults] = await Promise.all([
      searchX(),
      searchBrave(),
      searchNews(),
    ]);

    console.log(
      `X Results: ${xResults.length}, Brave Results: ${braveResults.length}, News Results: ${newsResults.length}`
    );

    const allResults = [
      ...xResults.slice(0, 1),
      ...braveResults.slice(0, 1),
      ...newsResults.slice(0, 1),
    ];

    const output = {
      query: "bigfoot",
      timestamp: new Date().toISOString(),
      results_count: allResults.length,
      results: allResults,
    };

    if (allResults.length === 0) {
      console.warn("No results found from any API.");
      output.note =
        "No results found due to API rate limits or no fresh content.";
    }

    await saveResultsToFile(output, "bigfoot_search_results.json");
    console.log(`Found ${allResults.length} total results`);
    console.log(
      "Sources:",
      [...new Set(allResults.map((r) => r.source))].join(", ") || "None"
    );

    return output;
  } catch (error) {
    console.error("Error in getBigfootSearch:", error.message);
    const output = {
      query: "bigfoot",
      timestamp: new Date().toISOString(),
      results_count: 0,
      results: [],
      note: `Script error: ${error.message}`,
    };
    await saveResultsToFile(output, "bigfoot_search_results.json");
    return output;
  }
}

getBigfootSearch();
