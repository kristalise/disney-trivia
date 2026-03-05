import thingsToDoData from '@/data/things-to-do-data.json';
import { sortShips } from './ship-order';

// --- Types ---

export interface Activity {
  id: string;
  name: string;
  category: string;
  description: string;
  ships: string[];
  ageGroup: string;
  heightReq: string | null;
  ip: string | null;
  seasonal: string | null;
  status: 'current' | 'historical';
  deckByShip: Record<string, { deck: string | null; section: string | null }> | null;
}

export interface ActivityCategory {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

export interface AgeGroup {
  id: string;
  label: string;
}

// --- Raw data ---

const categories = thingsToDoData.categories as ActivityCategory[];
const activities = (thingsToDoData.activities as Activity[]).map(a => ({ ...a, ships: sortShips(a.ships) }));
const ageGroups = thingsToDoData.ageGroups as AgeGroup[];

// --- Indexes (built once) ---

const activityById = new Map<string, Activity>();
for (const a of activities) {
  activityById.set(a.id, a);
}

// --- Accessor functions ---

/** All activity categories */
export function getActivityCategories(): ActivityCategory[] {
  return categories;
}

/** All age groups */
export function getAgeGroups(): AgeGroup[] {
  return ageGroups;
}

/** Single activity by ID */
export function getActivityById(id: string): Activity | undefined {
  return activityById.get(id);
}

/** All activities */
export function getAllActivities(): Activity[] {
  return activities;
}

/** Activities filtered by category */
export function getActivitiesByCategory(categoryId: string): Activity[] {
  return activities.filter(a => a.category === categoryId);
}

/** Activities available on a specific ship */
export function getActivitiesByShip(shipName: string): Activity[] {
  return activities.filter(a => a.ships.includes(shipName));
}

/** Activities filtered by age group */
export function getActivitiesByAgeGroup(ageGroupId: string): Activity[] {
  return activities.filter(a => a.ageGroup === ageGroupId);
}

/** Total number of unique activities */
export function getTotalActivityCount(): number {
  return activityById.size;
}
