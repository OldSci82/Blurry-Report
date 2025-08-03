import { promises as fs } from "fs"; // Import fs.promises for async file operations
import { dirname } from "path";
import { fileURLToPath } from "url";
import path from "path"; // Path module for file operations

async function appendCoordinates(
  inputFile = "./coordinate.txt",
  outputFile = "./loaded-coordinates.json"
) {
  try {
    // Read the input file
    const rawData = await fs.readFile(inputFile, "utf8");
    const lines = rawData
      .split("\n")
      .map((line) => line.replace(/^VM\d+:\d+\s*/, "").trim()) // Remove VM prefix (e.g., VM5248:1)
      .filter((line) => line); // Remove empty lines

    // Read the existing JSON file (if it exists)
    let existingData = [];
    try {
      const existingContent = await fs.readFile(outputFile, "utf8");
      existingData = JSON.parse(existingContent);
      if (!Array.isArray(existingData)) {
        console.log(
          "Existing JSON is not an array, starting with empty array."
        );
        existingData = [];
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        console.log(
          `No existing ${outputFile} found, starting with empty array.`
        );
      } else {
        console.error(
          `Error reading or parsing ${outputFile}: ${error.message}`
        );
        existingData = [];
      }
    }

    // Set to store unique coordinates
    const uniqueCoords = new Map();

    // Add existing coordinates to the Map to check for duplicates
    existingData.forEach((coord) => {
      const coordKey = `${coord.lat},${coord.lon}`;
      uniqueCoords.set(coordKey, coord);
    });

    // Process new coordinates
    let processedCount = 0;
    for (const line of lines) {
      try {
        // Split the line on the first occurrence of a JSON-like string
        const match = line.match(/^coord_[^\{]+(\{.*\})$/);
        if (!match || !match[1]) {
          console.log(`Warning: Could not extract JSON from line: ${line}`);
          continue;
        }

        const jsonPart = match[1].trim();
        if (!jsonPart.startsWith("{") || !jsonPart.endsWith("}")) {
          console.log(`Warning: Invalid JSON format in line: ${line}`);
          continue;
        }

        // Parse the JSON part
        const parsed = JSON.parse(jsonPart);

        // Verify required fields (lat and lng are mandatory)
        if (parsed.lat == null || parsed.lng == null) {
          console.log(
            `Warning: Missing required fields (lat or lng) in line: ${line}`
          );
          continue;
        }

        // Use county as country if country is missing
        const countryValue = parsed.country || parsed.county || "";

        // Create a unique key based on lat and lng
        const coordKey = `${parsed.lat},${parsed.lng}`;

        // Only add if we haven't seen these coordinates before
        if (!uniqueCoords.has(coordKey)) {
          uniqueCoords.set(coordKey, {
            lat: parsed.lat,
            lon: parsed.lng, // Using 'lon' as specified
            city: parsed.city || "",
            state: parsed.state || "",
            country: countryValue,
          });
          processedCount++;
        }
      } catch (error) {
        console.log(`Error processing line: ${line}. Error: ${error.message}`);
        continue;
      }
    }

    // Convert to array for JSON output
    const outputData = Array.from(uniqueCoords.values());

    // Write to JSON file
    await fs.writeFile(outputFile, JSON.stringify(outputData, null, 2), {
      encoding: "utf8",
    });
    console.log(
      `Successfully processed ${processedCount} new coordinates, total ${outputData.length} unique coordinates written to ${outputFile}`
    );
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log(`Input file ${inputFile} not found`);
    } else {
      console.error(`An error occurred: ${error.message}`);
    }
  }
}

// Run the script
appendCoordinates();
