import { countryCodeMap } from "./country-codes.js";
//=============================================
// Map Initialization
//=============================================
const map = L.map("map", {
  center: [20, 0],
  zoom: 2,
  noWrap: true,
  worldCopyJump: false,
  maxBounds: [
    [-85, -180],
    [85, 180],
  ],
  maxBoundsViscosity: 1.0,
});

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  noWrap: true,
  bounds: [
    [-85, -180],
    [85, 180],
  ],
  className: "map-tiles", // Add class for CSS filter targeting
}).addTo(map);

//=============================================
// Sidebar for Unmapped Sightings
//=============================================
const unmappedList = document.getElementById("unmapped");
const unmappedUL = document.getElementById("unmapped-list");

//=============================================
// Toggle Button for Sidebar
//=============================================
const toggleBtn = document.createElement("button");
toggleBtn.textContent = "Hide Unmapped";
toggleBtn.className = "toggle-btn";
document.body.appendChild(toggleBtn);

// Toggle logic for sidebar
let isSidebarVisible = true;
toggleBtn.addEventListener("click", () => {
  isSidebarVisible = !isSidebarVisible;
  unmappedList.style.display = isSidebarVisible ? "block" : "none";
  toggleBtn.textContent = isSidebarVisible ? "Hide Unmapped" : "Show Unmapped";
});

//=============================================
// Dark Mode Toggle
//=============================================
const darkModeToggle = document.getElementById("dark-mode-toggle");
let isDarkMode = false; // Default to light mode
darkModeToggle.addEventListener("click", () => {
  isDarkMode = !isDarkMode;
  document.getElementById("map").classList.toggle("dark-mode", isDarkMode);
  darkModeToggle.textContent = isDarkMode ? "Light Mode" : "Dark Mode";
});

//=============================================
// Utilities
//=============================================
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function geocodeLocation(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query
  )}`;
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "BlurryMap/1.0 (contact@example.com)",
        "Accept-Language": "en-US",
      },
    });

    if (
      !response.ok ||
      !response.headers.get("content-type")?.includes("application/json")
    ) {
      console.warn(`Non-JSON or failed response for query: "${query}"`);
      return null;
    }

    const data = await response.json();
    if (data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
  } catch (error) {
    console.error("Geocode failed:", error);
  }
  return null;
}

function addToUnmappedList(sighting) {
  const li = document.createElement("li");
  li.innerHTML = `<b>${sighting.Summary || "No description"}</b><br>
    <i>${sighting.City || "Unknown"}, ${
    sighting.State || sighting.Country || "Unknown"
  }</i><br>
    <small>Event Date: ${sighting.Occurred || "Unknown"}</small>`;
  unmappedUL.appendChild(li);
}

//=============================================
// Load and Display Sightings
//=============================================
async function loadSightings() {
  try {
    const response = await fetch("./ufo-update-m.json");
    if (!response.ok) {
      throw new Error(`Failed to fetch JSON: ${response.statusText}`);
    }
    const sightings = await response.json();

    for (let i = 0; i < sightings.length; i++) {
      const sighting = sightings[i];

      const city = sighting.City?.trim();
      const state = sighting.State?.trim();
      const country = sighting.Country?.trim();

      let normalizedLocation = country;
      if (state && country) {
        normalizedLocation = `${state}, ${country}`;
      } else if (country) {
        normalizedLocation = countryCodeMap[country] || country;
      }

      let locationQuery = "";
      if (city && city !== "0" && normalizedLocation) {
        locationQuery = `${city}, ${normalizedLocation}`;
      } else if (normalizedLocation) {
        locationQuery = normalizedLocation;
      }

      let coords = null;
      if (locationQuery) {
        coords = await geocodeLocation(locationQuery);
        await sleep(1500); // Respect Nominatim rate limits
      }

      if (!coords) {
        addToUnmappedList(sighting);
        continue;
      }

      const popupContent = `
        <b>${sighting.Summary || "No description"}</b><br>
        <i>${sighting.City || "Unknown"}, ${
        state || country || "Unknown"
      }</i><br>
        <small>Event Date: ${sighting.Occurred || "Unknown"}</small>
        <small>Event Source: ${sighting.source}</small>
      `;

      const ufoIcon = L.icon({
        iconUrl: "./ufo-icon.png",
        iconSize: [38, 38],
      });

      L.marker([coords.lat, coords.lng], { icon: ufoIcon })
        .bindPopup(popupContent)
        .addTo(map);
    }
  } catch (err) {
    console.error("Failed to load or process sightings:", err);
  }
}

loadSightings();
