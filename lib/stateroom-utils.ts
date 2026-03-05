import stateroomData from '@/data/stateroom-data.json';

type ShipName = 'Disney Magic' | 'Disney Wonder' | 'Disney Dream' | 'Disney Fantasy' | 'Disney Wish' | 'Disney Treasure' | 'Disney Destiny' | 'Disney Adventure';

interface Stateroom {
  stateroom: number;
  category: string | null;
  occupancy: number | null;
  connecting: string | null;
  accessible: string | null;
  verandahPartitions: string | null;
  bedding: string | null;
  assemblyStation: string | null;
  assemblyLocation: string | null;
  assemblySide: string | null;
  assemblySection: string | null;
  wishExtender?: string | null;
  theme?: string | null;
  notes: string | null;
}

const data = stateroomData as Record<ShipName, Stateroom[]>;

export const TYPE_EMOJI: Record<string, string> = {
  'Concierge / Suite': '👑',
  'Verandah': '🌊',
  'Oceanview': '🪟',
  'Oceanview (Porthole)': '⭕',
  'Inside': '🛏',
};

export function getCategoryType(category: string | null): string {
  if (!category) return 'Unknown';
  const num = parseInt(category.replace(/^0+/, ''), 10);
  if (isNaN(num)) return 'Unknown';
  if (num >= 1 && num <= 3) return 'Concierge / Suite';
  if (num >= 4 && num <= 5) return 'Verandah';
  if (num === 6) return 'Oceanview';
  if (num === 7) return 'Oceanview (Porthole)';
  if (num >= 8 && num <= 11) return 'Inside';
  return 'Other';
}

export function getDeck(stateroom: number): number {
  const s = stateroom.toString();
  if (s.length === 5) return parseInt(s.slice(0, 2), 10);
  if (s.length === 4) return parseInt(s[0], 10);
  return 0;
}

/**
 * Get port/starboard side from stateroom number.
 * DCL convention across all ships: even = port (left facing bow),
 * odd = starboard (right facing bow).
 */
export function getSide(stateroom: number): 'port' | 'starboard' {
  return stateroom % 2 === 0 ? 'port' : 'starboard';
}

/**
 * Extract the room position within a deck (the digits after the deck prefix).
 * Lower position = more forward, higher position = more aft.
 */
export function getRoomPosition(stateroom: number): number {
  const s = stateroom.toString();
  if (s.length === 5) return parseInt(s.slice(2), 10);
  if (s.length === 4) return parseInt(s.slice(1), 10);
  return stateroom;
}

/**
 * Get all decks that have staterooms for a given ship.
 */
export function getStateroomDecks(shipName: string): number[] {
  const shipRooms = data[shipName as ShipName];
  if (!shipRooms) return [];
  const decks = new Set<number>();
  for (const r of shipRooms) {
    decks.add(getDeck(r.stateroom));
  }
  return Array.from(decks).sort((a, b) => a - b);
}

export function getSection(stateroom: Stateroom, shipRooms: Stateroom[]): string {
  // Use assembly section if available
  if (stateroom.assemblySection) {
    const sec = stateroom.assemblySection.toLowerCase();
    if (sec.includes('fwd') || sec.includes('forward')) return 'Forward';
    if (sec.includes('mid')) return 'Midship';
    if (sec.includes('aft')) return 'Aft';
  }
  // Derive from position among rooms on the same deck
  const deck = getDeck(stateroom.stateroom);
  const deckRooms = shipRooms
    .filter(r => getDeck(r.stateroom) === deck)
    .sort((a, b) => a.stateroom - b.stateroom);
  if (deckRooms.length === 0) return 'Unknown';
  const idx = deckRooms.findIndex(r => r.stateroom === stateroom.stateroom);
  const pct = idx / (deckRooms.length - 1 || 1);
  if (pct < 0.33) return 'Forward';
  if (pct < 0.67) return 'Midship';
  return 'Aft';
}

export interface StateroomInfo {
  deck: number;
  type: string;
  typeEmoji: string;
  theme: string | null;
  category: string | null;
  connecting: string | null;
  section: string;
  occupancy: number | null;
  bedding: string | null;
  accessible: string | null;
}

export function isValidStateroomForShip(roomNumber: number, shipName: string): boolean {
  const shipRooms = data[shipName as ShipName];
  if (!shipRooms) return false;
  return shipRooms.some(r => r.stateroom === roomNumber);
}

export function getMaxOccupancy(roomNumber: number, shipName: string): number | null {
  const shipRooms = data[shipName as ShipName];
  if (!shipRooms) return null;
  const room = shipRooms.find(r => r.stateroom === roomNumber);
  if (!room) return null;
  return room.occupancy ?? null;
}

export function lookupStateroomInfo(roomNumber: number, shipName: string): StateroomInfo | null {
  const shipRooms = data[shipName as ShipName];
  if (!shipRooms) return null;
  const room = shipRooms.find(r => r.stateroom === roomNumber);
  if (!room) return null;
  const type = getCategoryType(room.category);
  return {
    deck: getDeck(room.stateroom),
    type,
    typeEmoji: TYPE_EMOJI[type] || '',
    theme: room.theme ?? null,
    category: room.category,
    connecting: room.connecting ?? null,
    section: getSection(room, shipRooms),
    occupancy: room.occupancy ?? null,
    bedding: room.bedding ?? null,
    accessible: room.accessible ?? null,
  };
}
