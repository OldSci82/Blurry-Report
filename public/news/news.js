// news.js
async function fetchNews() {
  try {
    const response = await fetch("./news-master.json");
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const newsData = await response.json();
    displayNews(newsData);
  } catch (error) {
    console.error("Error fetching news:", error);
    document.getElementById("news-container").innerHTML =
      '<p class="error text-center" style="color: #FFCC00; text-shadow: 0 0 5px #B13BFF;">Error loading news articles. Please try again later.</p>';
  }
}

function displayNews(articles) {
  const newsContainer = document.getElementById("news-container");
  newsContainer.innerHTML = ""; // Clear existing content

  // Sort articles by date in descending order (newest first)
  articles.sort((a, b) => new Date(b.date) - new Date(a.date));

  articles.forEach((article) => {
    // Create article element
    const articleDiv = document.createElement("div");
    articleDiv.classList.add("news-item"); // Uses styled news-item class

    // Create link element
    const link = document.createElement("a");
    link.href = article.link;
    link.classList.add("news-link", "text-decoration-none");
    link.setAttribute("data-bs-toggle", "tooltip");
    link.setAttribute("data-bs-placement", "top");
    link.setAttribute("data-bs-html", "true"); // Allow HTML in tooltip

    // Format date
    const date = new Date(article.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Combine snippet, source, and date in tooltip
    const tooltipContent = `
      <div class="tooltip-content">
        <p class="tooltip-snippet">${article.snippet}</p>
        <p class="tooltip-source"><strong>Source:</strong> ${article.source}</p>
        <p class="tooltip-date"><strong>Date:</strong> ${date}</p>
      </div>
    `;
    link.setAttribute("title", tooltipContent);

    // Set headline as link content
    link.innerHTML = `<h3>${article.headline}</h3>`;

    // Append link to article div
    articleDiv.appendChild(link);
    // Append article div to container
    newsContainer.appendChild(articleDiv);
  });

  // Initialize Bootstrap tooltips with custom styling
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  tooltipTriggerList.forEach((tooltipTriggerEl) => {
    new bootstrap.Tooltip(tooltipTriggerEl, {
      customClass: "custom-tooltip",
      html: true,
    });
  });
}

// Run fetchNews when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", fetchNews);
