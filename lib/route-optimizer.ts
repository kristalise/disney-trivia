import { getDeck, getSide, getRoomPosition } from '@/lib/stateroom-utils';
import { optimizeAdventureRoute } from '@/lib/adventure-route-optimizer';

export interface RouteStop {
  stateroom: number;
  deck: number;
  side: 'port' | 'starboard' | 'center';
  direction: 'forward' | 'aft';
}

/**
 * Optimize delivery route for pixie dusting.
 *
 * Strategy based on DCL deck plans:
 * 1. Visit nearest decks first to minimize stairwell/elevator travel
 * 2. Within each deck, walk one corridor side (port or starboard) forward→aft,
 *    then come back on the other side aft→forward — minimizes backtracking
 * 3. Start side is chosen based on which side has the lower first room number
 *    (i.e. the side you'd encounter first walking from the stairwell)
 * 4. Route returns to start stateroom at the end (circular trip)
 */
export function optimizeDeliveryRoute(
  startStateroom: number,
  targetStaterooms: number[]
): RouteStop[] {
  if (targetStaterooms.length === 0) return [];

  const startDeck = getDeck(startStateroom);
  const startSide = getSide(startStateroom);

  // Group targets by deck
  const deckMap = new Map<number, number[]>();
  for (const room of targetStaterooms) {
    const deck = getDeck(room);
    if (!deckMap.has(deck)) deckMap.set(deck, []);
    deckMap.get(deck)!.push(room);
  }

  // Sort decks by distance from start deck (nearest first),
  // break ties by preferring the direction toward start deck's end of ship
  const decks = Array.from(deckMap.keys()).sort(
    (a, b) => Math.abs(a - startDeck) - Math.abs(b - startDeck) || a - b
  );

  const route: RouteStop[] = [];
  let previousDeck = startDeck;
  let walkingForward = true; // start walking forward (ascending room numbers)

  for (const deck of decks) {
    const rooms = deckMap.get(deck)!;

    // Split into port (even) and starboard (odd)
    const portRooms = rooms.filter(r => getSide(r) === 'port');
    const starboardRooms = rooms.filter(r => getSide(r) === 'starboard');

    // Determine walking direction based on travel between decks
    const movingUp = deck >= previousDeck;

    // Choose which side to walk first:
    // On start deck, prefer the side the user's room is on.
    // Otherwise, alternate to create a natural flow.
    let firstSide: 'port' | 'starboard';
    if (deck === startDeck) {
      firstSide = startSide;
    } else {
      // Walk the side with the most rooms first for efficiency
      firstSide = portRooms.length >= starboardRooms.length ? 'port' : 'starboard';
    }

    const firstRooms = firstSide === 'port' ? portRooms : starboardRooms;
    const secondRooms = firstSide === 'port' ? starboardRooms : portRooms;

    // Walk first side forward (ascending), second side back (descending)
    // If moving down between decks, reverse the pattern
    if (movingUp) {
      firstRooms.sort((a, b) => a - b);  // fore → aft
      secondRooms.sort((a, b) => b - a); // aft → fore
    } else {
      firstRooms.sort((a, b) => b - a);  // aft → fore
      secondRooms.sort((a, b) => a - b); // fore → aft
    }

    for (const room of firstRooms) {
      const pos = getRoomPosition(room);
      const prevPos = route.length > 0 ? getRoomPosition(route[route.length - 1].stateroom) : getRoomPosition(startStateroom);
      route.push({
        stateroom: room,
        deck,
        side: getSide(room),
        direction: pos >= prevPos ? 'aft' : 'forward',
      });
    }

    for (const room of secondRooms) {
      const pos = getRoomPosition(room);
      const prevPos = route.length > 0 ? getRoomPosition(route[route.length - 1].stateroom) : getRoomPosition(startStateroom);
      route.push({
        stateroom: room,
        deck,
        side: getSide(room),
        direction: pos >= prevPos ? 'aft' : 'forward',
      });
    }

    walkingForward = !walkingForward;
    previousDeck = deck;
  }

  return route;
}

/**
 * Dispatcher: picks the right algorithm based on ship.
 * Adventure has a multi-zone layout that doesn't fit the serpentine model.
 */
export function optimizeRoute(
  startStateroom: number,
  targetStaterooms: number[],
  shipName?: string
): RouteStop[] {
  if (shipName === 'Disney Adventure') {
    return optimizeAdventureRoute(startStateroom, targetStaterooms);
  }
  return optimizeDeliveryRoute(startStateroom, targetStaterooms);
}
