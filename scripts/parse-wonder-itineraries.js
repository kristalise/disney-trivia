#!/usr/bin/env node
// Parse Disney Wonder itinerary text and merge into sailing-data.json

const fs = require('fs');
const path = require('path');

const rawText = fs.readFileSync(path.join(__dirname, 'wonder-itineraries.txt'), 'utf8');

// Split into lines and clean
const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

const itineraries = [];
let currentRegion = '';

// Track whether we're in current or past
let isPast = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line === 'Current Disney Wonder Itineraries') {
    isPast = false;
    continue;
  }
  if (line === 'Past Disney Wonder Itineraries') {
    isPast = true;
    continue;
  }

  // Check if next line has bullet separator - if so, this line is a name and next is ports
  const nextLine = lines[i + 1];
  if (nextLine && nextLine.includes(' • ')) {
    // This line is the itinerary name, next line is ports
    const name = line;
    const portsLine = nextLine;
    const ports = portsLine.split(' • ').map(p => p.trim());

    // Skip dry dock, pandemic, no passengers, hurricane (no passengers), test cruises
    if (name.includes('Dry Dock') || name.includes('No Passengers') ||
        name.includes('Coronavirus') || name.includes('Test Cruise') ||
        name.includes('Hurricane') || name.includes('Dark (No Passengers)')) {
      i++; // skip the ports line
      continue;
    }

    const embarkationPort = ports[0];

    // Filter out "At Sea" and embark/disembark ports for portsOfCall
    // Also filter out "Dry Dock" entries and special markers
    const portsOfCall = ports.filter((p, idx) => {
      if (idx === 0) return false; // embarkation
      if (idx === ports.length - 1 && p === embarkationPort) return false; // round trip disembark
      if (p === 'At Sea') return false;
      if (p.startsWith('Dry Dock')) return false;
      if (p.startsWith('International Date Line')) return false;
      return true;
    });

    // Determine if round-trip (last port is "At Sea" or same as first)
    const lastPort = ports[ports.length - 1];
    const isRoundTrip = lastPort === 'At Sea' || lastPort === embarkationPort;
    const finalDisembark = isRoundTrip ? embarkationPort : lastPort;

    // If disembarkation is "At Sea", it's round trip back to embarkation
    const actualDisembark = finalDisembark === 'At Sea' ? embarkationPort : finalDisembark;

    // Remove the disembark port from portsOfCall if it's different from embark
    const filteredPorts = portsOfCall.filter(p => {
      if (!isRoundTrip && p === actualDisembark) return false;
      return true;
    });

    itineraries.push({
      name,
      isPast,
      embarkationPort: embarkationPort,
      disembarkationPort: actualDisembark,
      portsOfCall: filteredPorts,
      region: currentRegion,
    });

    i++; // skip the ports line
    continue;
  }

  // Known region headers
  const regionHeaders = [
    'Alaskan', 'Bahamian', 'Baja', 'Bermuda', 'British Isles',
    'Canada and New England', 'Canadian Coastline', 'Chartered',
    'Dark (No Passengers)', 'Dry Dock', 'Eastern Caribbean', 'Greek Isles',
    'Hawaiian', 'Hurricane (No Passengers)', 'Mediterranean',
    'Mexican Riviera', 'New Zealand and Australia', 'Northern European',
    'Norwegian Fjords', 'Norwegian Fjords and Iceland', 'Pacific Coast',
    'Panama Canal', 'Pandemic (No Passengers)', 'Repositioning',
    'Repositioning (No Passengers)', 'South Pacific', 'Southern Caribbean',
    'Transatlantic', 'UK Staycation', 'Western Caribbean', 'Western Europe',
  ];

  if (regionHeaders.includes(line)) {
    currentRegion = line;
    continue;
  }
}

// Deduplicate: same name + same ports = same entry
const seen = new Set();
const unique = [];
for (const it of itineraries) {
  const key = `${it.name}|||${it.portsOfCall.join(',')}|||${it.embarkationPort}|||${it.disembarkationPort}`;
  if (!seen.has(key)) {
    seen.add(key);
    unique.push(it);
  }
}

console.log(`Parsed ${itineraries.length} total, ${unique.length} unique itineraries`);

// Generate IDs
function slugify(str) {
  return str.toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

const idCounts = {};
const jsonEntries = unique.map(it => {
  let baseId = `wonder-${slugify(it.name)}`;
  if (idCounts[baseId] !== undefined) {
    idCounts[baseId]++;
    baseId = `${baseId}-${idCounts[baseId]}`;
  } else {
    idCounts[baseId] = 0;
  }

  return {
    id: baseId,
    name: it.name,
    ships: ['Disney Wonder'],
    embarkationPort: it.embarkationPort,
    disembarkationPort: it.disembarkationPort,
    portsOfCall: it.portsOfCall,
  };
});

// Load existing sailing-data.json
const sailingDataPath = path.join(__dirname, '..', 'data', 'sailing-data.json');
const existing = JSON.parse(fs.readFileSync(sailingDataPath, 'utf8'));

// Remove existing Disney Wonder entries to avoid duplicates
const nonWonder = existing.itineraries.filter(it => !it.ships.includes('Disney Wonder') || it.ships.length > 1);
console.log(`Existing: ${existing.itineraries.length} itineraries, ${nonWonder.length} non-Wonder`);

// Merge
const merged = [...nonWonder, ...jsonEntries];
console.log(`Merged total: ${merged.length} itineraries`);

// Update allPortsOfCall
const allPorts = new Set(existing.allPortsOfCall || []);
for (const it of jsonEntries) {
  allPorts.add(it.embarkationPort);
  if (it.disembarkationPort !== it.embarkationPort) {
    allPorts.add(it.disembarkationPort);
  }
  it.portsOfCall.forEach(p => allPorts.add(p));
}

existing.itineraries = merged;
existing.allPortsOfCall = Array.from(allPorts).sort();

fs.writeFileSync(sailingDataPath, JSON.stringify(existing, null, 2) + '\n');
console.log(`Written ${merged.length} itineraries and ${allPorts.size} ports to sailing-data.json`);
