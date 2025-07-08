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

      // Clean the title: Take text before " | " and trim
      const cleanTitle = article.title.split("|")[0].trim();

      // Truncate title to 150 characters
      const truncatedTitle =
        cleanTitle.length > 150
          ? cleanTitle.substring(0, 147) + "..."
          : cleanTitle;

      // Sanitize content with DOMPurify
      const cleanContent = DOMPurify.sanitize(article.content, {
        ALLOWED_TAGS: ["p", "b", "i", "strong", "em", "a"], // Allow specific tags
        ALLOWED_ATTR: ["href"], // Allow specific attributes
      }).trim();

      // Optionally truncate content to avoid overly long descriptions
      const textContent = cleanContent.replace(/<[^>]+>/g, ""); // Extract text for truncation
      const truncatedContent =
        textContent.length > 200
          ? textContent.substring(0, 197) + "..."
          : cleanContent; // Use cleanContent to preserve HTML if not truncated

      div.innerHTML = `
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
