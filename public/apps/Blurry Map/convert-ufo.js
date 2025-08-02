import fs from "fs"; // For Node.js file operations
import path from "path"; // For handling file paths
import { fileURLToPath } from "url"; // To derive __dirname equivalent

// Derive __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function convertTextToJson(rawText, outputFileName = "ufo-update.json") {
  try {
    // Resolve path to project root
    const outputFilePath = path.join(__dirname, outputFileName);

    // Split the text into lines
    const lines = rawText.trim().split("\n");

    // Extract headers from the first line
    const headers = lines[0].split("\t").map((header) => header.trim());

    // Initialize the result array
    const result = [];

    // Process each data row (skip header)
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split("\t").map((value) => value.trim());

      // Create an object for the current row
      const rowObject = {};

      // Map headers to values
      headers.forEach((header, index) => {
        if (header === "Attachments") {
          rowObject[header] = values[index]
            ? values[index]
                .split("\n")
                .map((item) => item.trim())
                .filter((item) => item)
            : [];
        } else {
          rowObject[header] = values[index] || "";
        }
      });

      result.push(rowObject);
    }

    // Convert to JSON string
    const jsonString = JSON.stringify(result, null, 2);

    // Write to file
    fs.writeFileSync(outputFilePath, jsonString);

    console.log(`JSON file successfully created at ${outputFilePath}`);
    return jsonString;
  } catch (error) {
    console.error("Error converting text to JSON:", error.message);
    throw error;
  }
}

// Example usage
const rawText = `Case Number\tDate Submitted\tDate of Event\tShort Description\tCity\tState/Country\tAttachments
143446\t2025-08-02\t1975-07-15\tLight caught my attn our window. Went outside with binocs, white center with colored side lights. Then Second came from S and joined first.\tBirdsall\tNY, US\t
143445\t2025-08-02\t\tDuplicate case\t0\tCO, US\t
143444\t2025-08-02\t2024-12-28\tOrbs\tDelta\tCO, US\t
143443\t2025-08-02\t2025-08-03\tCar, cigi, noticed unusual cloud movements, lights, shape, morphing abilities, a battle ensued, mind boggling videos. Etc\tNewcastle\tAU\t
143442\t2025-08-02\t2023-07-22\tI woke up on my sofa to a light stationary shining in my direction, flashing different colours, moving when I asked it to. Leaving when I went to film\tK�benhavn\tDK\t
143441\t2025-08-02\t2025-08-02\tlooks like a not closed Donut or an Horseshoe\tQuarteira\tPT\t6B5E031B1864483A85CE4B5C26165F62.heic\n069EAB3F8B9641E382220ED85029240745005c.jpeg
143440\t2025-08-01\t2025-07-30\tFaint purple glowing traditional spherical slightly diamond shaped aircraft\tFairfield\tPA, US\t
143439\t2025-08-01\t2022-07-18\tFollow up from my recent post about Crystal mountain same day. Took iPhone video of surrounding mountains. Recently notice shape shifting\tSeattle\tWA, US\tIMG0675.mov\nIMG3912.png\nIMG3911.png\nIMG3915.png\nIMG3919.png\nIMG3898.png\nIMG3905.png\nIMG3903.png\nIMG3902.png\nIMG3907.png
143438\t2025-08-01\t2022-07-18\tFlying object that changed shape\tSeattle\tWA, US\tIMG0680.mov\nIMG3890.png\nIMG3874.png\nIMG3867.png\nIMG3873.jpeg\nIMG3872.png\nIMG3887.png\nIMG3880.png\nIMG3881.png\nIMG3874.png
143437\t2025-08-01\t2022-05-14\tIn backyard cleaning pool with my adult son...looked up and watched it pass overhead.\tAlbany\tOH, US\t
143436\t2025-08-01\t2019-09-04\tCicatrices sur le corps\tRomilly-Sur-Seine\tFR\t
143435\t2025-08-01\t2019-06-25\tBright light red tail gas like disappeared and reappeared closer to the ground\tFort Lauderdale\tFL, US\tIMG4157.mov
143434\t2025-08-01\t2024-12-11\tBlack, hard sharp angles red cylinder recessed red lights\tHana\tHI, US\tIMG4462.png\nIMG4460.png\nIMG4281.jpeg\nIMG4518.jpeg\nIMG4226.mov
143433\t2025-08-01\t2025-07-27\tBright yellow light hovering then darting up down left rapid speed finally a large explosion like flash of light as it or something from it hit ocean\tHobart\tAU\t
143432\t2025-08-01\t2025-07-31\tSkeptic son saw a gray watching him on our tree farm\tPollock Pines\tCA, US\t
143431\t2025-07-31\t2025-07-30\tObserved over trees strobing light with movement\t281 Estates Colonia\tTX, US\tIMG5301.jpeg\nIMG5308.mov
143430\t2025-07-31\t2025-04-24\tLight gliding in the night.\tTempe\tAZ, US\tIMG2509.mov
143429\t2025-07-31\t2025-07-31\tnumerous UFO/UAP blend every night like stars\tDeland\tFL, US\t
143428\t2025-07-31\t2024-08-08\tOrb or something caught on camera\t0\tNC, US\t
143427\t2025-07-31\t1968-08-30\tPlease refer to Case 70084, already recorded (in 2015).\tCarroll\tNH, US\t`;

// Save to project root as 'output.json'
convertTextToJson(rawText, "ufo-update.json");
