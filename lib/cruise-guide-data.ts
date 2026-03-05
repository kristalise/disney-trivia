import { getAllFoodieVenues, getFoodieCategories, type FoodieVenue } from './foodie-data';
import { getAllExperiences, getEntertainmentCategories, type Experience } from './entertainment-data';
import { getAllActivities, getActivityCategories, type Activity } from './things-to-do-data';
import { getAllShops, getShopCategories, type Shop } from './shopping-data';
import { SHIP_ORDER, sortShips } from './ship-order';

export { SHIP_ORDER, sortShips };

// --- Unified item type for the Cruise Guide ---

export type GuideSource = 'dining' | 'entertainment' | 'activity' | 'shopping';

export interface CruiseGuideItem {
  id: string;
  name: string;
  description: string;
  ships: string[];
  status: 'current' | 'historical';
  categories: string[];         // unified category keys (multi-category)
  source: GuideSource;          // which guide data this came from
  sourceId: string;             // original ID in source data
  plannerItemType: string;      // item_type for planner API
  guidePath: string;            // link to the guide's browse page
  ip: string | null;
  price: string | null;
  access: string | null;
  deckByShip: Record<string, { deck: string | null; section: string | null }> | null;
  tags: string[];               // extra badges (exclusive, seasonal, height, age, etc.)
  exclusive: boolean;
  seasonal: string | null;
  ageGroup: string | null;
}

export interface GuideCategory {
  key: string;
  label: string;
  emoji: string;
  color: string;  // key into shared CATEGORY_COLORS from guide-colors.ts
}

// --- Disney official category structure ---

export const GUIDE_CATEGORIES: GuideCategory[] = [
  { key: 'dining',      label: 'Dining',                      emoji: '🍽️',  color: 'orange' },
  { key: 'character',   label: 'Character Experiences',        emoji: '🤝',  color: 'pink' },
  { key: 'shows',       label: 'Live Shows & Entertainment',   emoji: '🎭',  color: 'indigo' },
  { key: 'deck-party',  label: 'Deck Parties',                 emoji: '🎉',  color: 'amber' },
  { key: 'nightclubs',  label: 'Nightclubs & Lounges',         emoji: '🍸',  color: 'violet' },
  { key: 'pools',       label: 'Pools & Water',                emoji: '🏊',  color: 'sky' },
  { key: 'recreation',  label: 'Sports & Recreation',          emoji: '🏃',  color: 'emerald' },
  { key: 'youth-clubs', label: 'Youth Clubs',                  emoji: '🧒',  color: 'green' },
  { key: 'spa',         label: 'Spa & Salon',                  emoji: '💆',  color: 'rose' },
  { key: 'shops',       label: 'Shops & Retail',               emoji: '🛍️',  color: 'fuchsia' },
];

// Build label lookup
const CATEGORY_LABEL_MAP = new Map(GUIDE_CATEGORIES.map(c => [c.key, c]));

// --- Category mapping from source categories to unified (multi-category) ---

const FOODIE_CAT_MAP: Record<string, string[]> = {
  'rotational':    ['dining'],
  'quick-service': ['dining'],
  'specialty':     ['dining'],
  'bars-lounges':  ['nightclubs'],
  'tea-character': ['dining'],
};

const ENTERTAINMENT_CAT_MAP: Record<string, string> = {
  'character-experiences': 'character',
  'live-shows': 'shows',
  'deck-parties': 'deck-party',
  'nightclub-lounges': 'nightclubs',
};

const ACTIVITY_CAT_MAP: Record<string, string[]> = {
  'pools':       ['pools', 'recreation'],
  'water-rides': ['pools', 'recreation'],
  'rides':       ['recreation'],
  'sports':      ['recreation'],
  'fitness':     ['spa', 'recreation'],
  'youth-clubs': ['youth-clubs'],
};

// --- Manual multi-category overrides by item ID ---
// Based on Disney's official onboard activities list

const MULTI_CAT_OVERRIDES: Record<string, string[]> = {
  // Youth clubs with character experiences
  'activity:disneys-oceaneer-club-activity': ['character', 'youth-clubs'],
  'activity:disneys-oceaneer-lab-activity':  ['character', 'youth-clubs'],
  // Edge is Sports & Recreation + Youth Clubs
  'activity:edge':                           ['recreation', 'youth-clubs'],
  // Infinity Bar is Nightclubs & Lounges + Pools
  'dining:infinity-bar':                     ['nightclubs', 'pools'],
  // Shops that are also dining
  'dining:edna-sweets':                      ['dining', 'shops'],
  'dining:joyful-sweets':                    ['dining', 'shops'],
  'dining:jumbeaux-sweets':                  ['dining', 'shops'],
};

// --- Build unified items (once at module load) ---

function buildItems(): CruiseGuideItem[] {
  const items: CruiseGuideItem[] = [];

  // 1. Foodie venues → dining / nightclubs (+ character / shows from flags)
  for (const v of getAllFoodieVenues()) {
    const baseCats = FOODIE_CAT_MAP[v.category] ?? ['dining'];
    const cats = [...baseCats];

    // Character dining = character meeting (per official guide)
    if (v.characterExperience && !cats.includes('character')) {
      cats.push('character');
    }
    // Live entertainment adds "shows"
    if (v.liveEntertainment && !cats.includes('shows')) {
      cats.push('shows');
    }

    const itemId = `dining:${v.id}`;
    // Apply manual overrides
    const finalCats = MULTI_CAT_OVERRIDES[itemId] ?? cats;

    items.push({
      id: itemId,
      name: v.name,
      description: v.description,
      ships: sortShips(v.ships),
      status: v.status,
      categories: finalCats,
      source: 'dining',
      sourceId: v.id,
      plannerItemType: 'dining',
      guidePath: `/Secret-menU/foodies/${v.id}`,
      ip: v.theme || null,
      price: v.price,
      access: v.access,
      deckByShip: v.deckByShip,
      tags: [],
      exclusive: v.exclusive,
      seasonal: null,
      ageGroup: null,
    });
  }

  // 2. Entertainment experiences → map ALL types to categories
  for (const e of getAllExperiences()) {
    const cats: string[] = [];
    for (const t of e.types) {
      const mapped = ENTERTAINMENT_CAT_MAP[t];
      if (mapped && !cats.includes(mapped)) {
        cats.push(mapped);
      }
    }
    if (cats.length === 0) cats.push('shows'); // fallback

    const itemId = `entertainment:${e.id}`;
    const finalCats = MULTI_CAT_OVERRIDES[itemId] ?? cats;

    items.push({
      id: itemId,
      name: e.name,
      description: e.description,
      ships: sortShips(e.ships),
      status: e.status,
      categories: finalCats,
      source: 'entertainment',
      sourceId: e.id,
      plannerItemType: 'activity',
      guidePath: '/Secret-menU/entertainment',
      ip: e.ip || null,
      price: null,
      access: null,
      deckByShip: e.deckByShip,
      tags: [],
      exclusive: false,
      seasonal: null,
      ageGroup: null,
    });
  }

  // 3. Activities → multi-category from map
  for (const a of getAllActivities()) {
    const baseCats = ACTIVITY_CAT_MAP[a.category] ?? ['recreation'];

    const itemId = `activity:${a.id}`;
    const finalCats = MULTI_CAT_OVERRIDES[itemId] ?? baseCats;

    items.push({
      id: itemId,
      name: a.name,
      description: a.description,
      ships: sortShips(a.ships),
      status: a.status,
      categories: finalCats,
      source: 'activity',
      sourceId: a.id,
      plannerItemType: 'activity',
      guidePath: '/Secret-menU/things-to-do',
      ip: a.ip,
      price: null,
      access: null,
      deckByShip: a.deckByShip,
      tags: [],
      exclusive: false,
      seasonal: a.seasonal,
      ageGroup: a.ageGroup !== 'all' ? a.ageGroup : null,
    });
  }

  // 4. Shopping → shops
  for (const s of getAllShops()) {
    const itemId = `shopping:${s.id}`;
    const finalCats = MULTI_CAT_OVERRIDES[itemId] ?? ['shops'];

    items.push({
      id: itemId,
      name: s.name,
      description: s.description,
      ships: sortShips(s.ships),
      status: s.status,
      categories: finalCats,
      source: 'shopping',
      sourceId: s.id,
      plannerItemType: 'venue',
      guidePath: '/Secret-menU/shopping',
      ip: s.ip,
      price: null,
      access: null,
      deckByShip: s.deckByShip,
      tags: [],
      exclusive: false,
      seasonal: null,
      ageGroup: null,
    });
  }

  // Sort alphabetically by default
  items.sort((a, b) => a.name.localeCompare(b.name));
  return items;
}

const allItems = buildItems();

const itemById = new Map<string, CruiseGuideItem>();
for (const item of allItems) {
  itemById.set(item.id, item);
}

// --- Derived filter lists (built once) ---

const allIps: string[] = (() => {
  const set = new Set<string>();
  for (const item of allItems) {
    if (item.ip) set.add(item.ip);
  }
  return [...set].sort();
})();

const allAgeGroups: string[] = (() => {
  const set = new Set<string>();
  for (const item of allItems) {
    if (item.ageGroup) set.add(item.ageGroup);
  }
  return [...set].sort();
})();

const allSeasonals: string[] = (() => {
  const set = new Set<string>();
  for (const item of allItems) {
    if (item.seasonal) set.add(item.seasonal);
  }
  return [...set].sort();
})();

// --- Accessor functions ---

export function getAllCruiseGuideItems(): CruiseGuideItem[] {
  return allItems;
}

export function getCruiseGuideItem(id: string): CruiseGuideItem | undefined {
  return itemById.get(id);
}

export function getCruiseGuideCategories(): GuideCategory[] {
  return GUIDE_CATEGORIES;
}

export function getCruiseGuideItemsByCategory(categoryKey: string): CruiseGuideItem[] {
  return allItems.filter(i => i.categories.includes(categoryKey));
}

export function getCruiseGuideItemsByShip(shipName: string): CruiseGuideItem[] {
  return allItems.filter(i => i.ships.includes(shipName));
}

export function getTotalCruiseGuideCount(): number {
  return allItems.length;
}

export function getCategoryLabel(key: string): GuideCategory | undefined {
  return CATEGORY_LABEL_MAP.get(key);
}

export function getAllGuideIps(): string[] {
  return allIps;
}

export function getAllGuideAgeGroups(): string[] {
  return allAgeGroups;
}

export function getAllGuideSeasonals(): string[] {
  return allSeasonals;
}
