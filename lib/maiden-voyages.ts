const MAIDEN_VOYAGE_DATES: Record<string, string> = {
  'Disney Magic': '1998-07-30',
  'Disney Wonder': '1999-08-15',
  'Disney Dream': '2011-01-26',
  'Disney Fantasy': '2012-03-31',
  'Disney Wish': '2022-07-14',
  'Disney Treasure': '2024-12-21',
  'Disney Destiny': '2025-11-20',
  'Disney Adventure': '2026-03-10',
};

export function isMaidenVoyage(shipName: string, sailStartDate: string): boolean {
  return MAIDEN_VOYAGE_DATES[shipName] === sailStartDate;
}

export function countMaidenVoyages(sailings: Array<{ ship_name: string; sail_start_date: string }>): number {
  return sailings.filter(s => isMaidenVoyage(s.ship_name, s.sail_start_date)).length;
}

export function getMaidenVoyageShips(sailings: Array<{ ship_name: string; sail_start_date: string }>): string[] {
  const ships = new Set<string>();
  for (const s of sailings) {
    if (isMaidenVoyage(s.ship_name, s.sail_start_date)) {
      ships.add(s.ship_name);
    }
  }
  return Array.from(ships);
}
