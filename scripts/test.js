async function searchCryptidNews(cryptid, apiKey) {
  try {
    // Construct the News API URL with the cryptid query
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
      cryptid
    )}&apiKey=${apiKey}`;

    // Make the API request
    const response = await fetch(url);

    // Check if the response is successful
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Parse the JSON response
    const data = await response.json();

    // Check if the API returned an error
    if (data.status === "error") {
      throw new Error(data.message);
    }

    // Return the articles
    return data.articles.map((article) => ({
      title: article.title,
      description: article.description || "No description available",
      url: article.url,
      source: article.source.name,
      publishedAt: article.publishedAt,
    }));
  } catch (error) {
    console.error("Error fetching cryptid news:", error.message);
    return [];
  }
}

// Example usage
const apiKey = "3caf7bf4fc3444bf90df1b232ccb9b29"; // Replace with your actual API key
const cryptid = "Mothman";

searchCryptidNews(cryptid, apiKey).then((articles) => {
  if (articles.length === 0) {
    console.log(`No articles found for ${cryptid}`);
    return;
  }
  console.log(`Found ${articles.length} articles for ${cryptid}:`);
  articles.forEach((article, index) => {
    console.log(`\nArticle ${index + 1}:`);
    console.log(`Title: ${article.title}`);
    console.log(`Description: ${article.description}`);
    console.log(`Source: ${article.source}`);
    console.log(`Published: ${article.publishedAt}`);
    console.log(`URL: ${article.url}`);
  });
});
