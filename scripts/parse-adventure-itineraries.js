#!/usr/bin/env node
// Parse Disney Adventure itinerary text and merge into sailing-data.json

const fs = require('fs');
const path = require('path');

const rawText = fs.readFileSync(path.join(__dirname, 'adventure-itineraries.txt'), 'utf8');

const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

const itineraries = [];
let currentRegion = '';
let isPast = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line === 'Current Disney Adventure Itineraries') {
    isPast = false;
    continue;
  }
  if (line === 'Past Disney Adventure Itineraries') {
    isPast = true;
    continue;
  }

  const nextLine = lines[i + 1];
  if (nextLine && nextLine.includes(' • ')) {
    const name = line;
    const ports = nextLine.split(' • ').map(p => p.trim());

    if (name.includes('Dry Dock') || name.includes('No Passengers') ||
        name.includes('Coronavirus') || name.includes('Test Cruise') ||
        name.includes('Hurricane') || name.includes('CDC Simulation') ||
        name.includes('Delivery Placeholder') || name.includes('Overnight') ||
        name.startsWith('2-Night Port') || name.startsWith('6-Night Port')) {
      i++;
      continue;
    }

    const embarkationPort = ports[0];

    const portsOfCall = ports.filter((p, idx) => {
      if (idx === 0) return false;
      if (idx === ports.length - 1 && p === embarkationPort) return false;
      if (p === 'At Sea') return false;
      if (p.startsWith('Dry Dock')) return false;
      if (p.startsWith('International Date Line')) return false;
      if (p.startsWith('Cape Canaveral')) return false;
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
    'Bahamian', 'Dark (No Passengers)', 'New Build',
    'Panama Canal', 'Singapore', 'South Pacific',
    'Transatlantic',
  ];

  if (regionHeaders.includes(line)) {
    currentRegion = line;
    continue;
  }
}

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
  let baseId = `adventure-${slugify(it.name)}`;
  if (idCounts[baseId] !== undefined) {
    idCounts[baseId]++;
    baseId = `${baseId}-${idCounts[baseId]}`;
  } else {
    idCounts[baseId] = 0;
  }

  return {
    id: baseId,
    name: it.name,
    ships: ['Disney Adventure'],
    embarkationPort: it.embarkationPort,
    disembarkationPort: it.disembarkationPort,
    portsOfCall: it.portsOfCall,
  };
});

const sailingDataPath = path.join(__dirname, '..', 'data', 'sailing-data.json');
const existing = JSON.parse(fs.readFileSync(sailingDataPath, 'utf8'));

const nonAdventure = existing.itineraries.filter(it => !it.ships.includes('Disney Adventure') || it.ships.length > 1);
console.log(`Existing: ${existing.itineraries.length} itineraries, ${nonAdventure.length} non-Adventure`);

const merged = [...nonAdventure, ...jsonEntries];
console.log(`Merged total: ${merged.length} itineraries`);

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
