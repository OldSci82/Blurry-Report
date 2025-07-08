async function displayNews() {
  const container = document.getElementById("news-container");

  try {
    container.innerHTML = "<p>Loading...</p>";
    const response = await fetch("../news.json");
    if (!response.ok) throw new Error("Failed to load news data");
    const data = await response.json();

    container.innerHTML = "";

    if (data.results.length === 0) {
      container.innerHTML = "<p>No results found.</p>";
      return;
    }

    data.results.forEach((article) => {
      const div = document.createElement("div");
      div.className = "news-item";

      // Clean the title: Take text before " | " or use the whole title
      const baseTitle = article.title.includes("|")
        ? article.title.split("|")[0].trim()
        : article.title.trim();

      // Shorten to first sentence or 10 words
      let cleanTitle;
      const sentenceMatch = baseTitle.match(/[^.]+?\./); // Match first sentence
      const words = baseTitle.split(/\s+/); // Split by whitespace

      if (sentenceMatch && sentenceMatch[0].length < baseTitle.length) {
        cleanTitle = sentenceMatch[0].trim(); // Use first sentence
      } else {
        cleanTitle = words.slice(0, 10).join(" ").trim(); // Take first 10 words
      }

      // Truncate to 150 characters
      const truncatedTitle =
        cleanTitle.length > 150
          ? cleanTitle.substring(0, 147) + "..."
          : cleanTitle;

      // Extract root domain from URL
      let rootDomain = "Unknown";
      try {
        const url = new URL(article.url);
        // Simplistic root domain extraction: take last two parts (e.g., howstuffworks.com)
        const parts = url.hostname.split(".");
        rootDomain =
          parts.length >= 2 ? parts.slice(-2).join(".") : url.hostname;
      } catch (e) {
        console.warn(`Invalid URL: ${article.url}`);
      }

      // Sanitize content: Basic HTML stripping
      const cleanContent = article.content.replace(/<[^>]+>/g, "").trim();
      // Truncate content to 200 characters
      const truncatedContent =
        cleanContent.length > 200
          ? cleanContent.substring(0, 197) + "..."
          : cleanContent;

      // Option 1: Root domain above the article
      div.innerHTML = `
        <div class="source-domain">${rootDomain}</div>
        <h3><a href="${article.url}" target="_blank">${truncatedTitle}</a></h3>
        <p>${truncatedContent || "No description available"}</p>
      `;
      container.appendChild(div);
    });
  } catch (error) {
    container.innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

displayNews();
