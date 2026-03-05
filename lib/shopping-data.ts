import shoppingData from '@/data/shopping-data.json';
import { sortShips } from './ship-order';

// --- Types ---

export interface Shop {
  id: string;
  name: string;
  category: string;
  description: string;
  ships: string[];
  ip: string | null;
  status: 'current' | 'historical';
  deckByShip: Record<string, { deck: string | null; section: string | null }> | null;
}

export interface ShopCategory {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

// --- Raw data ---

const categories = shoppingData.categories as ShopCategory[];
const shops = (shoppingData.shops as Shop[]).map(s => ({ ...s, ships: sortShips(s.ships) }));

// --- Indexes (built once) ---

const shopById = new Map<string, Shop>();
for (const s of shops) {
  shopById.set(s.id, s);
}

// --- Accessor functions ---

/** All shop categories */
export function getShopCategories(): ShopCategory[] {
  return categories;
}

/** Single shop by ID */
export function getShopById(id: string): Shop | undefined {
  return shopById.get(id);
}

/** All shops */
export function getAllShops(): Shop[] {
  return shops;
}

/** Shops filtered by category */
export function getShopsByCategory(categoryId: string): Shop[] {
  return shops.filter(s => s.category === categoryId);
}

/** Shops available on a specific ship */
export function getShopsByShip(shipName: string): Shop[] {
  return shops.filter(s => s.ships.includes(shipName));
}

/** Total number of unique shops */
export function getTotalShopCount(): number {
  return shopById.size;
}
