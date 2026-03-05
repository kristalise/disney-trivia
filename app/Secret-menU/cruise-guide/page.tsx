'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  getAllCruiseGuideItems,
  getCruiseGuideCategories,
  getTotalCruiseGuideCount,
  getAllGuideIps,
  getAllGuideAgeGroups,
  getAllGuideSeasonals,
  SHIP_ORDER,
  type CruiseGuideItem,
  type GuideCategory,
} from '@/lib/cruise-guide-data';
import { useAuth } from '@/components/AuthProvider';
import { getCategoryColor } from '@/lib/guide-colors';

const allItems = getAllCruiseGuideItems();
const categories = getCruiseGuideCategories();
const totalCount = getTotalCruiseGuideCount();
const allIps = getAllGuideIps();
const allAgeGroups = getAllGuideAgeGroups();
const allSeasonals = getAllGuideSeasonals();

// Build a lookup from category key → GuideCategory
const categoryByKey = new Map(categories.map(c => [c.key, c]));

const SHIPS = SHIP_ORDER;

interface Sailing {
  id: string;
  ship_name: string;
  sail_start_date: string;
  sail_end_date: string;
  itinerary_name: string | null;
}

// Age group labels
const AGE_LABELS: Record<string, string> = {
  'families':  'Families',
  'kids':      'Kids',
  'tweens':    'Tweens',
  'teens':     'Teens',
  'adults':    'Adults',
  'toddlers':  'Toddlers',
};

export default function CruiseGuidePage() {
  const { user, session } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedShip, setSelectedShip] = useState<string>('');
  const [selectedIp, setSelectedIp] = useState<string>('');
  const [selectedAge, setSelectedAge] = useState<string>('');
  const [selectedPricing, setSelectedPricing] = useState<string>('');
  const [selectedSeasonal, setSelectedSeasonal] = useState<string>('');
  const [showHistorical, setShowHistorical] = useState(false);

  // Planner state
  const [sailings, setSailings] = useState<Sailing[]>([]);
  const [plannerItems, setPlannerItems] = useState<Set<string>>(new Set());
  const [addingSailingId, setAddingSailingId] = useState<string | null>(null);
  const [addingItemId, setAddingItemId] = useState<string | null>(null);
  const [savingItem, setSavingItem] = useState<string | null>(null);

  // Fetch user sailings + planner items
  useEffect(() => {
    if (!user || !session?.access_token) return;
    fetch('/api/sailing-reviews/mine', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.sailings) setSailings(data.sailings); })
      .catch(() => {});
  }, [user, session?.access_token]);

  // Fetch planner items for all sailings
  useEffect(() => {
    if (!sailings.length || !session?.access_token) return;
    const fetchPlanner = async () => {
      const set = new Set<string>();
      for (const sailing of sailings) {
        try {
          const res = await fetch(`/api/planner-items?sailing_id=${sailing.id}`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (res.ok) {
            const data = await res.json();
            for (const item of data.items ?? []) {
              set.add(`${item.item_type}:${item.item_id}:${sailing.id}`);
            }
          }
        } catch { /* ignore */ }
      }
      setPlannerItems(set);
    };
    fetchPlanner();
  }, [sailings, session?.access_token]);

  const addToPlanner = useCallback(async (item: CruiseGuideItem, sailingId: string) => {
    if (!session?.access_token) return;
    setSavingItem(item.id);
    try {
      const res = await fetch('/api/planner-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          sailing_id: sailingId,
          item_type: item.plannerItemType,
          item_id: item.sourceId,
          item_name: item.name,
        }),
      });
      if (res.ok) {
        setPlannerItems(prev => {
          const next = new Set(prev);
          next.add(`${item.plannerItemType}:${item.sourceId}:${sailingId}`);
          return next;
        });
      }
    } catch { /* ignore */ }
    setSavingItem(null);
    setAddingSailingId(null);
    setAddingItemId(null);
  }, [session?.access_token]);

  const isItemPlanned = useCallback((item: CruiseGuideItem): boolean => {
    for (const sailing of sailings) {
      if (plannerItems.has(`${item.plannerItemType}:${item.sourceId}:${sailing.id}`)) return true;
    }
    return false;
  }, [plannerItems, sailings]);

  // Filter items
  const filtered = useMemo(() => {
    let results = allItems;

    if (!showHistorical) {
      results = results.filter(i => i.status === 'current');
    }

    if (selectedCategory) {
      results = results.filter(i => i.categories.includes(selectedCategory));
    }

    if (selectedShip) {
      results = results.filter(i => i.ships.includes(selectedShip));
    }

    if (selectedIp) {
      results = results.filter(i => i.ip === selectedIp);
    }

    if (selectedAge) {
      results = results.filter(i => i.ageGroup === selectedAge);
    }

    if (selectedPricing === 'included') {
      results = results.filter(i => !i.price);
    } else if (selectedPricing === 'extra') {
      results = results.filter(i => !!i.price);
    }

    if (selectedSeasonal) {
      results = results.filter(i => i.seasonal === selectedSeasonal);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        (i.ip && i.ip.toLowerCase().includes(q))
      );
    }

    return results;
  }, [search, selectedCategory, selectedShip, selectedIp, selectedAge, selectedPricing, selectedSeasonal, showHistorical]);

  // Filtered except category (for dynamic pill counts)
  const filteredExceptCategory = useMemo(() => {
    let results = allItems;
    if (!showHistorical) results = results.filter(i => i.status === 'current');
    if (selectedShip) results = results.filter(i => i.ships.includes(selectedShip));
    if (selectedIp) results = results.filter(i => i.ip === selectedIp);
    if (selectedAge) results = results.filter(i => i.ageGroup === selectedAge);
    if (selectedPricing === 'included') results = results.filter(i => !i.price);
    else if (selectedPricing === 'extra') results = results.filter(i => !!i.price);
    if (selectedSeasonal) results = results.filter(i => i.seasonal === selectedSeasonal);
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        (i.ip && i.ip.toLowerCase().includes(q))
      );
    }
    return results;
  }, [search, selectedShip, selectedIp, selectedAge, selectedPricing, selectedSeasonal, showHistorical]);

  // Available IPs in current filtered set (for dynamic dropdown)
  const availableIps = useMemo(() => {
    let base = allItems;
    if (!showHistorical) base = base.filter(i => i.status === 'current');
    if (selectedCategory) base = base.filter(i => i.categories.includes(selectedCategory));
    if (selectedShip) base = base.filter(i => i.ships.includes(selectedShip));
    const ipSet = new Set(base.map(i => i.ip).filter(Boolean) as string[]);
    return allIps.filter(ip => ipSet.has(ip));
  }, [selectedCategory, selectedShip, showHistorical]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, CruiseGuideItem[]> = {};

    if (selectedCategory) {
      groups[selectedCategory] = filtered;
    } else {
      for (const item of filtered) {
        const cat = item.categories[0];
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(item);
      }
    }
    return groups;
  }, [filtered, selectedCategory]);

  // Eligible sailings for a given item (ships must match)
  const getEligibleSailings = useCallback((item: CruiseGuideItem) => {
    return sailings.filter(s => item.ships.includes(s.ship_name));
  }, [sailings]);

  // Check if any advanced filter is active
  const hasAdvancedFilters = selectedIp || selectedAge || selectedPricing || selectedSeasonal;

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
          🧭 Cruise Guide
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Everything onboard across the fleet — {totalCount} experiences
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search dining, shows, activities, shops..."
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
        />
      </div>

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
          const count = filteredExceptCategory.filter(i => i.categories.includes(cat.key)).length;
          if (count === 0 && selectedCategory !== cat.key) return null;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(selectedCategory === cat.key ? null : cat.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat.key
                  ? 'bg-disney-blue text-white dark:bg-disney-gold dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {cat.emoji} {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Ship + IP filters (row 1) */}
      <div className="flex items-center gap-3 mb-3">
        <select
          value={selectedShip}
          onChange={e => setSelectedShip(e.target.value)}
          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold"
        >
          <option value="">All Ships</option>
          {SHIPS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={selectedIp}
          onChange={e => setSelectedIp(e.target.value)}
          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold"
        >
          <option value="">All Franchises</option>
          {availableIps.map(ip => (
            <option key={ip} value={ip}>{ip}</option>
          ))}
        </select>
      </div>

      {/* Age + Pricing + Seasonal filters (row 2) */}
      <div className="flex items-center gap-3 mb-3">
        <select
          value={selectedAge}
          onChange={e => setSelectedAge(e.target.value)}
          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold"
        >
          <option value="">All Ages</option>
          {allAgeGroups.map(ag => (
            <option key={ag} value={ag}>{AGE_LABELS[ag] || ag}</option>
          ))}
        </select>
        <select
          value={selectedPricing}
          onChange={e => setSelectedPricing(e.target.value)}
          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold"
        >
          <option value="">All Pricing</option>
          <option value="included">Included</option>
          <option value="extra">Extra Charge</option>
        </select>
        {allSeasonals.length > 0 && (
          <select
            value={selectedSeasonal}
            onChange={e => setSelectedSeasonal(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold"
          >
            <option value="">All Seasons</option>
            {allSeasonals.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
      </div>

      {/* Show retired + result count + clear filters */}
      <div className="flex items-center gap-4 mb-6">
        <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer whitespace-nowrap">
          <input
            type="checkbox"
            checked={showHistorical}
            onChange={e => setShowHistorical(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-600 text-disney-blue dark:text-disney-gold focus:ring-disney-blue dark:focus:ring-disney-gold"
          />
          Show retired
        </label>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
        {hasAdvancedFilters && (
          <button
            type="button"
            onClick={() => {
              setSelectedIp('');
              setSelectedAge('');
              setSelectedPricing('');
              setSelectedSeasonal('');
            }}
            className="text-xs text-disney-blue dark:text-disney-gold hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm text-slate-500 dark:text-slate-400">No items match your filters.</p>
        </div>
      ) : (
        categories
          .filter(cat => grouped[cat.key])
          .map(cat => {
            const items = grouped[cat.key];
            const colors = getCategoryColor(cat.color);
            const borderColor = colors.card;
            return (
              <div key={cat.key} className="mb-6">
                <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span>{cat.emoji}</span> {cat.label}
                  <span className="text-xs font-normal text-slate-400 dark:text-slate-500">({items.length})</span>
                </h2>
                <div className="space-y-2">
                  {items.map(item => (
                    <GuideCard
                      key={item.id}
                      item={item}
                      borderColor={borderColor}
                      selectedShip={selectedShip}
                      isPlanned={isItemPlanned(item)}
                      user={user}
                      sailings={getEligibleSailings(item)}
                      addingSailingId={addingItemId === item.id ? addingSailingId : null}
                      savingItem={savingItem}
                      onAddClick={() => {
                        if (addingItemId === item.id) {
                          setAddingItemId(null);
                          setAddingSailingId(null);
                        } else {
                          setAddingItemId(item.id);
                          setAddingSailingId(null);
                        }
                      }}
                      onSelectSailing={(sailingId) => addToPlanner(item, sailingId)}
                    />
                  ))}
                </div>
              </div>
            );
          })
      )}
    </div>
  );
}

function GuideCard({
  item,
  borderColor,
  selectedShip,
  isPlanned,
  user,
  sailings,
  addingSailingId,
  savingItem,
  onAddClick,
  onSelectSailing,
}: {
  item: CruiseGuideItem;
  borderColor: string;
  selectedShip: string;
  isPlanned: boolean;
  user: { id: string } | null;
  sailings: Sailing[];
  addingSailingId: string | null;
  savingItem: string | null;
  onAddClick: () => void;
  onSelectSailing: (sailingId: string) => void;
}) {
  const showSailingPicker = addingSailingId !== null || addingSailingId === '';

  return (
    <Link
      href={item.guidePath}
      className={`block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 ${borderColor} p-4 hover:border-disney-gold dark:hover:border-disney-gold transition-colors`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {/* Line 1: Name + IP pill + Added/Retired badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {item.name}
            </span>
            {item.ip && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                {item.ip}
              </span>
            )}
            {isPlanned && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-disney-blue/10 text-disney-blue dark:bg-disney-gold/10 dark:text-disney-gold">
                Added
              </span>
            )}
            {item.status === 'historical' && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400">
                RETIRED
              </span>
            )}
          </div>

          {/* Line 2: Category pills + Price + Access/Age + Seasonal */}
          <div className="flex items-center gap-1 flex-wrap mt-1">
            {item.categories.map(catKey => {
              const cat = categoryByKey.get(catKey);
              if (!cat) return null;
              const colors = getCategoryColor(cat.color);
              return (
                <span key={catKey} className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${colors.pill}`}>
                  {cat.label}
                </span>
              );
            })}
            {item.price && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                {item.price}
              </span>
            )}
            {item.access && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300">
                {item.access}
              </span>
            )}
            {item.ageGroup && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300">
                {AGE_LABELS[item.ageGroup] || item.ageGroup}
              </span>
            )}
            {item.seasonal && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                {item.seasonal}
              </span>
            )}
          </div>

          {/* Line 3: Exclusive pill + Ship pills */}
          <div className="flex items-center gap-1 flex-wrap mt-1">
            {item.exclusive && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-disney-gold/20 text-disney-gold dark:bg-disney-gold/30 dark:text-disney-gold">
                Exclusive
              </span>
            )}
            {item.ships.map(ship => (
              <span key={ship} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                selectedShip === ship
                  ? 'bg-disney-blue text-white dark:bg-disney-gold dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {ship.replace('Disney ', '')}
              </span>
            ))}
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 line-clamp-2">{item.description}</p>
        </div>

        {/* Deck info when ship is selected */}
        {selectedShip && item.deckByShip?.[selectedShip] && (item.deckByShip[selectedShip].deck || item.deckByShip[selectedShip].section) && (
          <div className="flex-shrink-0 text-center bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 w-[76px]">
            {item.deckByShip[selectedShip].deck && (
              <div className="text-lg font-bold text-disney-navy dark:text-disney-gold leading-tight">{item.deckByShip[selectedShip].deck}</div>
            )}
            {item.deckByShip[selectedShip].section && (
              <div className={`text-xs font-semibold mt-0.5 leading-tight ${sectionColor(item.deckByShip[selectedShip].section!)}`}>
                {item.deckByShip[selectedShip].section}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add to Sailing button */}
      {user && !isPlanned && item.status === 'current' && sailings.length > 0 && (
        <div className="mt-3" onClick={(e) => e.preventDefault()}>
          {!showSailingPicker ? (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onAddClick(); }}
              className="text-xs font-medium text-disney-blue dark:text-disney-gold hover:underline flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add to Sailing
            </button>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {sailings.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={(e) => { e.preventDefault(); onSelectSailing(s.id); }}
                  disabled={savingItem === item.id}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-disney-blue/10 text-disney-blue dark:bg-disney-gold/10 dark:text-disney-gold hover:bg-disney-blue/20 dark:hover:bg-disney-gold/20 transition-colors disabled:opacity-50"
                >
                  {savingItem === item.id ? '...' : `${s.ship_name.replace('Disney ', '')} ${new Date(s.sail_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                </button>
              ))}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onAddClick(); }}
                className="px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </Link>
  );
}

function sectionColor(section: string): string {
  switch (section) {
    case 'Aft': return 'text-blue-600 dark:text-blue-400';
    case 'Forward': return 'text-red-600 dark:text-red-400';
    case 'Midship': return 'text-green-600 dark:text-green-400';
    case 'Pool Deck': return 'text-yellow-600 dark:text-yellow-400';
    case 'Grand Hall': return 'text-purple-600 dark:text-purple-400';
    default: return 'text-slate-500 dark:text-slate-400';
  }
}
