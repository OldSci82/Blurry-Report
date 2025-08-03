import { countryCodeMap } from "./country-codes.js";
import { countyData } from "./county-data.js";

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
  className: "map-tiles",
}).addTo(map);

// Create a marker cluster group with adjusted maxClusterRadius
const markerGroup = L.markerClusterGroup({
  maxClusterRadius: 15, // Cluster only markers within 20 pixels
  disableClusteringAtZoom: 20, // Stop clustering when zoomed in to level 10
  spiderfyOnMaxZoom: true, // Spread out overlapping markers when clicked
  showCoverageOnHover: false, // Disable polygon coverage on hover for simplicity
});

//=============================================
// Loading Indicator
//=============================================
const loadingIndicator = document.createElement("div");
loadingIndicator.id = "loading";
loadingIndicator.style.cssText = `
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7); color: white; padding: 10px 20px;
  border-radius: 5px; z-index: 1000; display: none;
`;
loadingIndicator.textContent = "Loading sightings...";
document.body.appendChild(loadingIndicator);

function showLoading() {
  loadingIndicator.style.display = "block";
}

function hideLoading() {
  loadingIndicator.style.display = "none";
}

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
let isDarkMode = false;
darkModeToggle.addEventListener("click", () => {
  isDarkMode = !isDarkMode;
  document.getElementById("map").classList.toggle("dark-mode", isDarkMode);
  darkModeToggle.textContent = isDarkMode ? "Light Mode" : "Dark Mode";
});

//=============================================
// Utilities
//=============================================
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Coordinate cache initialized from loaded-coordinates.json
let coordinateCache = new Map();

async function initCoordinateCache() {
  try {
    const response = await fetch("./loaded-coordinates.json");
    if (!response.ok) {
      console.warn(
        `Failed to fetch loaded-coordinates.json: ${response.statusText}`
      );
      return;
    }
    const coords = await response.json();
    coords.forEach(({ lat, lon, city, state, country, county }) => {
      const key = city
        ? `${city}, ${state || ""}, ${country || ""}`
            .trim()
            .replace(/, ,/g, ",")
        : `${county}, ${state}`;
      coordinateCache.set(key.toLowerCase(), {
        lat,
        lng: lon,
        city,
        state,
        country,
        county,
      });
    });
    // Merge with localStorage cache
    const storedCoords = JSON.parse(
      localStorage.getItem("loaded-coordinates") || "[]"
    );
    storedCoords.forEach(({ lat, lon, city, state, country, county }) => {
      const key = city
        ? `${city}, ${state || ""}, ${country || ""}`
            .trim()
            .replace(/, ,/g, ",")
        : `${county}, ${state}`;
      coordinateCache.set(key.toLowerCase(), {
        lat,
        lng: lon,
        city,
        state,
        country,
        county,
      });
    });
  } catch (error) {
    console.error("Failed to load coordinate cache:", error);
  }
}

// Save new coordinates to localStorage
function saveToCoordinateCache(key, coords) {
  try {
    let storedCoords = JSON.parse(
      localStorage.getItem("loaded-coordinates") || "[]"
    );
    storedCoords.push({
      lat: coords.lat,
      lon: coords.lng,
      city: coords.city,
      state: coords.state,
      country: coords.country,
      county: coords.county,
    });
    localStorage.setItem("loaded-coordinates", JSON.stringify(storedCoords));
    coordinateCache.set(key.toLowerCase(), coords); // Update in-memory cache
  } catch (e) {
    console.warn("localStorage quota exceeded:", e);
  }
}

async function geocodeLocation(query, sighting) {
  // Check cache first
  const cached = coordinateCache.get(query.toLowerCase());
  if (cached) {
    return cached;
  }

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
      const coords = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        city: sighting.city || undefined,
        state: sighting.state || undefined,
        country: sighting.country || undefined,
        county: sighting.county || undefined,
      };
      saveToCoordinateCache(query, coords); // Save to localStorage
      return coords;
    }
  } catch (error) {
    console.error("Geocode failed:", error);
  }
  return null;
}

function addToUnmappedList(sighting) {
  const li = document.createElement("li");
  li.innerHTML = `<b>${sighting.summary || "No description"}</b><br>
    <i>${sighting.location || "Unknown"}</i><br>
    <small>Event Date: ${sighting.date || "Unknown"}</small><br>
    <small>Event Source: <a href="${sighting.sourceLink}" target="_blank">${
    sighting.source
  }</a></small>`;
  unmappedUL.appendChild(li);
}

// Optimize countyData lookup
const countyDataMap = new Map();
countyData.forEach(({ State, County, Latitude, Longitude }) => {
  countyDataMap.set(`${State.toLowerCase()}_${County.toLowerCase()}`, {
    lat: Latitude,
    lng: Longitude,
  });
});

//=============================================
// Load and Display Sightings
//=============================================
async function loadSightings() {
  showLoading();
  try {
    // Initialize coordinate cache
    await initCoordinateCache();

    // Load both JSON files
    const [ufoResponse, bfroResponse] = await Promise.all([
      fetch("./ufo-update-m.json"),
      fetch("./bfro-update-m.json"),
    ]);

    if (!ufoResponse.ok) {
      throw new Error(`Failed to fetch UFO JSON: ${ufoResponse.statusText}`);
    }
    if (!bfroResponse.ok) {
      throw new Error(`Failed to fetch BFRO JSON: ${bfroResponse.statusText}`);
    }

    const ufoSightings = await ufoResponse.json();
    const bfroSightings = await bfroResponse.json();

    // Process UFO sightings
    const ufoData = ufoSightings.map((sighting) => ({
      summary: sighting.Summary || "No description",
      location: `${sighting.City || ""}${
        sighting.City && sighting.State ? ", " : ""
      }${sighting.State || sighting.Country || "Unknown"}`,
      date: sighting.Occurred || "Unknown",
      source: sighting.source || "NUFORC",
      sourceLink: "https://nuforc.org/",
      type: "ufo",
      city: sighting.City?.trim(),
      state: sighting.State?.trim(),
      country: sighting.Country?.trim(),
    }));

    // Process BFRO sightings
    const bfroData = bfroSightings.map((sighting) => ({
      summary: sighting.summary || "No description",
      location: `${sighting.county || ""}${
        sighting.county && sighting.state ? ", " : ""
      }${sighting.state || "Unknown"}`,
      date: sighting.date || "Unknown",
      source: "BFRO",
      sourceLink: "https://www.bfro.net/",
      type: "bfro",
      state: sighting.state?.trim(),
      county: sighting.county?.trim(),
    }));

    // Combine all sightings
    const allSightings = [...ufoData, ...bfroData];

    for (let i = 0; i < allSightings.length; i++) {
      const sighting = allSightings[i];
      let coords = null;

      // Get coordinates based on sighting type
      if (sighting.type === "ufo") {
        // Geocode UFO sightings
        let normalizedLocation = sighting.country;
        if (sighting.state && sighting.country) {
          normalizedLocation = `${sighting.state}, ${sighting.country}`;
        } else if (sighting.country) {
          normalizedLocation =
            countryCodeMap[sighting.country] || sighting.country;
        }
        let locationQuery = "";
        if (sighting.city && sighting.city !== "0" && normalizedLocation) {
          locationQuery = `${sighting.city}, ${normalizedLocation}`;
        } else if (normalizedLocation) {
          locationQuery = normalizedLocation;
        }
        if (locationQuery) {
          coords = await geocodeLocation(locationQuery, sighting);
          if (coords && !coordinateCache.has(locationQuery.toLowerCase())) {
            await sleep(1500); // Rate limit only for new geocoding
          }
        }
      } else if (sighting.type === "bfro") {
        // Look up coordinates in countyDataMap for BFRO
        const key = `${sighting.state?.toLowerCase()}_${sighting.county?.toLowerCase()}`;
        coords = countyDataMap.get(key);
        if (!coords) {
          // Fallback to geocoding with cache
          let locationQuery = "";
          if (sighting.county && sighting.state) {
            locationQuery = `${sighting.county}, ${sighting.state}`;
          } else if (sighting.state) {
            locationQuery = sighting.state;
          }
          if (locationQuery) {
            coords = await geocodeLocation(locationQuery, sighting);
            if (coords && !coordinateCache.has(locationQuery.toLowerCase())) {
              await sleep(1500); // Rate limit only for new geocoding
            }
          }
        }
      }

      if (!coords) {
        addToUnmappedList(sighting);
        continue;
      }

      const popupContent = `
        <b>${sighting.summary}</b><br>
        <i>${sighting.location}</i><br>
        <small>Event Date: ${sighting.date}</small><br>
        <small>Event Source: <a href="${sighting.sourceLink}" target="_blank">${sighting.source}</a></small>
      `;

      // Use different icons for UFO and BFRO
      const icon =
        sighting.type === "ufo"
          ? L.icon({
              iconUrl: "./ufo-icon.png",
              iconSize: [38, 38],
            })
          : L.icon({
              iconUrl: "./bfro-icon.png",
              iconSize: [38, 38],
            });

      // Add marker to cluster group
      markerGroup.addLayer(
        L.marker([coords.lat, coords.lng], { icon }).bindPopup(popupContent)
      );
    }

    // Add cluster group to map
    map.addLayer(markerGroup);
  } catch (err) {
    console.error("Failed to load or process sightings:", err);
  } finally {
    hideLoading();
  }
}

// Start loading
showLoading();
loadSightings();
