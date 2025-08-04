import { promises as fs } from "fs"; // Import fs.promises for async file operations
import { dirname } from "path";
import { fileURLToPath } from "url";
import path from "path"; // Path module for file operations

// Get __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse original format: "July 2025; North Carolina, Macon County (Class A) - ..."
function parseSasquatchReports(text) {
  if (!text || typeof text !== "string") {
    return []; // Return empty array if input is invalid
  }

  const lines = text
    .trim()
    .split("\n")
    .filter((line) => line.trim()); // Skip empty or whitespace-only lines

  if (lines.length === 0) {
    return [];
  }

  return lines
    .map((line, index) => {
      if (
        !line.includes("; ") ||
        !line.includes(", ") ||
        !line.includes(" - ")
      ) {
        console.warn(
          `Skipping malformed line ${index + 1} in old format: "${line}"`
        );
        return null;
      }

      const [datePart, locationAndSummary] = line
        .split("; ")
        .map((str) => str.trim());
      const [locationPart, summary] = locationAndSummary
        .split(" - ")
        .map((str) => str.trim());

      if (!locationPart || !locationPart.includes(", ")) {
        console.warn(
          `Skipping line ${
            index + 1
          } with invalid location format in old format: "${line}"`
        );
        return null;
      }

      let date;
      try {
        if (datePart.includes(" ")) {
          date = new Date(datePart).toISOString().split("T")[0];
        } else {
          date = `${datePart}-01-01`;
        }
      } catch (error) {
        console.warn(
          `Skipping line ${
            index + 1
          } with invalid date format in old format: "${datePart}"`
        );
        return null;
      }

      const [state, countyPart] = locationPart
        .split(", ")
        .map((str) => str.trim());
      const county = countyPart.replace(/ \(Class [A-C]\)/, "");

      return { date, state, county, summary };
    })
    .filter((item) => item !== null);
}

// Parse new format: "Alpine County, California\n...\nReports:\nSeptember 2012 (Class A) - ..."
function parseSasquatchReportsNewFormat(text) {
  if (!text || typeof text !== "string") {
    return []; // Return empty array if input is invalid
  }

  const lines = text
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line); // Remove empty lines

  if (lines.length === 0) {
    return [];
  }

  // Extract state and county from the first line
  const firstLine = lines[0];
  if (!firstLine.includes(", ")) {
    console.warn(`Invalid header format in new format: "${firstLine}"`);
    return [];
  }
  const [county, state] = firstLine.split(", ").map((str) => str.trim());

  // Find the start of reports (after "Reports:" line)
  const reportsIndex = lines.findIndex((line) => line.startsWith("Reports:"));
  if (reportsIndex === -1) {
    console.warn("No 'Reports:' section found in new format input");
    return [];
  }

  // Process report lines (after "Reports:")
  const reportLines = lines
    .slice(reportsIndex + 1)
    .filter((line) => line.trim());

  return reportLines
    .map((line, index) => {
      // Match date and summary, e.g., "September 2012 (Class A) - Deer hunter..."
      const match = line.match(
        /^([A-Za-z]+ \d{4}|\d{4})( \(Class [A-C]\) - .+)/
      );
      if (!match) {
        console.warn(
          `Skipping malformed report line ${index + 1} in new format: "${line}"`
        );
        return null;
      }

      const [_, datePart, summary] = match;
      let date;
      try {
        if (datePart.includes(" ")) {
          date = new Date(datePart).toISOString().split("T")[0];
        } else {
          date = `${datePart}-01-01`;
        }
      } catch (error) {
        console.warn(
          `Skipping line ${
            index + 1
          } with invalid date format in new format: "${datePart}"`
        );
        return null;
      }

      return { date, state, county, summary };
    })
    .filter((item) => item !== null);
}

async function saveReports(
  textOldFormat = "",
  textNewFormat = "",
  options = {
    uniqueKeyFields: ["date", "state", "county", "summary"], // Fields to check for duplicates
  }
) {
  try {
    // Parse both input formats
    const oldFormatReports = parseSasquatchReports(textOldFormat);
    const newFormatReports = parseSasquatchReportsNewFormat(textNewFormat);

    // Combine reports
    const reports = [...oldFormatReports, ...newFormatReports];

    if (reports.length === 0) {
      throw new Error("No valid reports parsed from either input");
    }

    // Generate filename for current report (MM-DD-YYYY-bfro.json)
    const currentDate = new Date();
    const formattedDate = `${String(currentDate.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(currentDate.getDate()).padStart(
      2,
      "0"
    )}-${currentDate.getFullYear()}`;
    const currentFileName = `${formattedDate}-bfro.json`;
    const currentFilePath = path.join(__dirname, currentFileName);

    // Save current report to MM-DD-YYYY-bfro.json
    await fs.writeFile(currentFilePath, JSON.stringify(reports, null, 2));
    console.log(`Saved ${reports.length} reports to ${currentFileName}`);

    // Path to master JSON file
    const masterFilePath = path.join(__dirname, "bfro-update-m.json");

    // Read or initialize master JSON
    let masterData = [];
    try {
      const masterContent = await fs.readFile(masterFilePath, "utf8");
      masterData = JSON.parse(masterContent);
      if (!Array.isArray(masterData)) {
        console.warn(
          "Master file is not an array, initializing as empty array."
        );
        masterData = [];
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        console.log("Master file does not exist, creating new one.");
      } else {
        throw error;
      }
    }

    // Check for duplicates based on uniqueKeyFields
    const uniqueKeyFields = options.uniqueKeyFields;
    const existingKeys = new Set(
      masterData.map((item) =>
        uniqueKeyFields.map((field) => item[field] || "").join("|")
      )
    );
    const newRecords = reports.filter(
      (item) =>
        !existingKeys.has(
          uniqueKeyFields.map((field) => item[field] || "").join("|")
        )
    );

    if (newRecords.length < reports.length) {
      console.log(
        `${
          reports.length - newRecords.length
        } duplicate records skipped in master file.`
      );
    }

    // Append new reports to master data
    masterData.push(...newRecords);

    // Sort masterData by date in descending order (newest first)
    masterData.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Save updated master JSON
    await fs.writeFile(masterFilePath, JSON.stringify(masterData, null, 2));
    console.log(`Appended ${newRecords.length} reports to bfro-update-m.json`);

    return reports; // Optional: return reports for further use
  } catch (error) {
    console.error("Error saving reports:", error);
    throw error;
  }
}

// Example usage
const sampleTextOldFormat = ``;

const sampleTextNewFormat = `
Washington County, Florida

Show:  
Class A, B, & C Reports
  

Reports:
August 2004 (Class A) - Man has nighttime sighting in his yard
October 2003 (Class B) - Possible daytime highway crossing on US-90 outside Caryville
February 2003 (Class A) - Road crossing sighting by motorist
`;

saveReports(sampleTextOldFormat, sampleTextNewFormat)
  .then(() => console.log("Processing complete"))
  .catch((err) => console.error("Failed to process reports:", err));
