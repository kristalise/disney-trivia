import characterData from '@/data/character-data.json';

// --- Types ---

export interface Character {
  id: string;
  name: string;
}

export interface SubCategory {
  id: string;
  label: string;
  characters: Character[];
}

export interface Category {
  id: string;
  label: string;
  emoji: string;
  color: string;
  subcategories: SubCategory[];
}

// --- Raw data ---

const categories = characterData.categories as Category[];

// --- Indexes (built once) ---

const characterById = new Map<string, Character>();
for (const cat of categories) {
  for (const sub of cat.subcategories) {
    for (const ch of sub.characters) {
      characterById.set(ch.id, ch);
    }
  }
}

// --- Accessor functions ---

/** All character categories */
export function getCharacterCategories(): Category[] {
  return categories;
}

/** Single character by ID */
export function getCharacterById(id: string): Character | undefined {
  return characterById.get(id);
}

/** Total number of unique characters */
export function getTotalCharacterCount(): number {
  return characterById.size;
}

/** All character IDs */
export function getAllCharacterIds(): string[] {
  return Array.from(characterById.keys());
}

/** All unique characters (deduplicated) */
export function getAllCharacters(): Character[] {
  return Array.from(characterById.values());
}
