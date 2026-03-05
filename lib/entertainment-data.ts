import entertainmentData from '@/data/entertainment-data.json';
import { sortShips } from './ship-order';

// --- Types ---

export interface Experience {
  id: string;
  name: string;
  types: string[];
  ships: string[];
  ip: string;
  description: string;
  status: 'current' | 'historical';
  deckByShip: Record<string, { deck: string | null; section: string | null }> | null;
}

export interface ExperienceCategory {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

// --- Raw data ---

const categories = entertainmentData.categories as ExperienceCategory[];
const experiences = (entertainmentData.experiences as Experience[]).map(e => ({ ...e, ships: sortShips(e.ships) }));
const ips = entertainmentData.ips as string[];

// --- Indexes (built once) ---

const experienceById = new Map<string, Experience>();
for (const e of experiences) {
  experienceById.set(e.id, e);
}

// --- Accessor functions ---

/** All experience categories */
export function getEntertainmentCategories(): ExperienceCategory[] {
  return categories;
}

/** All IP/franchise names */
export function getAllIps(): string[] {
  return ips;
}

/** Single experience by ID */
export function getExperienceById(id: string): Experience | undefined {
  return experienceById.get(id);
}

/** All experiences */
export function getAllExperiences(): Experience[] {
  return experiences;
}

/** Experiences filtered by type/category */
export function getExperiencesByType(typeId: string): Experience[] {
  return experiences.filter(e => e.types.includes(typeId));
}

/** Experiences available on a specific ship */
export function getExperiencesByShip(shipName: string): Experience[] {
  return experiences.filter(e => e.ships.includes(shipName));
}

/** Experiences by IP/franchise */
export function getExperiencesByIp(ip: string): Experience[] {
  return experiences.filter(e => e.ip === ip);
}

/** Total number of unique experiences */
export function getTotalExperienceCount(): number {
  return experienceById.size;
}
