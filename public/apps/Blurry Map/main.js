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
}).addTo(map);

//=============================================
// Sidebar for Unmapped Sightings
//=============================================
const unmappedList = document.createElement("div");
unmappedList.id = "unmapped";
unmappedList.style.cssText = `
  position: absolute;
  top: 10px;
  right: 10px;
  width: 300px;
  max-height: 90vh;
  overflow-y: auto;
  background: white;
  padding: 10px;
  box-shadow: 0 0 10px rgba(0,0,0,0.2);
  z-index: 1000;
  font-family: sans-serif;
  font-size: 14px;
`;
unmappedList.innerHTML = `<h3>Unmapped Sightings</h3><ul id="unmapped-list"></ul>`;
document.body.appendChild(unmappedList);
const unmappedUL = document.getElementById("unmapped-list");

//=============================================
// Toggle Button for Sidebar
//=============================================
const toggleBtn = document.createElement("button");
toggleBtn.textContent = "Hide Unmapped";
toggleBtn.style.cssText = `
  position: absolute;
  top: 10px;
  right: 320px;
  z-index: 1001;
  padding: 5px 10px;
  background: #444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-family: sans-serif;
`;
document.body.appendChild(toggleBtn);

// Toggle logic
let isSidebarVisible = true;
toggleBtn.addEventListener("click", () => {
  isSidebarVisible = !isSidebarVisible;
  unmappedList.style.display = isSidebarVisible ? "block" : "none";
  toggleBtn.textContent = isSidebarVisible ? "Hide Unmapped" : "Show Unmapped";
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
  li.innerHTML = `<b>${
    sighting["Short Description"] || "No description"
  }</b><br>
    <i>${sighting.City || "Unknown"}, ${
    sighting["State/Country"] || "Unknown"
  }</i><br>
    <small>Event Date: ${sighting["Date of Event"] || "Unknown"}</small>`;
  unmappedUL.appendChild(li);
}

//=============================================
// Load and Display Sightings
//=============================================

async function loadSightings() {
  try {
    const response = await fetch("./ufo-update.json");
    const sightings = await response.json();

    for (let i = 0; i < sightings.length; i++) {
      const sighting = sightings[i];

      const city = sighting.City?.trim();
      const stateCountry = sighting["State/Country"]?.trim();

      let normalizedLocation = stateCountry;
      const parts = stateCountry?.split(",").map((p) => p.trim()) || [];

      if (parts.length === 2) {
        // e.g. "WA, US"
        const state = parts[0];
        const code = parts[1];
        const countryName = countryCodeMap[code] || code;
        normalizedLocation = `${state}, ${countryName}`;
      } else if (countryCodeMap[stateCountry]) {
        normalizedLocation = countryCodeMap[stateCountry];
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
        await sleep(1500); // Respect Nominatim rate limits (1.5s per request)
      }

      if (!coords) {
        addToUnmappedList(sighting);
        continue; // Skip placing this one on the map
      }

      const popupContent = `
        <b>${sighting["Short Description"] || "No description"}</b><br>
        <i>${sighting.City || "Unknown"}, ${
        sighting["State/Country"] || "Unknown"
      }</i><br>
        <small>Event Date: ${sighting["Date of Event"] || "Unknown"}</small>
      `;

      const ufoIcon = L.icon({
        iconUrl: "./ufo-icon.png",
        iconSize: [38, 38],
      });
      //L.marker([coords.lat, coords.lng], { icon: ufoIcon }).addTo(map);

      L.marker([coords.lat, coords.lng], { icon: ufoIcon })
        .bindPopup(popupContent)
        .addTo(map);
    }
  } catch (err) {
    console.error("Failed to load or process sightings:", err);
  }
}

loadSightings();
