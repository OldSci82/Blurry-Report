import fs from 'fs';
import { parse } from 'csv-parse';

// FIPS state codes (first two digits of FIPS) to state names
// prettier-ignore
const fipsToState = {
  '01': 'Alabama',
  '02': 'Alaska',
  '04': 'Arizona',
  '05': 'Arkansas',
  '06': 'California',
  '08': 'Colorado',
  '09': 'Connecticut',
  '10': 'Delaware',
  '11': 'District of Columbia',
  '12': 'Florida',
  '13': 'Georgia',
  '15': 'Hawaii',
  '16': 'Idaho',
  '17': 'Illinois',
  '18': 'Indiana',
  '19': 'Iowa',
  '20': 'Kansas',
  '21': 'Kentucky',
  '22': 'Louisiana',
  '23': 'Maine',
  '24': 'Maryland',
  '25': 'Massachusetts',
  '26': 'Michigan',
  '27': 'Minnesota',
  '28': 'Mississippi',
  '29': 'Missouri',
  '30': 'Montana',
  '31': 'Nebraska',
  '32': 'Nevada',
  '33': 'New Hampshire',
  '34': 'New Jersey',
  '35': 'New Mexico',
  '36': 'New York',
  '37': 'North Carolina',
  '38': 'North Dakota',
  '39': 'Ohio',
  '40': 'Oklahoma',
  '41': 'Oregon',
  '42': 'Pennsylvania',
  '44': 'Rhode Island',
  '45': 'South Carolina',
  '46': 'South Dakota',
  '47': 'Tennessee',
  '48': 'Texas',
  '49': 'Utah',
  '50': 'Vermont',
  '51': 'Virginia',
  '53': 'Washington',
  '54': 'West Virginia',
  '55': 'Wisconsin',
  '56': 'Wyoming',
  '72': 'Puerto Rico'
};

function convertCsvToJson(inputCsvPath, outputJsonPath) {
  const results = [];

  // Read and parse the CSV file
  fs.createReadStream(inputCsvPath)
    .pipe(parse({ columns: true, trim: true }))
    .on('data', (row) => {
      // Ensure fips_code exists and is a string
      if (!row.fips_code) {
        console.warn(`Skipping row with missing fips_code: ${JSON.stringify(row)}`);
        return;
      }

      // Treat fips_code as a string and pad to 5 digits
      const fips = String(row.fips_code).padStart(5, '0');
      const stateFips = fips.substring(0, 2); // Get state portion
      const stateName = fipsToState[stateFips] || 'Unknown'; // Map to state name

      // Create new object with desired fields
      results.push({
        State: stateName,
        County: row.name,
        Longitude: parseFloat(row.lng),
        Latitude: parseFloat(row.lat)
      });
    })
    .on('end', () => {
      // Write the results to a JSON file
      fs.writeFile(outputJsonPath, JSON.stringify(results, null, 2), (err) => {
        if (err) {
          console.error('Error writing JSON file:', err);
          return;
        }
        console.log(`JSON file saved successfully as ${outputJsonPath}`);
      });
    })
    .on('error', (err) => {
      console.error('Error reading CSV file:', err);
    });
}

// Example usage
const inputCsvPath = './input.csv'; // Update to your CSV file path
const outputJsonPath = './output.json'; // Path to save the output JSON file
convertCsvToJson(inputCsvPath, outputJsonPath);