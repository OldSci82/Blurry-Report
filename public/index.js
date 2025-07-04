async function displayNews() {
  const container = document.getElementById("news-container");

  try {
    container.innerHTML = "<p>Loading...</p>";
    const response = await fetch("../news.json"); // Changed from ../news.json
    if (!response.ok) throw new Error("Failed to load news data");
    const data = await response.json();

    container.innerHTML = "";

    if (data.articles.length === 0) {
      container.innerHTML = "<p>No results found.</p>";
      return;
    }

    data.articles.forEach((article) => {
      const div = document.createElement("div");
      div.className = "news-item";
      div.innerHTML = `
        <h3><a href="${article.url}" target="_blank">${article.title}</a></h3>
        <p>${article.description}</p>
      `;
      container.appendChild(div);
    });
  } catch (error) {
    container.innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

displayNews();
