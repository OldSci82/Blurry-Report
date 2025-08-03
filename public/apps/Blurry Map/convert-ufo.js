import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Derive __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate default output filename based on current date
const currentDate = new Date();
const dayOfMonth = currentDate.getDate();
const monthNumber = currentDate.getMonth() + 1;
const fullYear = currentDate.getFullYear();

function convertTextToJson(
  rawText,
  options = {
    outputFileName: `ufo-update-${dayOfMonth}-${monthNumber}-${fullYear}.json`,
    masterFileName: `ufo-update-m.json`, // Changed from monthlyFileName to masterFileName
    delimiter: "\t",
    arrayFields: ["Attachments"],
    uniqueKeyFields: ["Occurred", "City"], // Fields to check for duplicates in master file
  }
) {
  try {
    // Validate input
    if (!rawText || typeof rawText !== "string") {
      throw new Error("Input text must be a non-empty string");
    }

    // Resolve output file paths
    const dailyOutputFilePath = path.join(__dirname, options.outputFileName);
    const masterOutputFilePath = path.join(__dirname, options.masterFileName);

    // Split text into lines and trim whitespace
    const lines = rawText
      .trim()
      .split("\n")
      .filter((line) => line.trim());

    if (lines.length < 1) {
      throw new Error("Input text must contain at least a header row");
    }

    // Extract and sanitize headers
    const headers = lines[0]
      .split(options.delimiter)
      .map((header) => header.trim().replace(/[^a-zA-Z0-9]/g, "_")); // Sanitize header names

    if (headers.length === 0) {
      throw new Error("No valid headers found in input text");
    }

    // Initialize result array
    const result = [];

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i]
        .split(options.delimiter)
        .map((value) => value.trim());

      // Pad with null if row has fewer values than headers
      while (values.length < headers.length) {
        values.push(null);
      }

      // Create row object
      const rowObject = {};
      headers.forEach((header, index) => {
        const value = values[index] || null; // Already null from padding
        rowObject[header] = options.arrayFields.includes(header)
          ? value
            ? value
                .split("\n")
                .map((item) => item.trim())
                .filter((item) => item)
            : []
          : value;
      });

      result.push(rowObject);
    }

    // Validate result
    if (result.length === 0) {
      throw new Error("No valid data rows processed");
    }

    // Write to daily JSON file
    const jsonString = JSON.stringify(result, null, 2);
    if (fs.existsSync(dailyOutputFilePath)) {
      console.warn(
        `File ${dailyOutputFilePath} already exists and will be overwritten.`
      );
    }
    fs.writeFileSync(dailyOutputFilePath, jsonString);
    console.log(
      `Daily JSON file successfully created at ${dailyOutputFilePath}`
    );

    // Append to master JSON file
    let masterData = [];
    if (fs.existsSync(masterOutputFilePath)) {
      try {
        const existingContent = fs.readFileSync(masterOutputFilePath, "utf8");
        masterData = JSON.parse(existingContent);
        if (!Array.isArray(masterData)) {
          console.warn(
            `Existing file ${masterOutputFilePath} is not a valid JSON array. Overwriting with new data.`
          );
          masterData = [];
        }
      } catch (error) {
        console.warn(
          `Error reading or parsing ${masterOutputFilePath}: ${error.message}. Creating new file.`
        );
        masterData = [];
      }
    }

    // Check for duplicates based on uniqueKeyFields
    const uniqueKeyFields = options.uniqueKeyFields || [];
    if (uniqueKeyFields.length > 0) {
      const existingKeys = new Set(
        masterData.map((item) =>
          uniqueKeyFields.map((field) => item[field] || "").join("|")
        )
      );
      const newRecords = result.filter(
        (item) =>
          !existingKeys.has(
            uniqueKeyFields.map((field) => item[field] || "").join("|")
          )
      );
      if (newRecords.length < result.length) {
        console.log(
          `${
            result.length - newRecords.length
          } duplicate records skipped in master file.`
        );
      }
      masterData.push(...newRecords);
    } else {
      // No unique key fields specified, append all records
      masterData.push(...result);
    }

    // Write to master JSON file
    const masterJsonString = JSON.stringify(masterData, null, 2);
    fs.writeFileSync(masterOutputFilePath, masterJsonString);
    console.log(
      `Master JSON file successfully updated at ${masterOutputFilePath}`
    );

    return jsonString;
  } catch (error) {
    console.error("Error converting text to JSON:", error.message);
    throw error;
  }
}

// Example usage
const rawText = `

`;

// Call the function with custom options
convertTextToJson(rawText, {
  outputFileName: `ufo-update-${dayOfMonth}-${monthNumber}-${fullYear}.json`,
  masterFileName: `ufo-update-m.json`, // Changed to masterFileName
  delimiter: "\t",
  arrayFields: ["Attachments", "Media"],
  uniqueKeyFields: ["Occurred", "City"], // Fields to identify duplicates
});
