import { getDeck } from '@/lib/stateroom-utils';
import type { RouteStop } from '@/lib/route-optimizer';

// ── Zone classification ──
// Adventure room numbers: deck prefix + 3-digit position
// First digit of last 3 determines the zone:
//   Starboard: 1xx (fwd), 3xx (mid), 5xx (aft)
//   Port:      2xx (fwd), 6xx (mid), 8xx (aft)
//   Forward center: 7xx
//   Aft center:     9xx

type AdventureZone =
  | 'stbd-fwd'   // 1xx
  | 'port-fwd'   // 2xx
  | 'stbd-mid'   // 3xx
  | 'stbd-aft'   // 5xx
  | 'port-mid'   // 6xx
  | 'fwd-center' // 7xx
  | 'port-aft'   // 8xx
  | 'aft-center'; // 9xx

type AdventureSide = 'port' | 'starboard' | 'center';

// ── Elevator positions (room number nearest each elevator, per deck) ──
// Forward elevator bank — near fwd center / zone 1xx-2xx boundary
const FWD_ELEVATOR_ROOMS: Record<number, number> = {
  2: 2700, 4: 4700, 5: 5700, 6: 6700, 7: 7700, 8: 8700,
  9: 9700, 10: 10700, 11: 11700, 12: 12700, 13: 13700, 14: 14700,
};

// Aft elevator bank — near aft center / zone 5xx-8xx boundary
const AFT_ELEVATOR_ROOMS: Record<number, number> = {
  2: 2900, 4: 4900, 5: 5900, 6: 6900, 7: 7900, 8: 8900,
  9: 9900, 10: 10900, 11: 11900, 12: 12900, 13: 13900, 14: 14900,
};

// ── Cost constants ──
const ZONE_SWITCH_COST = 30; // penalty for crossing the corridor (port↔starboard)
const DECK_COST = 50;        // penalty per deck of vertical travel

// ── Zone utilities ──

/** Get the 3-digit position suffix from a room number */
function getPosition(room: number): number {
  const s = room.toString();
  return parseInt(s.slice(-3), 10);
}

/** First digit of the 3-digit position determines the zone */
function getZoneDigit(room: number): number {
  return Math.floor(getPosition(room) / 100);
}

export function getAdventureZone(room: number): AdventureZone {
  const zd = getZoneDigit(room);
  switch (zd) {
    case 1: return 'stbd-fwd';
    case 2: return 'port-fwd';
    case 3: return 'stbd-mid';
    case 5: return 'stbd-aft';
    case 6: return 'port-mid';
    case 7: return 'fwd-center';
    case 8: return 'port-aft';
    case 9: return 'aft-center';
    default: return 'stbd-fwd'; // fallback
  }
}

export function getAdventureSide(room: number): AdventureSide {
  const zd = getZoneDigit(room);
  if (zd === 7 || zd === 9) return 'center';
  // Even zone digits = port, odd = starboard
  return zd % 2 === 0 ? 'port' : 'starboard';
}

// ── Coordinate mapping ──
// x = fore-aft position (low = forward, high = aft)
// y = cross-ship position (port=0, center=1, starboard=2)

interface Coords {
  x: number;
  y: number;
}

function getZoneBaseX(zoneDigit: number): number {
  switch (zoneDigit) {
    case 1: case 2: case 7: return 0;   // forward zones
    case 3: case 6:         return 100;  // midship zones
    case 5: case 8:         return 200;  // aft zones
    case 9:                 return 300;  // aft center
    default:                return 0;
  }
}

function getAdventureCoords(room: number): Coords {
  const pos = getPosition(room);
  const zd = getZoneDigit(room);
  const last2 = pos % 100;
  const x = getZoneBaseX(zd) + last2;

  const side = getAdventureSide(room);
  const y = side === 'port' ? 0 : side === 'center' ? 1 : 2;

  return { x, y };
}

// ── Distance function ──

function walkDistanceToElevator(room: number, elevatorRooms: Record<number, number>): number {
  const deck = getDeck(room);
  const elevRoom = elevatorRooms[deck];
  if (!elevRoom) return 999; // no elevator on this deck
  const roomCoords = getAdventureCoords(room);
  const elevCoords = getAdventureCoords(elevRoom);
  return Math.abs(roomCoords.x - elevCoords.x) + ZONE_SWITCH_COST * Math.abs(roomCoords.y - elevCoords.y);
}

export function adventureDistance(roomA: number, roomB: number): number {
  const deckA = getDeck(roomA);
  const deckB = getDeck(roomB);
  const coordsA = getAdventureCoords(roomA);
  const coordsB = getAdventureCoords(roomB);

  if (deckA === deckB) {
    // Same deck
    const foreAft = Math.abs(coordsA.x - coordsB.x);
    const crossShip = Math.abs(coordsA.y - coordsB.y);
    if (crossShip === 0) {
      return foreAft; // same zone side — just walk
    }
    return foreAft + ZONE_SWITCH_COST * crossShip;
  }

  // Different decks — choose the closer elevator
  const deckDelta = Math.abs(deckA - deckB);
  const verticalCost = DECK_COST * deckDelta;

  const viaFwd = walkDistanceToElevator(roomA, FWD_ELEVATOR_ROOMS)
    + verticalCost
    + walkDistanceToElevator(roomB, FWD_ELEVATOR_ROOMS);

  const viaAft = walkDistanceToElevator(roomA, AFT_ELEVATOR_ROOMS)
    + verticalCost
    + walkDistanceToElevator(roomB, AFT_ELEVATOR_ROOMS);

  return Math.min(viaFwd, viaAft);
}

// ── Direction helper ──

function getDirection(fromRoom: number, toRoom: number): 'forward' | 'aft' {
  const fromCoords = getAdventureCoords(fromRoom);
  const toCoords = getAdventureCoords(toRoom);
  return toCoords.x >= fromCoords.x ? 'aft' : 'forward';
}

// ── Main algorithm: nearest-neighbor greedy ──

export function optimizeAdventureRoute(
  startStateroom: number,
  targetStaterooms: number[]
): RouteStop[] {
  if (targetStaterooms.length === 0) return [];

  const remaining = new Set(targetStaterooms);
  const route: RouteStop[] = [];
  let current = startStateroom;

  while (remaining.size > 0) {
    let nearest = -1;
    let nearestDist = Infinity;

    for (const target of remaining) {
      const d = adventureDistance(current, target);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = target;
      }
    }

    remaining.delete(nearest);

    const side = getAdventureSide(nearest);
    route.push({
      stateroom: nearest,
      deck: getDeck(nearest),
      side,
      direction: getDirection(current, nearest),
    });

    current = nearest;
  }

  return route;
}
