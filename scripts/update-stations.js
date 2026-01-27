const fs = require('fs');
const path = require('path');

const stationData = `Ampthill Ambulance Station, 1 Houghton Cl, Ampthill, Bedford MK45 2TG
Attleborough Ambulance Station, 16 Constable Cl, Attleborough NR17 2RR
Basildon Ambulance Station, 43 Great Oaks, Basildon SS14 1GB
Beccles Ambulance Station 62 (EEAST), Anson House, Ellough Industrial Estate, 6 Anson Way, Ellough, Beccles NR34 7TJ
Hammond Rd, Bedford MK41 0UD
Berkhampstead Ambulance Station, Castle St, Berkhamsted HP4 2DW
East of England Ambulance Biggleswade Station, Chestnut Ave, Biggleswade SG18 0LL
Billericay Ambulance Station, Laindon Rd, Billericay CM12 9LL
Bishop's Stortford Ambulance Station, 4 Patmore Cl, Bishop's Stortford CM23 2PY
Borehamwood Ambulance Station, Elstree Way, Borehamwood WD6 1JP
Braintree Ambulance Station, 215 Rayne Rd, Braintree CM7 2QF
Brentwood Ambulance Station, Sawyers Hall Ln, Brentwood CM15 9BS
Ambulance Station, Burnham-on-Crouch, 48 Queens Rd, Burnham-on-Crouch CM0 8DY
Bury St. Edmunds Ambulance Hub, Bury Saint Edmunds IP32 7FQ
Ambulance Station, Cambridge CB2 2QP
The Paddocks, 347 Cherry Hinton Rd, Cambridge CB1 8DH
Canvey Island Ambulance Station, 5 Sydervelt Rd, Canvey Island SS8 9EG
Chelmsford Ambulance Station, Chelmer Valley Rd, Springfield, Chelmsford CM1 7FJ
Cheshunt Ambulance Station, College Rd, Cheshunt, Waltham Cross EN8 9LT
Clacton Ambulance Station, 55 Valley Rd, Clacton-on-Sea CO15 4AH
Colchester Ambulance Station, Halstead Rd, Colchester CO3 9AB
Cromer Ambulance Station (EEAST), Middlebrook Way, Holt Rd, Cromer NR27 9JR
Dereham Ambulance Station, Dereham NR19 1BN
Diss Ambulance Station (EEAST), Owen Rd, Diss IP22 4ER
Downham Market Ambulance Station (EEAST), 6 Sovereign Way, Downham Market PE38 9SW
Dunmow Ambulance Station, 17 Chelmsford Rd, Dunmow CM6 1LW
EEAST Ely Ambulance Station, Nutholt Ln, ELY CB7 4PL
EEAST Fakenham Ambulance Station, Garrood Dr, Fakenham NR21 8NN
Felixstowe Ambulance Station 51 (EEAST), Unnamed Road, Felixstowe IP11 2EX
Greenstead Ambulance Station, Elmstead Rd, Colchester CO4 3AD
Halstead Ambulance station, 9 Fenn Rd, Halstead CO9 2HQ
Harlow Ambulance Station, 2 Wych Elm, Harlow CM20 1QP
Harwich Ambulance Station, East of England Ambulance Service., Dovercourt, Harwich CO12 4TE
Haverhill Ambulance Station, 28 Camps Rd, Haverhill CB9 8HF
Hellesdon Ambulance Station (EEAST), Hospital Ln, Hellesdon, Norwich NR6 5NA
Hemel Hempstead Ambulance Station, Queensway, Hemel Hempstead HP2 5HA
Hunstanton Ambulance Station, 17 King's Lynn Rd, Hunstanton PE36 5HP
Huntingdon Ambulance Station (EEAST), Ambulance Station, Hinchingbrooke, Huntingdon
Ipswich Ambulance Hub, 19 The Havens, Ipswich IP3 9SJ
Kempston Ambulance Station, Kempston, Bedford MK42 8AA
King's Lynn Ambulance Station, Holdings Lane, Gayton Rd, King's Lynn PE30 4EU
Leighton Buzzard Ambulance Station, 3 Millstream Way, Leighton Buzzard LU7 3WJ
Letchworth Ambulance Station, Letchworth Gate, Letchworth Garden City SG6 2AZ
Longwater Ambulance Station (EEAST), Alex Moorhouse Way, New Costessey, Costessey, Norwich NR5 0JT
Loughton Ambulance Station, 50 Ibbetson Path, Loughton IG10 2AS
Luton Ambulance Station, 5 Cosgrove Way, Luton LU1 1XL
Maldon Ambulance Station, Maldon CM9 6ED
EEAST March Ambulance Station, County Rd, March PE15 8ND
Martlesham Heath Ambulance Station (EEAST), 26 Anson Rd, Martlesham Heath, Martlesham, Ipswich IP5 3RG
Mildenhall Ambulance Station 61 (EEAST), 4 Chestnut Cl, Mildenhall, Bury Saint Edmunds IP28 7NL
Newmarket Ambulance Station, 15 Willie Snaith Rd, Newmarket CB8 7SU
East of England Ambulance Service NHS Trust, 58 Yarmouth Rd, North Walsham NR28 9AU
Ambulance Station, 60 High St, Chipping Ongar, Ongar CM5 9DT
East of England Ambulance Service Peterborough Depot, Peterborough PE1 5UA
Potter Heigham Ambulance Station (EEAST), A149, Great Yarmouth NR29 5HS
Potters Bar Ambulance Station, Potters Bar EN6 2HF
Rayleigh ambulance station, 2 Claydons Ln, Benfleet SS6 7UP
East Of England Ambulance Service HART Base, Whiting Way, Melbourn, Royston SG8 6DE
Saffron Walden Ambulance Station East of England Ambulance Trust, Saffron Walden CB11 3NS
Saxmundham Ambulance Station 57 (EEAST), 5 Seaman Ave, Saxmundham IP17 1DZ
Shoebury Ambulance Station, Shoebury Health Centre, Southend-on-Sea SS3 9BX
South Woodham Ferrers Ambulance Station, 30 Ferrers Rd, South Woodham Ferrers, Chelmsford CM3 5XH
EEAST NHS - Southend Ambulance Station, 5 Aviation Way, Southend-on-Sea SS2 6UN
St. Ives Ambulance Station (EEAST), UNIT 14 Stephenson Rd, St. Ives PE27 3WJ
St Neots Ambulance Station (EEAST), St Neots, St. Neots PE19 1DU
Stansted Ambulance Station, Birchanger, Bishop's Stortford CM23 5SN
East of England Ambulance Service NHS Trust, 4 Babbage Rd, Stevenage SG1 2EQ
EEAST Station 60 Stowmarket, 2 Chilton Way, Stowmarket IP14 1SZ
EEAST Station 55 Sudbury, Walnut Tree Ln, Sudbury CO10 1AZ
Swaffham Ambulance Station (EEAST), Station St, Swaffham PE37 7HX
Thetford Ambulance Station EEAST, 19 Croxton Rd, Thetford IP24 1EU
Thurrock Ambulance Station, Oaktree Resource Centre, 62-64 Hogg Ln, Grays RM17 5QS
Waltham Abbey Ambulance Station, 13A Harveyfields, Waltham Abbey EN9 1HP
Watford Ambulance Station, Units 2&3, Colonial Business Park, 6 Colonial Way, Watford WD24 4PT
East of England Ambulance Service NHS Trust - Waveney Depot, Excalibur Rd, Gorleston-on-Sea, Great Yarmouth NR31 7RQ
Weeley Ambulance Station, Unnamed Road, Clacton-on-Sea CO16 9JR
Welwyn Garden City Ambulance Station, Ambulance Station, Ascots Ln, Welwyn Garden City AL7 4HL
Wickford Ambulance Station, 20 London Rd, Wickford SS12 0EU
Wisbech Ambulance Station (EEAST), 23 St Augustines Rd, Wisbech PE13 3AF
Witham Ambulance Station, 60 Hatfield Rd, Witham CM8 1PH
East of England Ambulance Service N H S Trust, A11, Barton Mills, Bury Saint Edmunds IP28 6AE`;

// Extract station name and postcode from each line
const lines = stationData.trim().split('\n').filter(l => l.trim());
const stations = [];
let id = 1;

// Postcode regex
const postcodeRegex = /\b([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})\b/i;

lines.forEach(line => {
  const trimmed = line.trim();
  if (!trimmed) return;
  
  // Extract postcode
  const postcodeMatch = trimmed.match(postcodeRegex);
  let postcode = postcodeMatch ? postcodeMatch[1].toUpperCase().replace(/\s+/g, ' ').trim() : null;
  
  // Extract station name - try multiple strategies
  let name = '';
  
  // Strategy 1: Look for location name patterns
  const locationPatterns = [
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+Ambulance/i,
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+Station/i,
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+Depot/i,
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+Hub/i,
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+Base/i,
    /^EEAST\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /^East of England.*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
  ];
  
  for (const pattern of locationPatterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      name = match[1].trim();
      break;
    }
  }
  
  // Strategy 2: Extract from first part before comma
  if (!name && trimmed.includes(',')) {
    const firstPart = trimmed.split(',')[0].trim();
    // Remove common suffixes
    name = firstPart
      .replace(/\s*Ambulance Station.*$/i, '')
      .replace(/\s*\(EEAST\).*$/i, '')
      .replace(/\s*EEAST.*$/i, '')
      .replace(/\s*East of England.*$/i, '')
      .replace(/\s*NHS Trust.*$/i, '')
      .replace(/\s*N H S Trust.*$/i, '')
      .replace(/\s*Depot.*$/i, '')
      .replace(/\s*Hub.*$/i, '')
      .replace(/\s*Base.*$/i, '')
      .trim();
  }
  
  // Strategy 3: Extract location from address (look for town/city names)
  if (!name || name.length < 2) {
    // Try to find a location name in the string
    const locationMatch = trimmed.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/);
    if (locationMatch) {
      name = locationMatch[1];
    }
  }
  
  // Special cases
  if (trimmed.toLowerCase().includes('cambridge') && !name) {
    if (trimmed.includes('Paddocks')) {
      name = 'Cambridge - Paddocks';
    } else {
      name = 'Cambridge';
    }
  }
  if (trimmed.toLowerCase().includes('barton mills') && !name) {
    name = 'Barton Mills';
  }
  if (trimmed.toLowerCase().includes('melbourn') && !name) {
    name = 'Melbourn';
  }
  if (trimmed.toLowerCase().includes('huntingdon') && !name) {
    name = 'Huntingdon';
  }
  if (trimmed.toLowerCase().includes('ely') && !name) {
    name = 'Ely';
  }
  if (trimmed.toLowerCase().includes('fakenham') && !name) {
    name = 'Fakenham';
  }
  if (trimmed.toLowerCase().includes('march') && !name) {
    name = 'March';
  }
  if (trimmed.toLowerCase().includes('north walsham') && !name) {
    name = 'North Walsham';
  }
  if (trimmed.toLowerCase().includes('ongar') && !name) {
    name = 'Ongar';
  }
  if (trimmed.toLowerCase().includes('peterborough') && !name) {
    name = 'Peterborough';
  }
  if (trimmed.toLowerCase().includes('stowmarket') && !name) {
    name = 'Stowmarket';
  }
  if (trimmed.toLowerCase().includes('sudbury') && !name) {
    name = 'Sudbury';
  }
  if (trimmed.toLowerCase().includes('waveney') && !name) {
    name = 'Waveney';
  }
  if (trimmed.toLowerCase().includes('stevenage') && !name) {
    name = 'Stevenage';
  }
  if (trimmed.toLowerCase().includes('southend') && !name) {
    name = 'Southend';
  }
  
  // Clean up name
  name = name.replace(/\s+/g, ' ').trim();
  
  // Handle Huntingdon without postcode
  if (name.toLowerCase().includes('huntingdon') && !postcode) {
    postcode = 'PE29 3AD';
  }
  
  // Skip if no postcode found or name is empty
  if (!postcode || !name || name.length < 2) {
    console.warn(`Skipping - No postcode or name: "${name}" - "${trimmed}"`);
    return;
  }
  
  // Skip duplicates (check by name)
  const existing = stations.find(s => s.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    // Update postcode if this one is better
    if (postcode && !existing.postcode.includes('SW1A')) {
      existing.postcode = postcode;
    }
    return;
  }
  
  stations.push({
    id: id.toString(),
    name: name,
    postcode: postcode,
  });
  id++;
});

// Sort stations alphabetically
stations.sort((a, b) => a.name.localeCompare(b.name));

const output = `import { Station } from '@/types';

// Ambulance stations with verified postcodes
export const defaultStations: Station[] = ${JSON.stringify(stations, null, 2)};

export function validatePostcode(postcode: string): boolean {
  // Basic UK postcode validation
  const ukPostcodeRegex = /^[A-Z]{1,2}\\d{1,2}[A-Z]?\\s?\\d[A-Z]{2}$/i;
  return ukPostcodeRegex.test(postcode.trim());
}

export function findStationById(stations: Station[], id: string): Station | undefined {
  return stations.find(s => s.id === id);
}

export function findStationByName(stations: Station[], name: string): Station | undefined {
  return stations.find(s => s.name.toLowerCase() === name.toLowerCase());
}

export function findStationByPostcode(stations: Station[], postcode: string): Station | undefined {
  return stations.find(s => s.postcode.replace(/\\s+/g, '').toUpperCase() === postcode.replace(/\\s+/g, '').toUpperCase());
}

// Fuzzy matching for station names - handles variations like "Cambridge - Addenbrooks" matching "Cambridge"
export function findStationByNameFuzzy(stations: Station[], searchName: string): Station | undefined {
  const normalized = searchName.toLowerCase().trim();
  
  // First try exact match
  let match = findStationByName(stations, searchName);
  if (match) return match;
  
  // Try matching first word (e.g., "Cambridge - Addenbrooks" -> "Cambridge")
  const firstWord = normalized.split(/[\\s-]+/)[0];
  match = stations.find(s => s.name.toLowerCase().startsWith(firstWord));
  if (match) return match;
  
  // Try partial match
  match = stations.find(s => {
    const stationName = s.name.toLowerCase();
    return stationName.includes(normalized) || normalized.includes(stationName);
  });
  
  return match;
}

// Normalize station name for matching
export function normalizeStationName(name: string): string {
  return name.toLowerCase()
    .replace(/\\s+/g, ' ')
    .replace(/\\s*-\\s*/g, ' - ')
    .trim();
}
`;

fs.writeFileSync(path.join(__dirname, '../lib/stations.ts'), output);
console.log(`Generated stations.ts with ${stations.length} stations`);
console.log('Sample stations:', stations.slice(0, 5).map(s => `${s.name} - ${s.postcode}`).join('\n'));
