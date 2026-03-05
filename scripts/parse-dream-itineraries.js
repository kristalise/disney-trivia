#!/usr/bin/env node
// Parse Disney Dream itinerary text and merge into sailing-data.json

const fs = require('fs');
const path = require('path');

const rawText = fs.readFileSync(path.join(__dirname, 'dream-itineraries.txt'), 'utf8');

// Split into lines and clean
const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

const itineraries = [];
let currentRegion = '';
let isPast = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line === 'Current Disney Dream Itineraries') {
    isPast = false;
    continue;
  }
  if (line === 'Past Disney Dream Itineraries') {
    isPast = true;
    continue;
  }

  // Check if next line has bullet separator - if so, this line is a name and next is ports
  const nextLine = lines[i + 1];
  if (nextLine && nextLine.includes(' • ')) {
    const name = line;
    const portsLine = nextLine;
    const ports = portsLine.split(' • ').map(p => p.trim());

    // Skip dry dock, pandemic, no passengers, hurricane, test cruises, CDC simulation
    if (name.includes('Dry Dock') || name.includes('No Passengers') ||
        name.includes('Coronavirus') || name.includes('Test Cruise') ||
        name.includes('Hurricane') || name.includes('CDC Simulation')) {
      i++;
      continue;
    }

    const embarkationPort = ports[0];

    const portsOfCall = ports.filter((p, idx) => {
      if (idx === 0) return false;
      if (idx === ports.length - 1 && p === embarkationPort) return false;
      if (p === 'At Sea') return false;
      if (p.startsWith('Dry Dock')) return false;
      return true;
    });

    const lastPort = ports[ports.length - 1];
    const isRoundTrip = lastPort === 'At Sea' || lastPort === embarkationPort;
    const finalDisembark = isRoundTrip ? embarkationPort : lastPort;
    const actualDisembark = finalDisembark === 'At Sea' ? embarkationPort : finalDisembark;

    const filteredPorts = portsOfCall.filter(p => {
      if (!isRoundTrip && p === actualDisembark) return false;
      return true;
    });

    itineraries.push({
      name,
      isPast,
      embarkationPort,
      disembarkationPort: actualDisembark,
      portsOfCall: filteredPorts,
      region: currentRegion,
    });

    i++;
    continue;
  }

  const regionHeaders = [
    'Alaskan', 'Bahamian', 'Baja', 'Belgium', 'Bermuda', 'British Isles',
    'Canada and New England', 'Canadian Coastline', 'Chartered',
    'Dry Dock', 'Eastern Caribbean', 'France', 'Greek Isles',
    'Hurricane (No Passengers)', 'Mediterranean', 'Mexican Riviera',
    'Netherlands', 'Northern European', 'Norwegian Fjords',
    'Norwegian Fjords and Iceland', 'Pacific Coast', 'Panama Canal',
    'Pandemic (No Passengers)', 'Repositioning', 'Repositioning (No Passengers)',
    'Southern Caribbean', 'Transatlantic', 'Western Caribbean', 'Western Europe',
  ];

  if (regionHeaders.includes(line)) {
    currentRegion = line;
    continue;
  }
}

// Deduplicate
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

function slugify(str) {
  return str.toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

const idCounts = {};
const jsonEntries = unique.map(it => {
  let baseId = `dream-${slugify(it.name)}`;
  if (idCounts[baseId] !== undefined) {
    idCounts[baseId]++;
    baseId = `${baseId}-${idCounts[baseId]}`;
  } else {
    idCounts[baseId] = 0;
  }

  return {
    id: baseId,
    name: it.name,
    ships: ['Disney Dream'],
    embarkationPort: it.embarkationPort,
    disembarkationPort: it.disembarkationPort,
    portsOfCall: it.portsOfCall,
  };
});

// Load existing sailing-data.json
const sailingDataPath = path.join(__dirname, '..', 'data', 'sailing-data.json');
const existing = JSON.parse(fs.readFileSync(sailingDataPath, 'utf8'));

// Remove existing Disney Dream entries to avoid duplicates
const nonDream = existing.itineraries.filter(it => !it.ships.includes('Disney Dream') || it.ships.length > 1);
console.log(`Existing: ${existing.itineraries.length} itineraries, ${nonDream.length} non-Dream`);

// Merge
const merged = [...nonDream, ...jsonEntries];
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
