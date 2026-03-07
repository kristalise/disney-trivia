'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import SearchAutocomplete from '@/components/SearchAutocomplete';
import { getFoodieCategories, getAllFoodieVenues, getTotalFoodieCount, type FoodieCategory, type FoodieVenue } from '@/lib/foodie-data';
import { CATEGORY_COLORS } from '@/lib/guide-colors';
import FilterDrawer from '@/components/FilterDrawer';

const categories = getFoodieCategories();
const allVenues = getAllFoodieVenues();
const totalCount = getTotalFoodieCount();

const SHIPS = [
  'Disney Magic', 'Disney Wonder', 'Disney Dream', 'Disney Fantasy',
  'Disney Wish', 'Disney Treasure', 'Disney Destiny', 'Disney Adventure',
];

const categoryColors = CATEGORY_COLORS;

const foodieSuggestions = [...new Set(allVenues.map(v => v.name))];

export default function FoodieGuidePage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedShips, setSelectedShips] = useState<string[]>([]);
  const [showHistorical, setShowHistorical] = useState(false);
  const [filterPaid, setFilterPaid] = useState(false);
  const [filterAdult, setFilterAdult] = useState(false);
  const [filterKids, setFilterKids] = useState(false);
  const [sortMode, setSortMode] = useState<'default' | 'alpha'>('default');

  const filtered = useMemo(() => {
    let results = allVenues;

    // Filter by status
    if (!showHistorical) {
      results = results.filter(v => v.status === 'current');
    }

    // Filter by category
    if (selectedCategory) {
      results = results.filter(v => v.category === selectedCategory);
    }

    // Filter by ships (venue must be on ALL selected ships)
    if (selectedShips.length > 0) {
      results = results.filter(v => selectedShips.every(s => v.ships.includes(s)));
    }

    // Filter by paid dining
    if (filterPaid) {
      results = results.filter(v => v.price !== null);
    }

    // Filter by adult only
    if (filterAdult) {
      results = results.filter(v => v.access?.includes('Adults'));
    }

    // Filter by ages 3-12
    if (filterKids) {
      results = results.filter(v => v.access?.includes('3-12'));
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.theme.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q)
      );
    }

    return results;
  }, [search, selectedCategory, selectedShips, showHistorical, filterPaid, filterAdult, filterKids]);

  // Group by category for display
  const grouped = useMemo(() => {
    const groups: Record<string, FoodieVenue[]> = {};
    for (const v of filtered) {
      if (!groups[v.category]) groups[v.category] = [];
      groups[v.category].push(v);
    }
    return groups;
  }, [filtered]);

  const categoryMap = useMemo(() => {
    return Object.fromEntries(categories.map(c => [c.id, c]));
  }, []);

  // Base filtered by everything EXCEPT category (for dynamic pill counts)
  const filteredExceptCategory = useMemo(() => {
    let results = allVenues;
    if (!showHistorical) results = results.filter(v => v.status === 'current');
    if (selectedShips.length > 0) results = results.filter(v => selectedShips.every(s => v.ships.includes(s)));
    if (filterPaid) results = results.filter(v => v.price !== null);
    if (filterAdult) results = results.filter(v => v.access?.includes('Adults'));
    if (filterKids) results = results.filter(v => v.access?.includes('3-12'));
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.theme.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q)
      );
    }
    return results;
  }, [search, selectedShips, showHistorical, filterPaid, filterAdult, filterKids]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory) count++;
    if (selectedShips.length > 0) count += selectedShips.length;
    if (filterPaid) count++;
    if (filterAdult) count++;
    if (filterKids) count++;
    if (showHistorical) count++;
    if (sortMode !== 'default') count++;
    return count;
  }, [selectedCategory, selectedShips, filterPaid, filterAdult, filterKids, showHistorical, sortMode]);

  const clearAllFilters = () => {
    setSelectedCategory(null);
    setSelectedShips([]);
    setFilterPaid(false);
    setFilterAdult(false);
    setFilterKids(false);
    setShowHistorical(false);
    setSortMode('default');
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/Secret-menU"
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Cruise Guide
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
          🍽️ Foodie Guide
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Explore every dining option across the fleet — {totalCount} venues
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchAutocomplete
          id="foodies-search"
          suggestions={foodieSuggestions}
          value={search}
          onChange={setSearch}
          placeholder="Search restaurants, bars, themes..."
        />
      </div>

      <FilterDrawer activeCount={activeFilterCount} onClear={clearAllFilters}>
      {/* Category filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedCategory(null)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            selectedCategory === null
              ? 'bg-disney-blue text-white dark:bg-disney-gold dark:text-slate-900'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
        >
          All ({filteredExceptCategory.length})
        </button>
        {categories.map(cat => {
          const count = filteredExceptCategory.filter(v => v.category === cat.id).length;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-disney-blue text-white dark:bg-disney-gold dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {cat.emoji} {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Ship pills (multi-select) */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
        {SHIPS.map(ship => {
          const isSelected = selectedShips.includes(ship);
          return (
            <button
              key={ship}
              type="button"
              onClick={() => setSelectedShips(prev =>
                isSelected ? prev.filter(s => s !== ship) : [...prev, ship]
              )}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap ${
                isSelected
                  ? 'bg-disney-blue text-white dark:bg-disney-gold dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {ship.replace('Disney ', '')}
            </button>
          );
        })}
      </div>

      {/* Sort + Toggle filters */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-slate-500 dark:text-slate-400">Sort:</span>
        <button
          type="button"
          onClick={() => setSortMode('default')}
          className={`px-2 py-1 rounded-full text-[11px] font-medium transition-colors ${
            sortMode === 'default'
              ? 'bg-disney-blue text-white dark:bg-disney-gold dark:text-slate-900'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
          }`}
        >
          Category
        </button>
        <button
          type="button"
          onClick={() => setSortMode('alpha')}
          className={`px-2 py-1 rounded-full text-[11px] font-medium transition-colors ${
            sortMode === 'alpha'
              ? 'bg-disney-blue text-white dark:bg-disney-gold dark:text-slate-900'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
          }`}
        >
          A-Z
        </button>
      </div>

      {/* Toggle filters */}
      <div className="flex items-center gap-4 flex-wrap mb-6">
        <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer whitespace-nowrap">
          <input
            type="checkbox"
            checked={filterPaid}
            onChange={e => setFilterPaid(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-600 text-disney-blue dark:text-disney-gold focus:ring-disney-blue dark:focus:ring-disney-gold"
          />
          Paid dining
        </label>
        <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer whitespace-nowrap">
          <input
            type="checkbox"
            checked={filterAdult}
            onChange={e => setFilterAdult(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-600 text-disney-blue dark:text-disney-gold focus:ring-disney-blue dark:focus:ring-disney-gold"
          />
          Adult only
        </label>
        <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer whitespace-nowrap">
          <input
            type="checkbox"
            checked={filterKids}
            onChange={e => setFilterKids(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-600 text-disney-blue dark:text-disney-gold focus:ring-disney-blue dark:focus:ring-disney-gold"
          />
          Ages 3-12
        </label>
        <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer whitespace-nowrap">
          <input
            type="checkbox"
            checked={showHistorical}
            onChange={e => setShowHistorical(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-600 text-disney-blue dark:text-disney-gold focus:ring-disney-blue dark:focus:ring-disney-gold"
          />
          Show retired
        </label>
      </div>
      </FilterDrawer>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm text-slate-500 dark:text-slate-400">No venues match your filters.</p>
        </div>
      ) : sortMode === 'alpha' ? (
        // Flat alphabetical list
        <div className="space-y-2">
          {[...filtered].sort((a, b) => a.name.localeCompare(b.name)).map(venue => {
            const cat = categoryMap[venue.category];
            const colors = categoryColors[cat?.color ?? 'blue'] ?? categoryColors.blue;
            return (
              <VenueCard key={venue.id} venue={venue} cat={cat} colors={colors} selectedShips={selectedShips} />
            );
          })}
        </div>
      ) : (
        // Render by category groups in defined order
        categories
          .filter(cat => grouped[cat.id])
          .map(cat => {
          const venues = grouped[cat.id];
          const colors = categoryColors[cat.color] ?? categoryColors.blue;
          return (
            <div key={cat.id} className="mb-6">
              <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span>{cat.emoji}</span> {cat.label}
                <span className="text-xs font-normal text-slate-400 dark:text-slate-500">({venues.length})</span>
              </h2>
              <div className="space-y-2">
                {venues.map(venue => (
                  <VenueCard key={venue.id} venue={venue} cat={cat} colors={colors} selectedShips={selectedShips} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function sectionColor(section: string): string {
  switch (section) {
    case 'Aft': return 'text-blue-600 dark:text-blue-400';
    case 'Forward': return 'text-red-600 dark:text-red-400';
    case 'Midship': return 'text-green-600 dark:text-green-400';
    case 'Pool Deck': return 'text-yellow-600 dark:text-yellow-400';
    case 'Grand Hall': return 'text-purple-600 dark:text-purple-400';
    case 'Castaway Cay': return 'text-teal-600 dark:text-teal-400';
    case 'Lookout Cay': return 'text-orange-600 dark:text-orange-400';
    default: return 'text-slate-500 dark:text-slate-400';
  }
}

function VenueCard({ venue, cat, colors, selectedShips }: { venue: FoodieVenue; cat: FoodieCategory; colors: { pill: string; card: string }; selectedShips: string[] }) {
  return (
    <Link
      href={`/Secret-menU/foodies/${venue.id}`}
      className={`block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 ${colors.card} p-4 hover:shadow-md hover:scale-[1.01] active:scale-95 transition-all`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{venue.name}</h3>
            {venue.exclusive && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                Exclusive
              </span>
            )}
            {venue.ships.map(ship => (
              <span key={ship} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                selectedShips.includes(ship)
                  ? 'bg-disney-blue text-white dark:bg-disney-gold dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {ship.replace('Disney ', '')}
              </span>
            ))}
            {venue.status === 'historical' && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400">
                RETIRED
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{venue.theme}</p>
          {(venue.characterExperience || venue.liveEntertainment || venue.price || venue.access) && (
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              {venue.characterExperience && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400">
                  Character Experiences
                </span>
              )}
              {venue.liveEntertainment && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                  Live Shows &amp; Entertainment
                </span>
              )}
              {venue.price && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  {venue.price}
                </span>
              )}
              {venue.access && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                  {venue.access}
                </span>
              )}
            </div>
          )}
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 line-clamp-2">{venue.description}</p>
        </div>
        {selectedShips.length === 1 && venue.deckByShip?.[selectedShips[0]] && (venue.deckByShip[selectedShips[0]].deck || venue.deckByShip[selectedShips[0]].section) && (
          <div className="flex-shrink-0 text-center bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 w-[76px]">
            {venue.deckByShip[selectedShips[0]].deck && (
              <div className="text-lg font-bold text-disney-navy dark:text-disney-gold leading-tight">{venue.deckByShip[selectedShips[0]].deck}</div>
            )}
            {venue.deckByShip[selectedShips[0]].section && (
              <div className={`text-xs font-semibold mt-0.5 leading-tight ${sectionColor(venue.deckByShip[selectedShips[0]].section!)}`}>{venue.deckByShip[selectedShips[0]].section}</div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
