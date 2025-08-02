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
Open	07/31/2025 05:07	Sidi Kacem	Rabat-Salé-Kénitra	Morocco	Flash	Bright, yellow/beige light. Initially still, then extreme random speed/direction. Flashed randomly. Silent. Unprecedented sighting.	07/30/2025	Y	
Open	07/31/2025 00:15	Golconda	IL	USA	Light	While looking out window at Big Dipper, saw multiple lights moving in erratic fashion and dimming out. One white light exploded nearby	07/31/2025	Y	
Open .	07/31/2025 00:05	Bowling Green	KY	USA	Orb	A light intensified and zipped away	07/31/2025		
Open	07/30/2025 22:30		İzmir	Türkiye	Light	A very bright, flashing, shapeless object was seen by multiple witnesses in the night sky. Moved much faster than a plane, changed dir	07/30/2025		
Open	07/30/2025 22:26	Warszawa	Województwo mazowieckie	Poland	Sphere	The spherical object flew at a constant speed in a straight line, then suddenly accelerated and disappeared.	07/31/2025		
Open	07/30/2025 22:10	Chipstead	England	United Kingdom	Oval	The object slowly came into sight. From a thin line into a bright slight stationary. Then slowly disappeared into the distance.	07/30/2025	Y	
Open	07/30/2025 21:09	São Paulo	State of São Paulo	Brazil	Light	I saw a light blinking continuously in the sky. The sky was clear, and it was blinking just above the moon.	07/30/2025		
Open	07/30/2025 18:43	Anolaima	Cundinamarca	Colombia	Circle	UFO with white, blue, red, and green lights moved at high speed, hid behind a mountain, and descended vertically into a forest.	07/30/2025	Y	
Open .	07/30/2025 18:12	Capalaba	Queensland	Australia	Light	Orb hovering over our area then turns to three objects doing formations.	07/30/2025	Y	
Open .	07/30/2025 14:30	Dubrovnik	Dubrovnik-Neretva County	Croatia	Circle	Lightning fast travel and unexpected change of direction following a passenger aircraft.	07/30/2025		
Open .	07/30/2025 05:40	Wynnum	Queensland	Australia	Egg	There were 4 egg shaped flying objects, they were purple and had strobing lights.	07/30/2025		
Open	07/30/2025 05:20	Gainesville	FL	USA	Rectangle	Pulsating, illuminating oject traveling toward me then dissapears	07/30/2025		Meteor?
Open	07/30/2025 04:02	Pocatello	ID	USA	Light	Other smaller objects seemed to me following where it disappeared. Big booming sounds coming from up above. It’s not the first sighting	07/30/2025	Y	Rocket?
Open .	07/30/2025 02:11	Williston	FL	USA	Orb	A large bright orb, thought to be a shooting star but moved horizontally not vertically and moved so fast unlike anything I have seen!!	07/29/2025		
Open	07/30/2025 02:00	Lethbridge	AB	Canada	Cylinder	I saw a white shape hovering low outside. It lingered, then zoomed away fast when I got scared and went inside.	07/30/2025		
Open	07/29/2025 23:46	Avalon	NJ	USA	Cylinder	We saw something moving in the air kinda of fast and when you zoomed up on it with your phone it almost looked like the planet saturn	07/30/2025	Y	
Open	07/29/2025 21:45	Chennai	Tamil Nadu	India	Triangle	Blinking or signalling lights	07/29/2025		Laser?
Open	07/29/2025 21:30	Astoria	OR	USA	Orb	Across the river on the Washington side I saw an orb with a yellow hue. Traveling west horizontally the light faded, returned and disap	07/30/2025		
Open	07/29/2025 15:00	Canonsburg	PA	USA	Sphere	Sphere traveling with single aircraft.	07/29/2025		
Open	07/29/2025 11:40	Gates	NY	USA	Other	Triangle pattern lights.	07/29/2025		
Open	07/28/2025 23:30	Berwick	PA	USA	Circle	6 orbs in geese like formation heading southwest at a couple hundred miles at hour at least. shifting aggressively very organized	07/28/2025		
Open	07/28/2025 22:39	Lumberton	TX	USA	Unknown	I saw a bright orangey light in the sky that I thought was a planet for a few minutes.. until it came flying towards me.	07/28/2025	Y	Drone?
Open	07/28/2025 22:33	Newburgh	NY	USA	Light	Driving north on Thruway with my wife	07/28/2025		
Open .	07/28/2025 22:20	Brampton	ON	Canada	Light	Bright light appears, moves horiz extremely fast, disappears, reappears still fast. Then shot up, abruptly turns opp. Zipped away.	07/29/2025		
Open	07/28/2025 22:00	Brentwood	CA	USA	Unknown	Three parallel lights moving together then lost control burned up	07/29/2025		
Open	07/28/2025 20:39	Hampton Bays	NY	USA	Light	Looked like craft on fire, flying west. Then it stopped. Hovered. Changed to white light, with small flashing. Then ascended &flew NE.	07/28/2025	Y	
Open	07/28/2025 12:45	Weesp	North Holland	Netherlands	Other	Saw the craft at about 75 degrees facing west	07/28/2025	Y	Balloon?
Open	07/28/2025 04:19	Shoreline	WA	USA	Orb	Orb floating over roofline across street	07/28/2025	Y	
Open	07/28/2025 02:30	Mesa	AZ	USA	Light	Flashing light orb that moved in different patterns with multiple others appearing and disappearing.	07/28/2025	Y	
Open	07/27/2025 23:30	Dresden	TN	USA	Orb	They appear in the west, traveling north, w/o blinking but they will illuminate & disappear regularly, charging forward and back.	07/28/2025		
Open .	07/27/2025 22:22	Pajaro Dunes	CA	USA	Orb	I was on the beach at Pajaro Dunes Resort with 3 other witnesses that were family memebers.	07/27/2025		
Open .	07/27/2025 22:15	Doole	TX	USA	Flash	Flashing object moved in darkness	07/28/2025		
Open	07/27/2025 21:00	Shelby Township	MI	USA	Unknown	Bright object dimmed and disappeared.	07/27/2025		
Open	07/27/2025 19:35	Minneapolis	MN	USA	Changing	2 “bird-like” objects flying w/the grey saucer in chase	07/29/2025	Y	
Open	07/27/2025 04:50	Albuquerque	NM	USA	Orb	South Portion Of Sky / Space A Big Orb Exploded Like Firecracker In A Bright White Light Size Of A Coffee Bean For Size Then Faded Away	07/27/2025		
Open .	07/26/2025 23:40	Albany	GA	USA	Light	Lights would appear, pivot in a cross motion from eachother and then disappear. Moved in almost a dance motion. There was no light flar	07/28/2025	Y	
Open	07/26/2025 19:30	Andilana	Diana	Madagascar	Light	They start flying over the ocean quite high, then lower and lower	07/26/2025		
Open	07/26/2025 15:40	Stephenville	NL	Canada	Diamond	The object was moving in ways that a plane would not be able to it moved up and down and side to side loud humming sound	07/27/2025		
Open	07/26/2025 12:57	Milford	CT	USA	Other	Chrome Donut shaped object loitering after flyby of military aircraft	07/27/2025	Y	Balloon
Open	07/26/2025 11:00	Greenville	SC	USA	Triangle	Triangular object twisting while floating, and possibly pulsating.	07/26/2025	Y	Balloon?
Open .	07/26/2025 06:00	Hodgenville	KY	USA	Orb	Thought it was a star blinking then it started moving erratically but froze when I tried to record it.	07/26/2025		
Open	07/26/2025 05:00	Ellicott City	MD	USA	Teardrop	Driving down hwy, looked to right before I got off my exit and saw the phenomenon in the sky to my right	07/28/2025		
Open .	07/26/2025 04:00	Albion	ID	USA	Light	Big bright light, 10 times larger than any star. Then split into 6 big lights forming a perfect circle. Later a square and triangle	07/26/2025	Y	
Open	07/26/2025 02:30	Concrete	WA	USA	Other	satellite object flying in irregular patterns of distance bright in the sky	07/30/2025	Y	
Open	07/25/2025 23:30	Philadelphia	PA	USA	Light	Two White Lights Above Philadelphia	07/25/2025		Searchlight
Open	07/25/2025 23:27	Mesa	AZ	USA	Flash	Flashing orb moving erratically in the sky	07/29/2025	Y	
Open	07/25/2025 22:15	McGaheysville	VA	USA	Diamond	Fast moving orb or diamond shaped craft	07/25/2025	Y	Chinese Lantern?
Open	07/25/2025 22:00	Buena Vista	CO	USA	Orb	Bright and large glowing orb - off white or slightly yellowish - came into view from N/NW, viewed for 20-30 seconds	07/26/2025		
Open	07/25/2025 21:53	Lexington	KY	USA	Circle	Extremely bright round light went from small to larger then disappeared	07/25/2025		
Open	07/25/2025 21:52	Salem	MO	USA	Light	Strange light slowly creeping till I shot a photo took off like light speed	07/25/2025	Y	
Open	07/25/2025 20:55	West Jordan	UT	USA	Unknown	Two UAP flying horizontally across commercial airspace.	07/25/2025	Y	Balloons
Open .	07/25/2025 12:05	Saint-Michel	QC	Canada	Formation	Saw 8 blinking bright lights in an overcast sky at noon	07/26/2025	Y	
Open	07/25/2025 12:00		CO	USA	Teardrop	The object was seen flying left of the road I was on. It was small from a distance and flew left and slightly downward.	07/25/2025		Balloon?
Open	07/25/2025 11:00	Nathrop	CO	USA	Orb	My daughter and I both saw this orb, very high up, motionless. It did not drift or go up or down.	07/25/2025	Y	Balloon?
Open	07/25/2025 03:30	Burnaby	BC	Canada	Unknown	Black ufo slowly hovering 200 300 ft no lights and it disappeared blink of a eye	07/28/2025		
Open	07/25/2025 01:30		Thessaly	Greece	Light	Lights appear randomly and crossing the sky - disappearing after a few seconds	07/24/2025		
Open !	07/24/2025 23:15	Jonesborough	TN	USA	Cross	Bright light with blinking lights moved, hovered, then flew over me. Huge, silent, gray craft hovered, then vanished to the west.	07/25/2025	Y	
Open	07/24/2025 21:26	Wall Township	NJ	USA	Orb	2 UFOs, one orb type and one LED light looking type and something shot at it look like a laserbeam	07/26/2025	Y	Meteor?
Open	07/24/2025 21:20	Deering	NH	USA	Orb	One bright white orb like lightbulb wobly moving over trees before going towards ground	07/24/2025		
Open	07/24/2025 20:36	Tremont	IL	USA	Orb	Light pink changing to red orb in the sky over Illinois	07/25/2025		Chinese Lantern?
Open	07/24/2025 17:20	Khumaga	Kgaolo ya Legare	Botswana	Changing	pair of orbs orbiting each other moving around waterhole before dropping into ground, then cylinder/stacked orbs moving around the area	07/24/2025	Y	
Open	07/24/2025 16:35	Marcola	OR	USA	Other	Passenger airplane disappeared	07/25/2025		Aircraft
Open	07/24/2025 08:45	Battle Ground	WA	USA	Cigar	Shiny object spotted above the cloud cover moving strangely	07/24/2025		
Open	07/24/2025 01:30	Amherst	MA	USA	Star	Star sized object moving too fast to be satellite or aircraft traversed entire night sky	07/25/2025		Satellite?
Open .	07/23/2025 22:47	Březí	Jihomoravský kraj	Czechia	Rectangle	Fast moving, no sound	07/23/2025		
Open	07/23/2025 22:23		Afyonkarahisar	Türkiye	Other	Silent, steady-moving, nebulous in shape, with a round dark part in the middle, without the light source itself, but bright	07/24/2025		Rocket?
Open	07/23/2025 22:12	Kenmore	NY	USA	Orb	Silent, bright white orb hovered overhead for 30 secs, refracted light like a diamond, then drifted SE. No aircraft on radar.	07/24/2025	Y	
Open	07/23/2025 20:45	Elyria	OH	USA	Fireball	It was moving vertically from north to south, and disappeared within 2-3 seconds. It didn't appear again. There was now jet trail.	07/24/2025		Meteor
Open	07/23/2025 20:42	Anaheim	CA	USA	Light	Similar to a satellite but larger and faster	07/23/2025		
Open	07/23/2025 13:53	Ashford	WA	USA	Cylinder	Two unidentified aerial objects captured in photo, captured in photo appearing briefly, not heard or seen by naked eye.	07/25/2025	Y	Insect?
Open	07/23/2025 05:30	El Paso	TX	USA	Other	Home surveillance camera recorded a fast moving object at 0230 am.	07/23/2025	Y	
Open	07/23/2025 04:35	Plymouth	England	United Kingdom	Orb	Multiple orbs moving in smooth sequence under cloud cover. One changed direction perpendicularly and then all disappeared in cloud	07/22/2025		
Open	07/22/2025 23:01	Toronto	ON	Canada	Fireball	Flying Fireball in the Night Sky	07/23/2025	Y	
Open .	07/22/2025 22:54	Perrysburg	OH	USA	Light	It felt like they wanted me to see	07/23/2025		
Open	07/22/2025 20:52	Taunton	MA	USA	Orb	Thought it was a plane(no blinking lights), then a satellite(flight path changes) and then a drone(extremely high altitudes)	07/23/2025	Y	Drone?
Open	07/22/2025 19:59	Northglenn	CO	USA	Circle	A black object moving quickly across the sky opposite of the wind direction	07/23/2025	Y	
Open	07/22/2025 19:30	Fairfax	VA	USA	Cone	Silent, rigid, polygonal object steadily traveling at aircraft-like speeds	07/22/2025	Y	
Open	07/22/2025 19:00	Buffalo	NY	USA	Other	Saw two rotating reflective objects in the evening sky (still daylight) seemed to be in diagonal position to ea other.	07/24/2025	Y	Balloon
Open	07/22/2025 18:46	Buffalo	NY	USA	Cylinder	Tic Tac UFO sighted south of Galleria Mall	07/22/2025		
Open .	07/22/2025 11:17	Osmond	WY	USA	Oval	In daylight. Unusual sharp whooshing noise. Black, round/oval moving unimaginably fast with physically impossible turns and ups/downs.	07/22/2025		
Open	07/22/2025 04:00	Epping	NH	USA	Diamond	Two people observed a craft stationary and then slowly moved out of sight the second craft came up fast and disappeared	07/25/2025	Y	Planet/Star
Open	07/22/2025 01:03	Olsztyn	Województwo warmińsko-mazurskie	Poland	Star	Stationary star-like object suddenly accelerated and disappeared	07/22/2025		
Open	07/22/2025 00:25	North Salem	NY	USA	Chevron	High pitched sound, rhombus shaped object directly over our heads. The object itself was soundless	07/21/2025		Bat?
Open	07/21/2025 22:58	Birmingham	England	United Kingdom	Cube	Square reflecting object above passenger airline	07/21/2025		
Open	07/21/2025 22:15	Belvidere	IL	USA	Star	Star like object, orange in color, flying low	07/22/2025		
Open	07/21/2025 21:50	Springdale	AR	USA	Unknown	Seen just a head with black eyes the size of potatoes and the eyes weren't glowing from my back porch light	07/21/2025		Animal?
Open	07/21/2025 21:50	Alexander	AR	USA	Changing	Pulsating UFO, Zip Zagging, irregular motion	07/22/2025		
Open	07/21/2025 21:20	Alabaster	AL	USA	Orb	Looked like a star in the southern sky hovering. It moved off the east and stopped. Then rapidly moved south before vanishing	07/22/2025		
Open	07/21/2025 21:16	Cypress Gardens	FL	USA	Orb	Green and red orbs hovered, flashed, clashed in pink burst, formed patterns, then vanished after a metallic object crashed nearby.	07/25/2025	Y	Drone?
Open	07/21/2025 21:01	Palma	Illes Balears	Spain	Changing	Completely static oscillating object	07/21/2025	Y	
Open	07/21/2025 18:15	Bergen	NY	USA	Cylinder	At approximately 615pm I saw a strange object in the sky flying in an abnormal flight pattern	07/21/2025	Y	
Open .	07/21/2025 02:25	Philadelphia	PA	USA	Oval	Oval shaped saucer floating above house	07/21/2025		
Open	07/21/2025 02:00	Batala	Punjab	India	Unknown	I daily see sky it was cloudy i thought there is star but then i saw it move in unimaginable speed	07/22/2025	Y	Searchlight?
Open	07/20/2025 23:50	Rajasan	Bihar	India	Unknown	Silent, low-flying, cloud-like object seen at night in Bihar village, moving fast NE. Meteor sighted days before in same area.	07/22/2025		
Open	07/20/2025 23:40	Colorado Springs	CO	USA	Orb	Orange Orb high in the sky right of Blodgett Peak	07/22/2025		Chinese Lantern?
Open	07/20/2025 23:30	Clearwater	FL	USA	Light	Flying like a normal plane on approach to either St Pete or Tampa International Airport but an orange round object.	07/20/2025	Y	Chinese Lantern?
Open	07/20/2025 22:30	Niagara Falls	NY	USA	Circle	We saw a glowing object and filmed it. When we zoomed in it looked like a spacecraft	07/21/2025	Y	Aircraft?
Open	07/20/2025 22:30	Fort Green	FL	USA	Circle	Stay still , then move quickly to another direction.	07/21/2025		
Open .	07/20/2025 22:03	Bethlehem	PA	USA	Chevron	Asymmetrical chevron with distinct round red lights. hovered over mountain for 15 sec moving N to S slowly	07/25/2025	Y	
Open	07/20/2025 22:02	New Delhi	Delhi	India	Orb	It was too high, moved in Zig Zag motion and was blinking.	07/20/2025	Y
`;

// Call the function with custom options
convertTextToJson(rawText, {
  outputFileName: `ufo-update-${dayOfMonth}-${monthNumber}-${fullYear}.json`,
  masterFileName: `ufo-update-m.json`, // Changed to masterFileName
  delimiter: "\t",
  arrayFields: ["Attachments", "Media"],
  uniqueKeyFields: ["Occurred", "City"], // Fields to identify duplicates
});
