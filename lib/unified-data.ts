import unifiedData from '@/data/unified-venues.json';
import activityData from '@/data/activity-data.json';
import diningData from '@/data/dining-data.json';

// --- Types ---

export interface ShipInstance {
  ship: string;
  name: string;
  decks: number[];
  position: string[];
  description: string;
  current: boolean;
}

export interface UnifiedVenue {
  id: string;
  name: string;
  category: string;
  description: string;
  ip: string | null;
  parentId: string | null;
  shipInstances: ShipInstance[];
}

export interface VenueCategory {
  label: string;
  emoji: string;
}

// --- Raw data ---

const categories = unifiedData.categories as Record<string, VenueCategory>;
const venues = unifiedData.venues as UnifiedVenue[];

// --- Indexes (built once) ---

const venueById = new Map<string, UnifiedVenue>();
for (const v of venues) venueById.set(v.id, v);

// --- Accessor functions ---

/** All venue categories */
export function getCategories(): Record<string, VenueCategory> {
  return categories;
}

/** All venue concepts */
export function getAllVenues(): UnifiedVenue[] {
  return venues;
}

/** Single venue by ID */
export function getVenueById(id: string): UnifiedVenue | undefined {
  return venueById.get(id);
}

/** Get a specific ship instance for a venue */
export function getVenueInstance(venueId: string, ship: string): ShipInstance | undefined {
  const venue = venueById.get(venueId);
  if (!venue) return undefined;
  return venue.shipInstances.find(si => si.ship === ship);
}

/** All venues that exist on a given ship (returns venue + the matching instance) */
export function getVenuesByShip(ship: string): Array<{ venue: UnifiedVenue; instance: ShipInstance }> {
  const results: Array<{ venue: UnifiedVenue; instance: ShipInstance }> = [];
  for (const v of venues) {
    const inst = v.shipInstances.find(si => si.ship === ship);
    if (inst) results.push({ venue: v, instance: inst });
  }
  return results;
}

/** All venues on a specific deck of a specific ship */
export function getVenuesByDeck(ship: string, deck: number): Array<{ venue: UnifiedVenue; instance: ShipInstance }> {
  const results: Array<{ venue: UnifiedVenue; instance: ShipInstance }> = [];
  for (const v of venues) {
    const inst = v.shipInstances.find(si => si.ship === ship && si.decks.includes(deck));
    if (inst) results.push({ venue: v, instance: inst });
  }
  return results;
}

/** Get child venues (sub-venues) for a parent */
export function getSubVenues(parentId: string): UnifiedVenue[] {
  return venues.filter(v => v.parentId === parentId);
}

/** Get all unique ship names across all venues */
export function getAllShips(): string[] {
  const ships = new Set<string>();
  for (const v of venues) {
    for (const si of v.shipInstances) ships.add(si.ship);
  }
  return Array.from(ships);
}

/** Get all unique IP themes */
export function getAllIPs(): string[] {
  const ips = new Set<string>();
  for (const v of venues) {
    if (v.ip) ips.add(v.ip);
  }
  return Array.from(ips).sort();
}

// --- Backward-compatible flat format (for existing consumers) ---

export interface FlatVenue {
  id: string;
  name: string;
  category: string;
  description: string;
  ships: string[];
  historicalShips?: string[];
  ip: string | null;
}

/**
 * Returns venues in the old flat format: { id, name, category, description, ships[], ip }
 * Ships array contains all ships where the venue currently exists.
 */
export function getVenues(): FlatVenue[] {
  return venues.map(v => ({
    id: v.id,
    name: v.name,
    category: v.category,
    description: v.description,
    ships: v.shipInstances.filter(si => si.current).map(si => si.ship),
    historicalShips: v.shipInstances.filter(si => !si.current).map(si => si.ship),
    ip: v.ip,
  }));
}

/**
 * Returns categories + venues in the old format (drop-in replacement for venue-data.json import)
 */
export function getVenueData(): { categories: Record<string, VenueCategory>; venues: FlatVenue[] } {
  return { categories, venues: getVenues() };
}

/** Convert ship name to URL slug (e.g., "Disney Magic" → "disney-magic") */
export function shipToSlug(ship: string): string {
  return ship.toLowerCase().replace(/\s+/g, '-');
}

/** Convert URL slug back to ship name (e.g., "disney-magic" → "Disney Magic") */
export function slugToShip(slug: string): string | undefined {
  const target = slug.toLowerCase();
  for (const v of venues) {
    for (const si of v.shipInstances) {
      if (shipToSlug(si.ship) === target) return si.ship;
    }
  }
  return undefined;
}

// --- Activity & Dining data ---

export interface Activity {
  id: string;
  name: string;
  type: string;
  description: string;
  ships: string[];
  ip: string | null;
  venueId: string | null;
}

export interface DiningEntry {
  id: string;
  name: string;
  type: string;
  description: string;
  ships: string[];
  venueId: string | null;
}

const allActivities = activityData.activities as Activity[];
const activityTypes = activityData.types as Record<string, { label: string; emoji: string }>;
const allDining = diningData.restaurants as DiningEntry[];
const diningTypes = diningData.types as Record<string, { label: string; emoji: string }>;

/** Get activities that happen at a venue (optionally filtered by ship) */
export function getActivitiesByVenueId(venueId: string, ship?: string): Activity[] {
  return allActivities.filter(a =>
    a.venueId === venueId && (!ship || a.ships.includes(ship))
  );
}

/** Get dining experiences at a venue (optionally filtered by ship) */
export function getDiningByVenueId(venueId: string, ship?: string): DiningEntry[] {
  return allDining.filter(d =>
    d.venueId === venueId && (!ship || d.ships.includes(ship))
  );
}

/** Activity type metadata */
export function getActivityTypes(): Record<string, { label: string; emoji: string }> {
  return activityTypes;
}

/** Dining type metadata */
export function getDiningTypes(): Record<string, { label: string; emoji: string }> {
  return diningTypes;
}
