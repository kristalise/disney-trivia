import foodieData from '@/data/foodie-data.json';
import { sortShips } from './ship-order';

// --- Types ---

export interface FoodieVenue {
  id: string;
  name: string;
  category: string;
  theme: string;
  description: string;
  ships: string[];
  status: 'current' | 'historical';
  years: string;
  price: string | null;
  access: string | null;
  exclusive: boolean;
  deckByShip: Record<string, { deck: string | null; section: string | null }> | null;
  characterExperience: boolean;
  liveEntertainment: boolean;
  subVenues: string[] | null;
}

export interface FoodieCategory {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

// --- Raw data ---

const categories = foodieData.categories as FoodieCategory[];
const venues = (foodieData.venues as FoodieVenue[]).map(v => ({ ...v, ships: sortShips(v.ships) }));
const adventureRotations = foodieData.adventureRotations as Record<string, string[]>;

// --- Indexes (built once) ---

const venueById = new Map<string, FoodieVenue>();
for (const v of venues) {
  venueById.set(v.id, v);
}

// --- Accessor functions ---

/** All foodie categories */
export function getFoodieCategories(): FoodieCategory[] {
  return categories;
}

/** Single venue by ID */
export function getFoodieVenueById(id: string): FoodieVenue | undefined {
  return venueById.get(id);
}

/** All foodie venues */
export function getAllFoodieVenues(): FoodieVenue[] {
  return venues;
}

/** Venues filtered by category */
export function getVenuesByCategory(categoryId: string): FoodieVenue[] {
  return venues.filter(v => v.category === categoryId);
}

/** Venues available on a specific ship */
export function getVenuesByShip(shipName: string): FoodieVenue[] {
  return venues.filter(v => v.ships.includes(shipName));
}

/** Total number of unique venues */
export function getTotalFoodieCount(): number {
  return venueById.size;
}

/** Get venue IDs for an Adventure rotation (1 or 2) */
export function getAdventureRotation(rotationNum: number): string[] {
  return adventureRotations[String(rotationNum)] ?? [];
}
