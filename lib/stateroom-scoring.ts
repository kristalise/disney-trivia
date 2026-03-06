import type { ShipName, BudgetLevel, TravelParty, Stateroom, EnrichedRoom, ScoreReason, FilterResult, DeckGroup, TrafficLight, BedCount, VerandahViewType } from './stateroom-types';
import { BUDGET_OPTIONS, KIDS_DECKS, TEEN_DECKS } from './stateroom-constants';
import { getCategoryType, getDeck, getSection, TYPE_EMOJI, roomHasVerandah, getVerandahViewType } from './stateroom-utils';
import stateroomData from '@/data/stateroom-data.json';
import categoryMetadata from '@/data/category-metadata.json';

const data = stateroomData as Record<ShipName, Stateroom[]>;
const catMeta = categoryMetadata as Record<string, Record<string, { name?: string; sqft?: string; sqm?: string }>>;

/** Parse sqft string like "2,461" or "729-1,037" → average numeric value */
function parseSqft(sqftStr: string | undefined): number | null {
  if (!sqftStr) return null;
  const cleaned = sqftStr.replace(/,/g, '');
  if (cleaned.includes('-')) {
    const [lo, hi] = cleaned.split('-').map(Number);
    if (!isNaN(lo) && !isNaN(hi)) return Math.round((lo + hi) / 2);
  }
  const n = Number(cleaned);
  return isNaN(n) ? null : n;
}

/** Parse bedding string into structured counts */
export function countBeds(bedding: string): BedCount {
  const b = bedding.toLowerCase();
  let doubleBeds = 0;
  let singleBeds = 0;
  let hasBunk = false;
  let hasUpperBerth = false;

  // Double-size beds: queen, king, sofa bed (double), full bed (double), double
  const doublePatterns = [
    /(\d+)\s*(?:queen|king)/g,
    /(?:queen|king)/g,
    /sofa\s*bed\s*\(double\)/gi,
    /full\s*bed\s*\(double\)/gi,
    /(\d+)\s*double/g,
    /\bdouble\b/g,
  ];
  // Count queen/king
  const qkMatches = b.match(/\b(queen|king)\b/g);
  if (qkMatches) doubleBeds += qkMatches.length;
  // Count "double" not already captured as part of "(double)"
  const doubleStandalone = b.match(/\bdouble\b/g);
  if (doubleStandalone) {
    // "(double)" as modifier for sofa/full already in the string — count those separately
    const modifierCount = (b.match(/\(double\)/g) || []).length;
    doubleBeds += modifierCount; // sofa bed (double), full bed (double)
    doubleBeds += doubleStandalone.length - modifierCount * 2; // standalone "double" minus the word inside "(double)" and the modifier match
  }
  // Simplify: just re-count properly
  doubleBeds = 0;
  // queen/king count
  doubleBeds += (b.match(/\bqueen\b/g) || []).length;
  doubleBeds += (b.match(/\bking\b/g) || []).length;
  // sofa bed (double) / full bed (double)
  doubleBeds += (b.match(/sofa\s*bed\s*\(double\)/g) || []).length;
  doubleBeds += (b.match(/full\s*bed\s*\(double\)/g) || []).length;
  // standalone "double" (not inside parentheses)
  const allDouble = b.match(/\bdouble\b/g) || [];
  const parenDouble = b.match(/\(double\)/g) || [];
  doubleBeds += allDouble.length - parenDouble.length;

  // Single-size beds
  singleBeds += (b.match(/\bsingle\b/g) || []).length;
  singleBeds += (b.match(/\btwin\b/g) || []).length;
  singleBeds += (b.match(/\bbench\b/g) || []).length;
  singleBeds += (b.match(/\btrundle\b/g) || []).length;
  singleBeds += (b.match(/\bchair\s*bed\b/g) || []).length;
  // wall pull-down (single)
  singleBeds += (b.match(/wall\s*pull-?down\s*\(single\)/g) || []).length;
  // upper berth
  const upperBerthCount = (b.match(/upper\s*berth/g) || []).length;
  singleBeds += upperBerthCount;
  if (upperBerthCount > 0) hasUpperBerth = true;
  // bunk
  const bunkCount = (b.match(/\bbunk\b/g) || []).length;
  singleBeds += bunkCount;
  if (bunkCount > 0) hasBunk = true;

  return {
    doubleBeds,
    singleBeds,
    totalBeds: doubleBeds + singleBeds,
    hasBunk,
    hasUpperBerth,
  };
}

/** Get sqft for a room by looking up category metadata */
export function getRoomSqft(ship: string, category: string | null): number | null {
  if (!category) return null;
  return parseSqft(catMeta[ship]?.[category]?.sqft);
}

/** Assign traffic lights using percentile-based bell curve distribution.
 *  Top ~20% → green, middle ~60% → yellow, bottom ~20% → red.
 *  Rooms with equal scores always get the same color. */
export function assignTrafficLights(rooms: EnrichedRoom[]): void {
  if (rooms.length === 0) return;
  if (rooms.length === 1) {
    rooms[0].trafficLight = 'yellow';
    return;
  }

  // Build a sorted list of unique scores
  const uniqueScores = [...new Set(rooms.map(r => r.score))].sort((a, b) => a - b);
  const n = uniqueScores.length;

  if (n === 1) {
    // All rooms have the same score
    rooms.forEach(r => { r.trafficLight = 'yellow'; });
    return;
  }

  // Map each unique score to a percentile (0 = worst, 1 = best)
  // Then assign traffic light based on that percentile
  const scoreToLight = new Map<number, TrafficLight>();
  for (let i = 0; i < n; i++) {
    const pct = i / (n - 1);
    let light: TrafficLight;
    if (pct >= 0.8) light = 'green';
    else if (pct <= 0.2) light = 'red';
    else light = 'yellow';
    scoreToLight.set(uniqueScores[i], light);
  }

  rooms.forEach(r => {
    r.trafficLight = scoreToLight.get(r.score) || 'yellow';
  });
}

/** Traffic light CSS classes */
export const TRAFFIC_LIGHT_CLASSES: Record<TrafficLight, { bg: string; text: string; ring: string; fill: string }> = {
  green: {
    bg: 'bg-green-100 dark:bg-green-900/40',
    text: 'text-green-700 dark:text-green-400',
    ring: 'ring-green-500',
    fill: 'fill-green-500',
  },
  yellow: {
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'text-amber-700 dark:text-amber-400',
    ring: 'ring-amber-500',
    fill: 'fill-amber-500',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/40',
    text: 'text-red-700 dark:text-red-400',
    ring: 'ring-red-500',
    fill: 'fill-red-500',
  },
};

export const TRAFFIC_LIGHT_LABELS: Record<TrafficLight, string> = {
  green: 'Great Fit',
  yellow: 'Decent',
  red: 'Not Ideal',
};

interface ScoringParams {
  selectedShip: ShipName;
  budgets: BudgetLevel[];
  partySize: number;
  numStaterooms: number;
  travelParty: TravelParty;
  noiseSensitive: boolean;
  needsAccessible: boolean;
  needsConnecting: boolean;
  noBunkBed: boolean;
  elderlyFriendly: boolean;
  childFriendly: boolean;
  requiresVerandah: boolean;
  verandahTypes: VerandahViewType[];
  selectedThemes: string[];
  selectedDecks: number[];
  selectedSections: string[];
}

export function scoreRoom(
  r: {
    deck: number; section: string; occupancy: number | null;
    connecting: string | null; sqft: number | null; bedding: string | null;
    accessible: string | null; type: string; theme?: string | null;
  },
  params: {
    travelParty: TravelParty;
    noiseSensitive: boolean;
    elderlyFriendly: boolean;
    childFriendly: boolean;
    partySize: number;
    numStaterooms: number;
    midDeck: number;
    minDeck: number;
    maxDeck: number;
    lowerDeckThreshold: number;
    kidsDeckList: number[];
    teenDeckList: number[];
  }
): { score: number; reasons: ScoreReason[] } {
  let score = 50;
  const reasons: ScoreReason[] = [];
  const beds = r.bedding ? countBeds(r.bedding) : null;

  // Space per pax scoring (when sqft data is available)
  if (r.sqft != null && params.partySize > 0) {
    const sqftPerPax = r.sqft / params.partySize;
    if (sqftPerPax >= 200) {
      score += 15;
      reasons.push({ label: 'Very Spacious', points: 15, detail: `${Math.round(sqftPerPax)} sqft per guest — very roomy` });
    } else if (sqftPerPax >= 120) {
      score += 10;
      reasons.push({ label: 'Spacious', points: 10, detail: `${Math.round(sqftPerPax)} sqft per guest — comfortable space` });
    } else if (sqftPerPax >= 80) {
      score += 5;
      reasons.push({ label: 'Adequate Space', points: 5, detail: `${Math.round(sqftPerPax)} sqft per guest` });
    }
  }

  // Noise sensitive: prefer midship (gradient)
  if (params.noiseSensitive) {
    if (r.section === 'Midship') {
      score += 20;
      reasons.push({ label: 'Quiet Location', points: 20, detail: 'Midship location for smooth sailing' });
    } else if (r.section === 'Forward') {
      score += 8;
      reasons.push({ label: 'Moderate Noise', points: 8, detail: 'Forward — quieter than aft' });
    }
    // Aft gets +0

    // Prefer middle decks (within 2 of center)
    if (Math.abs(r.deck - params.midDeck) <= 2) {
      score += 15;
      reasons.push({ label: 'Less Motion', points: 15, detail: 'Middle deck reduces felt movement' });
    }
  }

  // Travel party scoring
  const partyPerRoom = Math.ceil(params.partySize / params.numStaterooms);

  if (params.travelParty === 'solo') {
    if (r.occupancy != null && r.occupancy <= 2) {
      score += 10;
      reasons.push({ label: 'Right Size', points: 10, detail: 'Cozy room perfect for solo travelers' });
    }
    if (r.section === 'Midship') {
      score += 10;
      reasons.push({ label: 'Central Access', points: 10, detail: 'Easy access to all ship areas' });
    }
  } else if (params.travelParty === 'family-kids') {
    // Deck proximity gradient for kids areas
    if (params.kidsDeckList.length > 0) {
      const minDist = Math.min(...params.kidsDeckList.map(kd => Math.abs(r.deck - kd)));
      if (minDist === 0) {
        score += 12;
        reasons.push({ label: 'Near Kids Club', points: 12, detail: 'On the kids club deck' });
      } else if (minDist === 1) {
        score += 7;
        reasons.push({ label: 'Near Kids Club', points: 7, detail: 'One deck from kids areas' });
      } else if (minDist === 2) {
        score += 3;
        reasons.push({ label: 'Near Kids Club', points: 3, detail: 'Two decks from kids areas' });
      }
    }
  } else if (params.travelParty === 'family-teens') {
    if (params.teenDeckList.includes(r.deck)) {
      score += 15;
      reasons.push({ label: 'Near Teen Club', points: 15, detail: 'Close to Edge & Vibe teen clubs' });
    }
  } else if (params.travelParty === 'couple') {
    // Couple deck: gradient
    if (params.maxDeck > params.minDeck) {
      const deckPct = (r.deck - params.minDeck) / (params.maxDeck - params.minDeck);
      if (deckPct >= 0.8) {
        score += 10;
        reasons.push({ label: 'High Deck', points: 10, detail: 'Top-tier deck, away from engine noise' });
      } else if (deckPct >= 0.6) {
        score += 7;
        reasons.push({ label: 'Upper Deck', points: 7, detail: 'Higher deck, quieter location' });
      } else if (deckPct >= 0.4) {
        score += 4;
        reasons.push({ label: 'Mid Deck', points: 4, detail: 'Middle deck, balanced location' });
      } else if (deckPct >= 0.2) {
        score += 2;
        reasons.push({ label: 'Lower-Mid Deck', points: 2, detail: 'Lower-middle deck' });
      }
    }
    if (r.section === 'Midship') {
      score += 10;
      reasons.push({ label: 'Quiet Midship', points: 10, detail: 'Peaceful location for couples' });
    }
    // Couple bedding: double + no berth/bunk is best
    if (beds && beds.doubleBeds > 0) {
      if (!beds.hasBunk && !beds.hasUpperBerth) {
        score += 15;
        reasons.push({ label: 'Double Bed', points: 15, detail: 'Queen/king bed, no bunks — ideal for couples' });
      } else {
        score += 10;
        reasons.push({ label: 'Double Bed', points: 10, detail: 'Room has a queen or king bed' });
      }
    } else {
      score += 3;
      reasons.push({ label: 'Basic Bedding', points: 3, detail: 'Standard bedding configuration' });
    }
  } else if (params.travelParty === 'friends') {
    if (r.deck >= params.maxDeck - 2) {
      score += 10;
      reasons.push({ label: 'Near Fun', points: 10, detail: 'Close to pools & entertainment' });
    }
    if (r.connecting && r.connecting.toUpperCase() !== 'NO') {
      score += 10;
      reasons.push({ label: 'Connecting', points: 10, detail: 'Adjacent rooms for your group' });
    }
    // Friends bedding scoring
    if (beds) {
      if (partyPerRoom <= 2) {
        // 2 friends per room
        if (beds.doubleBeds >= 2) {
          score += 15;
          reasons.push({ label: 'Own Beds', points: 15, detail: 'Each gets their own full-size bed' });
        } else if (beds.totalBeds >= 2) {
          score += 10;
          reasons.push({ label: 'Separate Beds', points: 10, detail: 'Room has separate sleeping spots' });
        } else if (r.bedding && /sofa/i.test(r.bedding)) {
          score += 5;
          reasons.push({ label: 'Sofa Bed', points: 5, detail: 'Sofa converts to extra bed' });
        }
      } else {
        // 3+ friends per room
        if (beds.totalBeds >= partyPerRoom) {
          score += 15;
          reasons.push({ label: 'Enough Beds', points: 15, detail: `${beds.totalBeds} beds for ${partyPerRoom} guests` });
        } else if (beds.totalBeds >= partyPerRoom - 1) {
          score += 8;
          reasons.push({ label: 'Nearly Enough', points: 8, detail: `${beds.totalBeds} beds for ${partyPerRoom} guests` });
        }
      }
    }
  } else if (params.travelParty === 'family-multi') {
    if (r.deck <= params.lowerDeckThreshold) {
      score += 10;
      reasons.push({ label: 'Stable Deck', points: 10, detail: 'Lower deck for less ship motion' });
    }
    if (r.section === 'Midship') {
      score += 10;
      reasons.push({ label: 'Midship', points: 10, detail: 'Less motion, comfortable for all ages' });
    }
    if (r.connecting && r.connecting.toUpperCase() !== 'NO') {
      score += 5;
      reasons.push({ label: 'Connecting', points: 5, detail: 'Keep the family close together' });
    }
  }

  // Occupancy fit (gradient instead of exact-only)
  if (r.occupancy != null) {
    const diff = Math.abs(r.occupancy - partyPerRoom);
    if (diff === 0) {
      score += 7;
      reasons.push({ label: 'Perfect Fit', points: 7, detail: 'Occupancy matches your party size exactly' });
    } else if (diff === 1) {
      score += 4;
      reasons.push({ label: 'Good Fit', points: 4, detail: 'Occupancy close to your party size' });
    } else if (diff === 2) {
      score += 2;
      reasons.push({ label: 'Adequate Fit', points: 2, detail: 'Occupancy within range of your party' });
    }
  }

  // Elderly friendly scoring
  if (params.elderlyFriendly) {
    if (r.section === 'Midship') {
      score += 12;
      reasons.push({ label: 'Midship Access', points: 12, detail: 'Easier navigation from midship' });
    }
    // Lower third → +10, mid deck → +5
    const deckRange = params.maxDeck - params.minDeck;
    if (deckRange > 0) {
      const deckPct = (r.deck - params.minDeck) / deckRange;
      if (deckPct <= 0.33) {
        score += 10;
        reasons.push({ label: 'Low Deck', points: 10, detail: 'Lower deck — less walking, stable' });
      } else if (deckPct <= 0.66) {
        score += 5;
        reasons.push({ label: 'Mid Deck', points: 5, detail: 'Middle deck — good balance' });
      }
    }
    // No upper berth bonus
    if (!beds || !beds.hasUpperBerth) {
      score += 8;
      reasons.push({ label: 'Accessible Beds', points: 8, detail: 'All beds accessible — no climbing' });
    }
    // Accessible room bonus
    if (r.accessible && r.accessible !== 'NO') {
      score += 5;
      reasons.push({ label: 'Accessible Room', points: 5, detail: 'Wheelchair accessible stateroom' });
    }
  }

  // Child friendly scoring
  if (params.childFriendly) {
    // Deck proximity to kids areas (gradient)
    if (params.kidsDeckList.length > 0) {
      const minDist = Math.min(...params.kidsDeckList.map(kd => Math.abs(r.deck - kd)));
      if (minDist === 0) {
        score += 12;
        reasons.push({ label: 'Kids Deck', points: 12, detail: 'On the kids activity deck' });
      } else if (minDist === 1) {
        score += 7;
        reasons.push({ label: 'Near Kids', points: 7, detail: 'One deck from kids areas' });
      } else if (minDist === 2) {
        score += 3;
        reasons.push({ label: 'Near-ish Kids', points: 3, detail: 'Two decks from kids areas' });
      }
    }
    // Non-verandah safer for young children
    if (r.type !== 'Verandah') {
      score += 8;
      reasons.push({ label: 'No Balcony', points: 8, detail: 'No balcony — safer for young children' });
    }
    // Themed room
    if (r.theme) {
      score += 5;
      reasons.push({ label: 'Themed Room', points: 5, detail: 'Themed room — fun for kids' });
    }
    // High occupancy
    if (r.occupancy != null && r.occupancy >= 4) {
      score += 5;
      reasons.push({ label: 'Family Size', points: 5, detail: 'Room fits the whole family' });
    }
    // Connecting room
    if (r.connecting && r.connecting.toUpperCase() !== 'NO') {
      score += 4;
      reasons.push({ label: 'Connecting', points: 4, detail: 'Connecting rooms keep family close' });
    }
  }

  return { score, reasons };
}

export function filterAndScore(params: ScoringParams): FilterResult {
  const { selectedShip, budgets, partySize, numStaterooms, travelParty, noiseSensitive, needsAccessible, needsConnecting, noBunkBed, elderlyFriendly, childFriendly, requiresVerandah, verandahTypes, selectedThemes, selectedDecks, selectedSections } = params;

  const shipRooms = data[selectedShip] || [];
  // Combine room types from all selected budget tiers
  const budgetTypes: string[] = [];
  for (const b of budgets) {
    const types = BUDGET_OPTIONS.find(opt => opt.key === b)?.types ?? [];
    for (const t of types) {
      if (!budgetTypes.includes(t)) budgetTypes.push(t);
    }
  }
  const kidsDeckList = KIDS_DECKS[selectedShip] || [];
  const teenDeckList = TEEN_DECKS[selectedShip] || [];

  // Enrich all rooms
  const enriched: EnrichedRoom[] = shipRooms.map(r => {
    const sqft = getRoomSqft(selectedShip, r.category);
    return {
      ...r,
      deck: getDeck(r.stateroom),
      section: getSection(r, shipRooms),
      type: getCategoryType(r.category),
      typeEmoji: TYPE_EMOJI[getCategoryType(r.category)] || '',
      score: 0,
      scoreReasons: [],
      sqft,
      sqftPerPax: sqft != null && partySize > 0 ? Math.round(sqft / partySize) : null,
      trafficLight: 'yellow' as TrafficLight,
    };
  });

  // Hard filter (without deck/section, to derive available options)
  let baseRooms = enriched.filter(r => {
    if (!budgetTypes.includes(r.type)) return false;
    const perRoom = Math.ceil(partySize / numStaterooms);
    if (r.occupancy != null && r.occupancy < perRoom) return false;
    if (needsAccessible && (!r.accessible || r.accessible === 'NO')) return false;
    if (needsConnecting && (!r.connecting || r.connecting === 'NO')) return false;
    if (selectedThemes.length > 0 && (!r.theme || !selectedThemes.includes(r.theme))) return false;
    if (noBunkBed && r.bedding && countBeds(r.bedding).hasBunk) return false;
    // Verandah requirement
    if (requiresVerandah && !roomHasVerandah(selectedShip, r.category, r.verandahPartitions)) return false;
    // Verandah view type filter (Disney Adventure only, multi-select)
    // "garden" includes "garden-stage" rooms
    if (verandahTypes.length > 0) {
      const vt = getVerandahViewType(selectedShip, r.category);
      if (!vt) return false;
      const match = verandahTypes.includes(vt) || (vt === 'garden-stage' && verandahTypes.includes('garden'));
      if (!match) return false;
    }
    return true;
  });

  // Derive available deck/section options from base results
  const deckSet = new Set(baseRooms.map(r => r.deck));
  const sectionSet = new Set(baseRooms.map(r => r.section));
  const sortedDecks = Array.from(deckSet).sort((a, b) => a - b);
  const sortedSections = ['Forward', 'Midship', 'Aft'].filter(s => sectionSet.has(s));

  // Apply deck/section filters (multi-select)
  let rooms = baseRooms;
  if (selectedDecks.length > 0) {
    rooms = rooms.filter(r => selectedDecks.includes(r.deck));
  }
  if (selectedSections.length > 0) {
    rooms = rooms.filter(r => selectedSections.includes(r.section));
  }

  // Compute deck range for scoring
  const allDecks = rooms.map(r => r.deck).filter(d => d > 0);
  const minDeck = Math.min(...allDecks, 1);
  const maxDeck = Math.max(...allDecks, 1);
  const midDeck = (minDeck + maxDeck) / 2;
  const lowerDeckThreshold = minDeck + Math.floor((maxDeck - minDeck) / 3);

  // Score each room
  rooms = rooms.map(r => {
    const { score, reasons } = scoreRoom(r, {
      travelParty,
      noiseSensitive,
      elderlyFriendly,
      childFriendly,
      partySize,
      numStaterooms,
      midDeck,
      minDeck,
      maxDeck,
      lowerDeckThreshold,
      kidsDeckList,
      teenDeckList,
    });
    return { ...r, score, scoreReasons: reasons, trafficLight: 'yellow' as TrafficLight };
  });

  // Assign traffic lights using bell curve distribution
  assignTrafficLights(rooms);

  // Sort by score desc, deck asc, room number asc
  rooms.sort((a, b) => b.score - a.score || a.deck - b.deck || a.stateroom - b.stateroom);

  // Group by deck
  const deckMap = new Map<number, EnrichedRoom[]>();
  for (const r of rooms) {
    const arr = deckMap.get(r.deck) || [];
    arr.push(r);
    deckMap.set(r.deck, arr);
  }
  const deckGroups: DeckGroup[] = Array.from(deckMap.entries())
    .map(([deck, dRooms]) => ({
      deck,
      rooms: dRooms,
      topScore: Math.max(...dRooms.map(r => r.score)),
    }))
    .sort((a, b) => b.topScore - a.topScore || a.deck - b.deck);

  return { filtered: rooms, deckGroups, availableDecks: sortedDecks, availableSections: sortedSections };
}

/** Score a specific set of rooms (for the compare feature) */
export function scoreCompareRooms(
  roomNumbers: number[],
  params: Omit<ScoringParams, 'selectedDecks' | 'selectedSections' | 'requiresVerandah' | 'verandahTypes'>
): EnrichedRoom[] {
  const { selectedShip, partySize, numStaterooms, travelParty, noiseSensitive, elderlyFriendly, childFriendly } = params;
  const shipRooms = data[selectedShip] || [];
  const kidsDeckList = KIDS_DECKS[selectedShip] || [];
  const teenDeckList = TEEN_DECKS[selectedShip] || [];

  const matching = shipRooms.filter(r => roomNumbers.includes(r.stateroom));

  const enriched: EnrichedRoom[] = matching.map(r => {
    const sqft = getRoomSqft(selectedShip, r.category);
    return {
      ...r,
      deck: getDeck(r.stateroom),
      section: getSection(r, shipRooms),
      type: getCategoryType(r.category),
      typeEmoji: TYPE_EMOJI[getCategoryType(r.category)] || '',
      score: 0,
      scoreReasons: [],
      sqft,
      sqftPerPax: sqft != null && partySize > 0 ? Math.round(sqft / partySize) : null,
      trafficLight: 'yellow' as TrafficLight,
    };
  });

  // Compute deck range
  const allDecks = enriched.map(r => r.deck).filter(d => d > 0);
  const minDeck = Math.min(...allDecks, 1);
  const maxDeck = Math.max(...allDecks, 1);
  const midDeck = (minDeck + maxDeck) / 2;
  const lowerDeckThreshold = minDeck + Math.floor((maxDeck - minDeck) / 3);

  const scored = enriched.map(r => {
    const { score, reasons } = scoreRoom(r, {
      travelParty,
      noiseSensitive,
      elderlyFriendly,
      childFriendly,
      partySize,
      numStaterooms,
      midDeck,
      minDeck,
      maxDeck,
      lowerDeckThreshold,
      kidsDeckList,
      teenDeckList,
    });
    return { ...r, score, scoreReasons: reasons, trafficLight: 'yellow' as TrafficLight };
  });

  // Assign traffic lights using bell curve distribution
  assignTrafficLights(scored);

  return scored.sort((a, b) => b.score - a.score || a.deck - b.deck || a.stateroom - b.stateroom);
}
