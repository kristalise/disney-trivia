export interface Stateroom {
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

export interface RoomPosition {
  room: Stateroom;
  x: number;
  y: number;
}

export type RoomClass = 'suite' | 'verandah' | 'outside' | 'inside';

export const CATEGORY_COLORS: Record<RoomClass, string> = {
  suite: '#d4af37',
  verandah: '#3b82f6',
  outside: '#22c55e',
  inside: '#94a3b8',
};

export const CATEGORY_LABELS: Record<RoomClass, string> = {
  suite: 'Suite',
  verandah: 'Verandah',
  outside: 'Outside',
  inside: 'Inside',
};

/** Extract deck number from stateroom number (e.g. 8510 → 8, 11234 → 11) */
export function getDeckFromRoomNumber(num: number): number {
  return Math.floor(num / 1000);
}

/** Get sorted list of unique deck numbers for a ship's rooms */
export function getDecksForShip(rooms: Stateroom[]): number[] {
  const decks = new Set(rooms.map((r) => getDeckFromRoomNumber(r.stateroom)));
  return [...decks].sort((a, b) => a - b);
}

/** Filter rooms to only those on a specific deck */
export function getRoomsOnDeck(rooms: Stateroom[], deck: number): Stateroom[] {
  return rooms.filter((r) => getDeckFromRoomNumber(r.stateroom) === deck);
}

/** Map a category string to a room class based on prefix number */
export function getCategoryClass(category: string | null): RoomClass {
  if (!category) return 'inside';
  const num = parseInt(category, 10);
  if (isNaN(num)) return 'inside';
  if (num >= 1 && num <= 4) return 'suite';
  if (num >= 5 && num <= 8) return 'verandah';
  if (num >= 9 && num <= 10) return 'outside';
  return 'inside';
}

/** Maps each ship to its official deck plan image in /deck-plans/ */
export const SHIP_DECK_PLAN_IMAGES: Record<string, string> = {
  'Disney Magic': '/deck-plans/magic-wonder.webp',
  'Disney Wonder': '/deck-plans/magic-wonder.webp',
  'Disney Dream': '/deck-plans/dream-fantasy.webp',
  'Disney Fantasy': '/deck-plans/dream-fantasy.webp',
  'Disney Wish': '/deck-plans/wish-treasure.webp',
  'Disney Treasure': '/deck-plans/wish-treasure.webp',
  'Disney Destiny': '/deck-plans/destiny.webp',
  'Disney Adventure': '/deck-plans/adventure.webp',
};

/** Maps each ship to its room layouts image in /deck-plans/ */
export const SHIP_ROOM_LAYOUT_IMAGES: Record<string, string> = {
  'Disney Magic': '/deck-plans/magic-wonder-layouts.webp',
  'Disney Wonder': '/deck-plans/magic-wonder-layouts.webp',
  'Disney Dream': '/deck-plans/dream-fantasy-layouts.webp',
  'Disney Fantasy': '/deck-plans/dream-fantasy-layouts.webp',
  'Disney Wish': '/deck-plans/wish-treasure-layouts.webp',
  'Disney Treasure': '/deck-plans/wish-treasure-layouts.webp',
  'Disney Destiny': '/deck-plans/destiny-layouts.webp',
  'Disney Adventure': '/deck-plans/adventure-layouts.webp',
};

/** Ships that share the same deck plan image */
export const SHIP_PAIRS: Record<string, string> = {
  'Disney Magic': 'Disney Wonder',
  'Disney Wonder': 'Disney Magic',
  'Disney Dream': 'Disney Fantasy',
  'Disney Fantasy': 'Disney Dream',
  'Disney Wish': 'Disney Treasure',
  'Disney Treasure': 'Disney Wish',
};

// SVG layout constants
const ROOM_W = 8;
const ROOM_H = 12;
const GAP = 2;

const ZONE_X: Record<string, { start: number; end: number }> = {
  Forward: { start: 140, end: 370 },
  Midship: { start: 370, end: 700 },
  Aft: { start: 700, end: 870 },
};

const SIDE_Y: Record<string, { start: number; end: number }> = {
  Portside: { start: 30, end: 110 },
  Starboard: { start: 130, end: 210 },
};

/**
 * Compute room positions for rooms with valid assemblySide/assemblySection data.
 * Arranges rooms in columns within each of the 6 zones.
 */
export function computeRoomPositions(deckRooms: Stateroom[]): RoomPosition[] {
  const positions: RoomPosition[] = [];

  // Group rooms by side × section
  const groups: Record<string, Stateroom[]> = {};
  for (const room of deckRooms) {
    const side = room.assemblySide;
    const section = room.assemblySection;
    if (!side || !section || side === 'TBD' || section === 'TBD') continue;
    if (!ZONE_X[section] || !SIDE_Y[side]) continue;
    const key = `${side}/${section}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(room);
  }

  for (const [key, rooms] of Object.entries(groups)) {
    const [side, section] = key.split('/');
    const zoneX = ZONE_X[section];
    const sideY = SIDE_Y[side];

    // Sort by room number for consistent ordering
    rooms.sort((a, b) => a.stateroom - b.stateroom);

    const zoneWidth = zoneX.end - zoneX.start;
    const zoneHeight = sideY.end - sideY.start;

    // Calculate grid dimensions
    const maxCols = Math.floor(zoneWidth / (ROOM_W + GAP));
    const maxRows = Math.floor(zoneHeight / (ROOM_H + GAP));
    const cols = Math.min(maxCols, Math.ceil(rooms.length / maxRows));
    const rows = Math.ceil(rooms.length / cols);

    // Center the grid within the zone
    const gridWidth = cols * (ROOM_W + GAP) - GAP;
    const gridHeight = rows * (ROOM_H + GAP) - GAP;
    const offsetX = zoneX.start + (zoneWidth - gridWidth) / 2;
    const offsetY = sideY.start + (zoneHeight - gridHeight) / 2;

    rooms.forEach((room, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positions.push({
        room,
        x: offsetX + col * (ROOM_W + GAP),
        y: offsetY + row * (ROOM_H + GAP),
      });
    });
  }

  return positions;
}

/**
 * Fallback grid layout for ships with TBD positional data (e.g. Disney Adventure).
 * Arranges rooms left-to-right in rows across the full ship body.
 */
export function computeFallbackGrid(deckRooms: Stateroom[]): RoomPosition[] {
  const sorted = [...deckRooms].sort((a, b) => a.stateroom - b.stateroom);
  const positions: RoomPosition[] = [];

  const startX = 80;
  const endX = 920;
  const startY = 30;
  const endY = 210;

  const maxCols = Math.floor((endX - startX) / (ROOM_W + GAP));
  const maxRows = Math.floor((endY - startY) / (ROOM_H + GAP));
  const cols = Math.min(maxCols, Math.ceil(sorted.length / Math.max(1, maxRows)));

  // Center horizontally
  const gridWidth = cols * (ROOM_W + GAP) - GAP;
  const offsetX = startX + ((endX - startX) - gridWidth) / 2;

  sorted.forEach((room, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions.push({
      room,
      x: offsetX + col * (ROOM_W + GAP),
      y: startY + row * (ROOM_H + GAP),
    });
  });

  return positions;
}
