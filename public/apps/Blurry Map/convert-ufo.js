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

Link	Occurred	City	State	Country	Shape	Summary	Reported	Media	Explanation
Open	07/03/2025 00:45	Gig Harbor	WA	USA	Orb	A round light just appeared.	07/03/2025		Satellite
Open .	07/02/2025 23:47	Seoul	CT	South Korea	Triangle	Glowing white triangle that got smaller and disappeared	07/03/2025	Y	
Open .	07/02/2025 23:40	Stanfield	NC	USA	Orb	A bright light in the sky, bigger than the moon, in the west above our pasture. Smaller lights moving around it.	07/12/2025		
Open .	07/02/2025 23:00	Headland	AL	USA	Orb	We saw an extremely bright blue orb blinking moving incredibly fast and about 40 ft off the ground	07/04/2025		
Open	07/02/2025 22:30	Tallahassee	FL	USA	Cigar	Bright white light tinged with green cigarette shaped object moving very fast crossed over I-10 from south to north 1/4 way up horizon	07/02/2025		
Open	07/02/2025 22:15	Eskdale	Hawke's Bay Region	New Zealand	Circle	Cluster of red flashing lights high up in sky.	07/02/2025	Y	
Open .	07/02/2025 21:51	Richland	WA	USA	Disk	5 or 6 disk shaped craft flew over the Handford, nuclear site in Richland, WA for around 7 minutes	07/02/2025	Y	
Open !	07/02/2025 19:45	Ashoknagar Kalyangarh	West Bengal	India	Disk	Red flash lit up clouds; rotating glowing UFO hovered, teleported & vanished near Ashokenagar Boys' School, India.	07/09/2025		
Open	07/02/2025 17:30	Nottingham	NH	USA	Light	Distant light as bright about as bright as the sun with a small trail that seemed to have cut through a very large cloud above it	07/16/2025	Y	
Open	07/02/2025 08:36	Leamington	ON	Canada	Cylinder	Approx 15,000 ft in the air and maybe 20-30 km away over Lake Erie	07/08/2025		Aircraft?
Open	07/02/2025 04:39	Aberdeen	SD	USA	Rectangle	I witnessed a large rectangular shaped craft, with extremely bright white lights flying over My residence in Aberdeen, South Dakot	07/02/2025	Y	
Open	07/02/2025 04:10	Portland	OR	USA	Rectangle	Unfamiliar object was easy to see, whitish rectangular, silently moving across sky, took video.	07/02/2025	Y	Starlink
Open	07/02/2025 04:09	Drain	OR	USA	Light	A very long what appeared like a big Light Bar in the sky	07/03/2025		
Open	07/02/2025 03:37	Aurora	CO	USA	Rectangle	Was leaving my house for work and I looked up at the clear sky and noticed this rectangular slow moving silver line in the sky	07/02/2025	Y	Starlink
Open	07/02/2025 02:08	Swindon	England	United Kingdom	Light	2 round lights hovering above my flat im on 5 th floor it was 100ft above 500 ft away then tuned 180 degrees an slowly moved off	07/02/2025		
Open	07/01/2025 23:15	St. George	SC	USA	Changing	Extremely bright craft above the tree line hovering in place	07/02/2025	Y	
Open	07/01/2025 23:00	Elgin	IA	USA	Rectangle	Large bright rectangular object	07/18/2025	Y	
Open	07/01/2025 22:15	Bowmanville	ON	Canada	Cylinder	Superspeed cylinder shot on slowmo video	07/01/2025	Y	
Open	07/01/2025 22:02	Shelburne	ON	Canada	Orb	It was green and blinking and like teleported and showed up across the sky	07/04/2025	Y	Drone?
Open !	07/01/2025 21:05	Ocala	FL	USA	Triangle	Saw silent, low-flying triangular craft with bright circular lights; hovered above trees, vanished.	07/02/2025	Y	
Open	07/01/2025 21:03	St. Petersburg	FL	USA	Unknown	VERY bright light in sky traveling NW faded “on” for 7 seconds then faded “off”.	07/01/2025		Satellite?
Open	07/01/2025 20:40	Butwal	Rupandehi District	Nepal	Circle	The event does not match any known aircraft, satellite, or meteor behavior. Due to the number of moving lights, the scattered pattern,	07/01/2025		
Open .	07/01/2025 20:30	Tabuk	Tabuk Province	Saudi Arabia	Changing	Strange pinkish oval cloudlike formation	07/01/2025	Y	Rocket?
Open	07/01/2025 20:25	Brothers	OR	USA	Cigar	I saw a bright white object flying evenly across the horizon.	07/02/2025	Y	Aircraft
Open	07/01/2025 12:32	Worcester	MA	USA	Unknown	Look like a very shiny plane at first but was hovering low over city of Worcester	07/01/2025		
Open	07/01/2025 02:10	Sant Antoni de Portmany	Illes Balears	Spain	Triangle	Upside down 3D triangle, lights outlining shape, travelled across our horizon, flight radar was blank,	06/30/2025	Y	
Open	07/01/2025 02:00	Glasgow	Scotland	United Kingdom	Light	Pale yellow light, made a loop down and shot straight up	07/01/2025		
Open	07/01/2025 01:20	Praha	Prague	Czech Republic	Unknown	Drone lights (green, red and white lights) no sound	06/30/2025		Drone?
Open	07/01/2025 00:31	Goworowo	Masovian Voivodeship	Poland	Triangle	An equilateral triangle consisting of three white dots.	07/01/2025
`;

// Call the function with custom options
convertTextToJson(rawText, {
  outputFileName: `ufo-update-${dayOfMonth}-${monthNumber}-${fullYear}.json`,
  masterFileName: `ufo-update-m.json`, // Changed to masterFileName
  delimiter: "\t",
  arrayFields: ["Attachments", "Media"],
  uniqueKeyFields: ["Occurred", "City"], // Fields to identify duplicates
});
