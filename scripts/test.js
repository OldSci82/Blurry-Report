import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import path from "path";
import puppeteer from "puppeteer";
import { TwitterApi } from "twitter-api-v2";

dotenv.config();

// Derive __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Brave Search API setup
const braveApiKey = process.env.BRAVE_API_KEY;
const braveApiUrl = "https://api.search.brave.com/res/v1/web/search";

// X API setup
const xApiKey = process.env.X_API_KEY;
const xApiKeySecret = process.env.X_API_KEY_SECRET;
const xAccessToken = process.env.X_ACCESS_TOKEN;
const xAccessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;

// Initialize Twitter client
const twitterClient = new TwitterApi({
  appKey: xApiKey,
  appSecret: xApiKeySecret,
  accessToken: xAccessToken,
  accessSecret: xAccessTokenSecret,
});

// Search terms
const searchTerms = [
  "bigfoot",
  "sasquatch",
  "yeti",
  '"abominable snowman"',
  "mothman",
  '"mothman museum"',
  "chupacabra",
  '"loch ness monster"',
  "nessie",
  '"jersey devil"',
  "wendigo",
  "skinwalker",
  "thunderbird",
  "ogopogo",
  "champ",
  '"flatwoods monster"',
  '"dover demon"',
  '"loveland frog"',
  '"mokele-mbembe"',
  "bunyip",
  "yowie",
  "ropen",
  '"lizard man"',
  '"beast of bray road"',
  "goatman",
  "kraken",
  "megalodon",
  "jackalope",
  "hodag",
  "pukwudgie",
  "snallygaster",
  "chessie",
  '"altamaha-ha"',
  '"bear lake monster"',
  '"mongolian death worm"',
  '"nandi bear"',
  '"ozark howler"',
  '"honey island swamp monster"',
  '"fouke monster"',
  '"mothman prophecies"',
  "ufo",
  '"unidentified flying object"',
  "extraterrestrial",
  "alien",
  '"alien sighting"',
  '"flying saucer"',
  "roswell",
  '"area 51"',
  '"crop circle"',
  '"alien abduction"',
  '"grey alien"',
  "reptilian",
  '"men in black"',
  '"ufo sighting"',
  '"extraterrestrial life"',
  '"close encounter"',
  '"alien invasion"',
  "uap",
  '"foo fighter"',
  "martian",
  '"zeta reticuli"',
  '"little green men"',
  '"alien encounter"',
  '"ufo crash"',
  '"extraterrestrial contact"',
  '"kecksburg ufo"',
  '"phoenix lights"',
  '"rendlesham forest"',
  '"betty and barney hill"',
  '"ancient aliens"',
  "werewolf",
  "vampire",
  "zombie",
  "ghost",
  '"ghost sighting"',
  "poltergeist",
  "banshee",
  "demon",
  "djinn",
  "golem",
  "changelings",
  "dullahan",
  "kelpie",
  "selkie",
  "leprechaun",
  "troll",
  "ogre",
  '"bigfoot-like creature"',
  '"sea monster"',
  '"lake monster"',
  '"supernatural creature"',
  '"paranormal activity"',
  '"unexplained phenomenon"',
  '"shadow person"',
  "hellhound",
  '"black-eyed children"',
  '"moth-like creature"',
  '"spectral entity"',
  "phantom",
  '"cryptid creature"',
];

// URLs to include (previously skipped)
const includeUrls = [
  "https://science.howstuffworks.com/science-vs-myth/strange-creatures/cryptids.htm",
  "https://www.quora.com/Which-mythical-creatures-Bigfoot-Loch-Ness-Monster-Chupacabras-Jersey-Devil-Kraken-Yeti-etc-have-the-most-convincing-evidence-of-their-supposed-existence",
  "https://cryptozoologycryptids.fandom.com/wiki/Ogopogo",
  "https://en.wikipedia.org/wiki/List_of_cryptids",
  "https://www.rpg.net/columns/beasts/beasts7.phtml",
  "https://en.wikipedia.org/wiki/Honey_Island_Swamp_monster",
  "https://science.howstuffworks.com/science-vs-myth/strange-creatures/honey-island-swamp-monster.htm",
  "https://en.wikipedia.org/wiki/Roswell_incident",
  "https://en.wikipedia.org/wiki/List_of_reported_UFO_sightings",
  "https://cryptidz.fandom.com/wiki/UFO",
  "https://www.loc.gov/collections/finding-our-place-in-the-cosmos-with-carl-sagan/articles-and-essays/life-on-other-worlds/ufos-and-aliens-among-us",
  "https://en.wikipedia.org/wiki/Grey_alien",
  "https://en.wikipedia.org/wiki/Barney_and_Betty_Hill_incident",
  "https://whitewolf.fandom.com/wiki/Banshee",
  "https://usghostadventures.com/uncategorized/exploring-the-myths-of-irelands-legendary-creatures/",
  "https://www.connollycove.com/mythical-monsters-in-irish-folklore/",
  "https://en.wikipedia.org/wiki/Black_dog_(folklore)",
];

// Function to check if content is from the past month (June 8 – July 8, 2025)
function isRecent(content, $, result) {
  const dateRegex =
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}(st|nd|rd|th)?,?\s+2025\b|\b\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+2025\b|\b2025[-/]\d{2}[-/]\d{2}\b/;
  const pageText = content || $("body").text();
  if (dateRegex.test(pageText)) {
    const dateMatch = pageText.match(dateRegex)[0];
    try {
      const parsedDate = new Date(dateMatch);
      const oneMonthAgo = new Date("2025-06-08T00:00:00Z");
      const endDate = new Date("2025-07-08T23:59:59Z");
      return parsedDate >= oneMonthAgo && parsedDate <= endDate;
    } catch (e) {
      return false;
    }
  }
  // Check <time> tags
  const timeTags = $("time")
    .map((i, el) => $(el).attr("datetime") || $(el).text())
    .get();
  for (const time of timeTags) {
    try {
      const parsedDate = new Date(time);
      const oneMonthAgo = new Date("2025-06-08T00:00:00Z");
      const endDate = new Date("2025-07-08T23:59:59Z");
      if (parsedDate >= oneMonthAgo && parsedDate <= endDate) {
        return true;
      }
    } catch (e) {}
  }
  // Fallback to result metadata or X post creation date
  if (result?.meta?.last_updated || result?.created_at) {
    try {
      const parsedDate = new Date(
        result.meta?.last_updated || result.created_at
      );
      const oneMonthAgo = new Date("2025-06-08T00:00:00Z");
      const endDate = new Date("2025-07-08T23:59:59Z");
      return parsedDate >= oneMonthAgo && parsedDate <= endDate;
    } catch (e) {}
  }
  return false;
}

// Function to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Function to check remaining rate limit
async function checkRateLimit() {
  try {
    const response = await twitterClient.v2.get("users/me", {
      "user.fields": "id",
    });
    const headers = response._headers;
    const remaining = headers["x-rate-limit-remaining"];
    const resetTime = headers["x-rate-limit-reset"];
    return {
      remaining: parseInt(remaining, 10),
      resetTime: parseInt(resetTime, 10) * 1000,
    };
  } catch (error) {
    console.error("Error checking rate limit:", error.message);
    return { remaining: 0, resetTime: Date.now() + 15 * 60 * 1000 };
  }
}

// Function to fetch X posts with rate limit handling and exponential backoff
async function fetchXPosts(terms, maxResults) {
  if (!xApiKey || !xApiKeySecret || !xAccessToken || !xAccessTokenSecret) {
    console.error("Missing X API credentials");
    return [];
  }

  const chunkSize = 10;
  const termChunks = [];
  for (let i = 0; i < terms.length; i += chunkSize) {
    termChunks.push(terms.slice(i, i + chunkSize).join(" OR "));
  }

  const posts = [];
  for (const chunk of termChunks) {
    const query = `${chunk} -is:retweet -is:reply`;
    if (query.length > 512) {
      console.warn(`Query too long, skipping chunk: ${chunk.slice(0, 50)}...`);
      continue;
    }

    let attempts = 0;
    const maxAttempts = 3;
    let backoff = 1000; // Initial backoff: 1 second

    while (attempts < maxAttempts) {
      const rateLimit = await checkRateLimit();
      if (rateLimit.remaining <= 0) {
        const waitTime = rateLimit.resetTime - Date.now();
        if (waitTime > 0) {
          console.log(
            `Rate limit reached, waiting ${Math.ceil(
              waitTime / 1000
            )} seconds...`
          );
          await delay(waitTime);
        }
      }

      try {
        const response = await twitterClient.v2.search(query, {
          "tweet.fields": "created_at,author_id",
          max_results: Math.ceil(maxResults / termChunks.length),
          start_time: "2025-06-08T00:00:00Z",
          end_time: "2025-07-08T23:59:59Z",
        });

        for await (const tweet of response) {
          if (
            !tweet.text.match(
              /(amazon|ebay|walmart|etsy|shopify|target|teepublic|redbubble|cryptozootees|\/shop|\/store|\/buy|\/cart|\/product|imdb|rottentomatoes|netflix|hulu|disneyplus|\/movie|\/film|\/watch|balatro)/i
            )
          ) {
            posts.push({
              url: `https://x.com/statuses/${tweet.id}`,
              title: `X Post by ${tweet.author_id}`,
              content: tweet.text.slice(0, 500),
              created_at: tweet.created_at,
            });
          }
        }
        break; // Success, move to next chunk
      } catch (error) {
        if (error.code === 429) {
          attempts++;
          const retryAfter = error.headers?.["x-rate-limit-reset"]
            ? parseInt(error.headers["x-rate-limit-reset"], 10) * 1000 -
              Date.now()
            : backoff;
          console.error(
            `429 error for chunk "${chunk.slice(
              0,
              50
            )}...": Attempt ${attempts}/${maxAttempts}, waiting ${Math.ceil(
              retryAfter / 1000
            )} seconds...`
          );
          await delay(retryAfter);
          backoff *= 2; // Exponential backoff
        } else {
          console.error(
            `Error fetching X posts for chunk "${chunk.slice(0, 50)}...": ${
              error.message
            }`
          );
          break;
        }
      }
    }
    await delay(1000); // Avoid overwhelming API even within limits
  }
  return posts.slice(0, maxResults);
}

// Function to scrape content and return source URLs
async function scrapeWebForContent(
  subject,
  maxResults = 20,
  appendToFile = false
) {
  // Validate inputs
  if (!braveApiKey) {
    return {
      message: "Error: Brave API key is missing",
      results: [],
      error: "BRAVE_API_KEY environment variable is not set",
      skipped_urls: [],
    };
  }
  if (!subject || typeof subject !== "string" || subject.trim() === "") {
    return {
      message: "Error: Invalid search subject",
      results: [],
      error: "Subject must be a non-empty string",
      skipped_urls: [],
    };
  }
  if (maxResults < 1 || maxResults > 20) {
    return {
      message: "Error: Invalid maxResults value",
      results: [],
      error: "maxResults must be between 1 and 20 for free tier",
      skipped_urls: [],
    };
  }

  // Initialize puppeteer
  let browser;
  const results = [];
  const skippedUrls = [];
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    // Step 1: Fetch X posts (target ~10)
    const xPosts = await fetchXPosts(searchTerms, Math.min(10, maxResults));
    for (const post of xPosts) {
      if (results.length >= maxResults) break;
      if (isRecent(post.content, cheerio.load("<div></div>"), post)) {
        results.push(post);
      } else {
        skippedUrls.push({ url: post.url, reason: "Not from past month" });
      }
    }

    // Step 2: Scrape included URLs
    for (const url of includeUrls) {
      if (results.length >= maxResults) break;
      try {
        const page = await browser.newPage();
        await page.setUserAgent(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        );
        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
        for (let i = 0; i < 3; i++) {
          await page.evaluate(() =>
            window.scrollTo(0, document.body.scrollHeight)
          );
          await delay(3000);
        }
        const html = await page.content();
        await page.close();

        const $ = cheerio.load(html);
        const content = $(
          "p, article, .post-content, .article-body, .post-body, .content, .post, .tweet, .status"
        )
          .not(
            "script, style, nav, footer, .advertisement, .sidebar, .login, .paywall"
          )
          .map((i, el) => $(el).text().trim())
          .get()
          .filter((text) => text.length > 20)
          .join(" ")
          .slice(0, 500);

        results.push({
          url,
          title: $("title").text() || url,
          content: content || "No content extracted",
        });
      } catch (error) {
        console.error(`Error scraping ${url}:`, error.message);
        skippedUrls.push({ url, reason: `Scraping failed: ${error.message}` });
      }
    }

    // Step 3: Search Brave for additional web results (target remaining slots)
    const termChunks = [];
    for (let i = 0; i < searchTerms.length; i += 10) {
      termChunks.push(searchTerms.slice(i, i + 10).join(" OR "));
    }

    for (const chunk of termChunks) {
      if (results.length >= maxResults) break;
      const newsQuery = `${subject} (${chunk})`;
      try {
        const searchResponse = await axios.get(braveApiUrl, {
          params: {
            q: newsQuery,
            count: Math.ceil((maxResults - results.length) / termChunks.length),
          },
          headers: {
            Accept: "application/json",
            "X-Subscription-Token": braveApiKey,
          },
        });

        const searchResults = searchResponse.data.web?.results || [];
        if (!searchResults.length) {
          console.log(`No results for chunk: ${newsQuery}`);
          continue;
        }

        for (const result of searchResults) {
          if (results.length >= maxResults) break;
          if (includeUrls.includes(result.url)) continue;

          const isExcluded = result.url.match(
            /(amazon|ebay|walmart|etsy|shopify|target|teepublic|redbubble|cryptozootees|\/shop|\/store|\/buy|\/cart|\/product|imdb|rottentomatoes|netflix|hulu|disneyplus|\/movie|\/film|\/watch|balatro)/i
          );

          if (isExcluded) {
            skippedUrls.push({
              url: result.url,
              reason: "Excluded site (retail, movie, wiki, or gaming)",
            });
            continue;
          }

          try {
            const page = await browser.newPage();
            await page.setUserAgent(
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            );
            await page.goto(result.url, {
              waitUntil: "networkidle2",
              timeout: 30000,
            });
            for (let i = 0; i < 3; i++) {
              await page.evaluate(() =>
                window.scrollTo(0, document.body.scrollHeight)
              );
              await delay(3000);
            }
            const html = await page.content();
            await page.close();

            const $ = cheerio.load(html);
            const content = $(
              "p, article, .post-content, .article-body, .post-body, .content, .post, .tweet, .status"
            )
              .not(
                "script, style, nav, footer, .advertisement, .sidebar, .login, .paywall"
              )
              .map((i, el) => $(el).text().trim())
              .get()
              .filter((text) => text.length > 20)
              .join(" ")
              .slice(0, 500);

            if (
              !isRecent(content, $, result) &&
              !includeUrls.includes(result.url)
            ) {
              skippedUrls.push({
                url: result.url,
                reason: "Content not from past month",
              });
              continue;
            }

            results.push({
              url: result.url,
              title: result.title,
              content: content || "No content extracted",
            });
          } catch (error) {
            console.error(`Error scraping ${result.url}:`, error.message);
            skippedUrls.push({
              url: result.url,
              reason: `Scraping failed: ${error.message}`,
            });
          }
        }
      } catch (error) {
        console.error(`Error with query chunk "${chunk}":`, error.message);
        if (error.response?.status === 429) {
          const retryAfter = error.response?.headers["retry-after"]
            ? parseInt(error.response.headers["retry-after"], 10) * 1000
            : 15 * 60 * 1000;
          console.log(
            `Brave API rate limit hit, waiting ${Math.ceil(
              retryAfter / 1000
            )} seconds...`
          );
          await delay(retryAfter);
          // Retry logic
          try {
            const retryResponse = await axios.get(braveApiUrl, {
              params: {
                q: newsQuery,
                count: Math.ceil(
                  (maxResults - results.length) / termChunks.length
                ),
              },
              headers: {
                Accept: "application/json",
                "X-Subscription-Token": braveApiKey,
              },
            });
            const searchResults = retryResponse.data.web?.results || [];
            for (const result of searchResults) {
              if (results.length >= maxResults) break;
              if (includeUrls.includes(result.url)) continue;

              const isExcluded = result.url.match(
                /(amazon|ebay|walmart|etsy|shopify|target|teepublic|redbubble|cryptozootees|\/shop|\/store|\/buy|\/cart|\/product|imdb|rottentomatoes|netflix|hulu|disneyplus|\/movie|\/film|\/watch|balatro)/i
              );

              if (isExcluded) {
                skippedUrls.push({ url: result.url, reason: "Excluded site" });
                continue;
              }

              try {
                const page = await browser.newPage();
                await page.setUserAgent(
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                );
                await page.goto(result.url, {
                  waitUntil: "networkidle2",
                  timeout: 30000,
                });
                for (let i = 0; i < 3; i++) {
                  await page.evaluate(() =>
                    window.scrollTo(0, document.body.scrollHeight)
                  );
                  await delay(3000);
                }
                const html = await page.content();
                await page.close();

                const $ = cheerio.load(html);
                const content = $(
                  "p, article, .post-content, .article-body, .post-body, .content, .post, .tweet, .status"
                )
                  .not(
                    "script, style, nav, footer, .advertisement, .sidebar, .login, .paywall"
                  )
                  .map((i, el) => $(el).text().trim())
                  .get()
                  .filter((text) => text.length > 20)
                  .join(" ")
                  .slice(0, 500);

                if (
                  !isRecent(content, $, result) &&
                  !includeUrls.includes(result.url)
                ) {
                  skippedUrls.push({
                    url: result.url,
                    reason: "Content not from past month",
                  });
                  continue;
                }

                results.push({
                  url: result.url,
                  title: result.title,
                  content: content || "No content extracted",
                });
              } catch (error) {
                console.error(`Error scraping ${result.url}:`, error.message);
                skippedUrls.push({
                  url: result.url,
                  reason: `Scraping failed: ${error.message}`,
                });
              }
            }
          } catch (retryError) {
            console.error(
              `Retry failed for chunk "${chunk}":`,
              retryError.message
            );
          }
        }
        continue;
      }
      await delay(3000);
    }

    // Step 4: Save results to ../public/news.json
    const filePath = path.resolve(__dirname, "../public/news.json");
    let output;
    if (appendToFile) {
      let existing = { results: [], skipped_urls: [] };
      try {
        existing = JSON.parse(await fs.readFile(filePath, "utf8"));
      } catch (e) {}
      existing.results = [...existing.results, ...results];
      existing.skipped_urls = [...existing.skipped_urls, ...skippedUrls];
      existing.message = `Updated with ${
        results.length
      } new pages for "${subject}" on ${new Date().toISOString()}`;
      existing.timestamp = new Date().toISOString();
      output = existing;
    } else {
      output = {
        message: `Scraped ${results.length} pages for "${subject}"`,
        timestamp: new Date().toISOString(),
        results,
        skipped_urls: skippedUrls,
      };
    }

    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(output, null, 2));
      console.log(`Results saved to ${filePath}`);
    } catch (fileError) {
      console.error("Error saving to news.json:", fileError.message);
      output.error = `Failed to save results: ${fileError.message}`;
    }

    await browser.close();
    return output;
  } catch (error) {
    if (browser) await browser.close();
    console.error("Search error details:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return {
      message: "Error performing search",
      results: [],
      skipped_urls: skippedUrls,
      error: error.message,
      details: error.response?.data,
    };
  }
}

// Example usage
(async () => {
  const subject = "cryptid";
  const result = await scrapeWebForContent(subject, 20, false);
  console.log(result);
})();
