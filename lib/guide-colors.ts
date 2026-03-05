// Shared category color definitions used across all guide pages.
// Each color key maps to pill styling (for filter tabs & inline badges)
// and card border styling (left accent border on cards).

export interface CategoryColorStyle {
  pill: string;
  card: string;
}

export const CATEGORY_COLORS: Record<string, CategoryColorStyle> = {
  blue:    { pill: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',       card: 'border-l-blue-400' },
  sky:     { pill: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',            card: 'border-l-sky-400' },
  indigo:  { pill: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300', card: 'border-l-indigo-400' },
  violet:  { pill: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', card: 'border-l-violet-400' },
  purple:  { pill: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', card: 'border-l-purple-400' },
  pink:    { pill: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',       card: 'border-l-pink-400' },
  rose:    { pill: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',       card: 'border-l-rose-400' },
  fuchsia: { pill: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300', card: 'border-l-fuchsia-400' },
  amber:   { pill: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',   card: 'border-l-amber-400' },
  orange:  { pill: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', card: 'border-l-orange-400' },
  emerald: { pill: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', card: 'border-l-emerald-400' },
  green:   { pill: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',   card: 'border-l-green-400' },
  teal:    { pill: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',       card: 'border-l-teal-400' },
  cyan:    { pill: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',       card: 'border-l-cyan-400' },
};

// Default fallback
const DEFAULT_COLOR: CategoryColorStyle = CATEGORY_COLORS.blue;

/** Look up a category color by key. Returns blue as fallback. */
export function getCategoryColor(colorKey: string): CategoryColorStyle {
  return CATEGORY_COLORS[colorKey] ?? DEFAULT_COLOR;
}
