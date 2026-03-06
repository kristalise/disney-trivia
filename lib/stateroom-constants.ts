import type { BudgetLevel, TravelParty } from './stateroom-types';

export const BUDGET_OPTIONS: { key: BudgetLevel; label: string; emoji: string; types: string[] }[] = [
  { key: 'budget', label: 'Budget', emoji: '🛏', types: ['Inside'] },
  { key: 'reasonable', label: 'Reasonable', emoji: '🪟', types: ['Oceanview', 'Oceanview (Porthole)'] },
  { key: 'splurge', label: 'Splurge', emoji: '🌊', types: ['Verandah'] },
  { key: 'concierge', label: 'Concierge', emoji: '👑', types: ['Concierge / Suite'] },
];

export const TRAVEL_PARTY_OPTIONS: { key: TravelParty; label: string; emoji: string; hint: string }[] = [
  { key: 'solo', label: 'Solo', emoji: '🧳', hint: 'Cozy rooms, social decks' },
  { key: 'couple', label: 'Couple', emoji: '💑', hint: 'Quiet, romantic locations' },
  { key: 'friends', label: 'Friends', emoji: '👯', hint: 'Near pools & nightlife' },
  { key: 'family-kids', label: 'With Kids', emoji: '👨‍👩‍👧', hint: 'Near Oceaneer Club & kids areas' },
  { key: 'family-teens', label: 'With Teens', emoji: '🧑‍🤝‍🧑', hint: 'Near Edge & Vibe teen clubs' },
  { key: 'family-multi', label: 'Multi-gen', emoji: '👴', hint: 'Stable, accessible, midship' },
];

// Kids activity deck map — Oceaneer Club / kids areas (ages 3-12)
export const KIDS_DECKS: Record<string, number[]> = {
  'Disney Magic': [5],
  'Disney Wonder': [5],
  'Disney Dream': [5],
  'Disney Fantasy': [5],
  'Disney Wish': [2],
  'Disney Treasure': [2],
  'Disney Destiny': [2],
  'Disney Adventure': [11],
};

// Teen club deck map — Edge (11-14) & Vibe (14-17) locations
export const TEEN_DECKS: Record<string, number[]> = {
  'Disney Magic': [9, 10],
  'Disney Wonder': [9, 10],
  'Disney Dream': [5, 11],
  'Disney Fantasy': [5, 11],
  'Disney Wish': [2, 3],
  'Disney Treasure': [2, 3],
  'Disney Destiny': [2, 3],
  'Disney Adventure': [11, 12],
};

export const THEME_EMOJI: Record<string, string> = {
  'Aladdin': '🧞',
  'ALADDIN': '🧞',
  'JASMIN': '🧞',
  'Anna Suite': '❄️',
  'ANNA SUITE': '❄️',
  'Bagheera': '🐆',
  'Big Hero 6': '🤖',
  'Brave': '🏹',
  'Briar Rose': '🌹',
  'Cinderella': '👠',
  'Encanto': '🦋',
  'ENCANTO': '🦋',
  'Epcot': '🌐',
  'ELSA SUITE': '❄️',
  'Fantasia': '🌙',
  'Finding Nemo': '🐠',
  'FINDING NEMO': '🐠',
  'Frozen': '❄️',
  'FROZEN': '❄️',
  'Hercules': '⚡',
  'Hercules/Hero Suite': '⚡',
  'Incredibles': '🦸',
  'Incredibles/Incredisuite': '🦸',
  'Iron Man': '🦾',
  'IRONMAN': '🦾',
  'Lion King': '🦁',
  'LION KING': '🦁',
  'Little Mermaid': '🧜‍♀️',
  'LITTLE MERMAID': '🧜‍♀️',
  'Luca': '🌊',
  'MARVEL': '🦸',
  'Moana': '🌺',
  'MOANA': '🌺',
  'Mulan': '⚔️',
  'Pocahontas': '🍂',
  'Princess & The Frog': '🐸',
  'Princess Aurora': '🌹',
  'Rajah': '🐯',
  'Raya': '🐉',
  'Sleeping Beauty': '🌹',
  'SPIDERMAN': '🕷️',
  'Tangled': '🏮',
  'THOR': '🔨',
  'Up': '🎈',
  'UP': '🎈',
};

export function themeWithEmoji(theme: string): string {
  return `${THEME_EMOJI[theme] || '🎨'} ${theme}`;
}

// Franchise IP color mapping for theme pills
export const THEME_COLORS: Record<string, { bg: string; text: string }> = {
  // Frozen
  'Frozen': { bg: 'bg-sky-100 dark:bg-sky-900/40', text: 'text-sky-700 dark:text-sky-300' },
  'FROZEN': { bg: 'bg-sky-100 dark:bg-sky-900/40', text: 'text-sky-700 dark:text-sky-300' },
  'ELSA SUITE': { bg: 'bg-sky-100 dark:bg-sky-900/40', text: 'text-sky-700 dark:text-sky-300' },
  'ANNA SUITE': { bg: 'bg-sky-100 dark:bg-sky-900/40', text: 'text-sky-700 dark:text-sky-300' },
  // Marvel
  'MARVEL': { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300' },
  'IRONMAN': { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300' },
  'Iron Man': { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300' },
  'SPIDERMAN': { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300' },
  'THOR': { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300' },
  'Incredibles': { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300' },
  'Incredibles/Incredisuite': { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300' },
  'Hercules': { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300' },
  'Hercules/Hero Suite': { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300' },
  'Big Hero 6': { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300' },
  // Ocean / tropical
  'Finding Nemo': { bg: 'bg-cyan-100 dark:bg-cyan-900/40', text: 'text-cyan-700 dark:text-cyan-300' },
  'FINDING NEMO': { bg: 'bg-cyan-100 dark:bg-cyan-900/40', text: 'text-cyan-700 dark:text-cyan-300' },
  'Little Mermaid': { bg: 'bg-cyan-100 dark:bg-cyan-900/40', text: 'text-cyan-700 dark:text-cyan-300' },
  'LITTLE MERMAID': { bg: 'bg-cyan-100 dark:bg-cyan-900/40', text: 'text-cyan-700 dark:text-cyan-300' },
  'Moana': { bg: 'bg-teal-100 dark:bg-teal-900/40', text: 'text-teal-700 dark:text-teal-300' },
  'MOANA': { bg: 'bg-teal-100 dark:bg-teal-900/40', text: 'text-teal-700 dark:text-teal-300' },
  'Luca': { bg: 'bg-cyan-100 dark:bg-cyan-900/40', text: 'text-cyan-700 dark:text-cyan-300' },
  // Princess
  'Tangled': { bg: 'bg-violet-100 dark:bg-violet-900/40', text: 'text-violet-700 dark:text-violet-300' },
  'Cinderella': { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300' },
  'Sleeping Beauty': { bg: 'bg-pink-100 dark:bg-pink-900/40', text: 'text-pink-700 dark:text-pink-300' },
  'Princess Aurora': { bg: 'bg-pink-100 dark:bg-pink-900/40', text: 'text-pink-700 dark:text-pink-300' },
  'Briar Rose': { bg: 'bg-pink-100 dark:bg-pink-900/40', text: 'text-pink-700 dark:text-pink-300' },
  'Brave': { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300' },
  'Mulan': { bg: 'bg-rose-100 dark:bg-rose-900/40', text: 'text-rose-700 dark:text-rose-300' },
  'Pocahontas': { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300' },
  'Princess & The Frog': { bg: 'bg-lime-100 dark:bg-lime-900/40', text: 'text-lime-700 dark:text-lime-300' },
  'Raya': { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300' },
  // Aladdin
  'Aladdin': { bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-700 dark:text-indigo-300' },
  'ALADDIN': { bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-700 dark:text-indigo-300' },
  'JASMIN': { bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-700 dark:text-indigo-300' },
  // Encanto
  'Encanto': { bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/40', text: 'text-fuchsia-700 dark:text-fuchsia-300' },
  'ENCANTO': { bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/40', text: 'text-fuchsia-700 dark:text-fuchsia-300' },
  // Lion King / Jungle
  'Lion King': { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300' },
  'LION KING': { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300' },
  'Bagheera': { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300' },
  'Rajah': { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300' },
  // Classic
  'Fantasia': { bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-700 dark:text-indigo-300' },
  'Up': { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-700 dark:text-yellow-300' },
  'UP': { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-700 dark:text-yellow-300' },
  'Epcot': { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-300' },
};

/** SVG x-coordinates for ship sections in deck map visualizations */
export const SECTION_X: Record<string, number> = {
  Forward: 120,
  Midship: 300,
  Aft: 480,
};
