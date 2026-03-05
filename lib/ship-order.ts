// Canonical ship order used across all pages and data modules.

export const SHIP_ORDER: string[] = [
  'Disney Magic', 'Disney Wonder', 'Disney Dream', 'Disney Fantasy',
  'Disney Wish', 'Disney Treasure', 'Disney Destiny', 'Disney Adventure',
];

const shipIndex = new Map(SHIP_ORDER.map((s, i) => [s, i]));

/** Sort a ships array into canonical order */
export function sortShips(ships: string[]): string[] {
  return [...ships].sort((a, b) => (shipIndex.get(a) ?? 99) - (shipIndex.get(b) ?? 99));
}
