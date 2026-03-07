'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import SearchAutocomplete from '@/components/SearchAutocomplete';
import { useAuth } from '@/components/AuthProvider';
import {
  getEntertainmentCategories,
  getAllExperiences,
  getAllIps,
  getTotalExperienceCount,
  type ExperienceCategory,
  type Experience,
} from '@/lib/entertainment-data';
import { getAllFoodieVenues } from '@/lib/foodie-data';
import { CATEGORY_COLORS } from '@/lib/guide-colors';

const categories = getEntertainmentCategories();
const allExperiences = getAllExperiences();
const allIps = getAllIps();
const totalCount = getTotalExperienceCount();

const entertainmentSuggestions = [...new Set(allExperiences.map(e => e.name))];

type ItemStatus = 'added' | 'to-review' | 'reviewed';

// Map entertainment IDs → dining IDs for cross-type status lookup
const entToDiningId = (() => {
  const map = new Map<string, string>();
  const allFoodie = getAllFoodieVenues();
  for (const exp of allExperiences) {
    if (exp.types.includes('dining')) {
      const match = allFoodie.find(v => v.name === exp.name);
      if (match) map.set(exp.id, match.id);
    }
  }
  return map;
})();

const SHIPS = [
  'Disney Magic', 'Disney Wonder', 'Disney Dream', 'Disney Fantasy',
  'Disney Wish', 'Disney Treasure', 'Disney Destiny', 'Disney Adventure',
];

const categoryColors = CATEGORY_COLORS;

const typePillColors: Record<string, string> = {
  'character-experiences': 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
  'live-shows':            'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
  'deck-parties':          'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  'nightclub-lounges':     'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
  'dining':                'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
};

const typeLabels: Record<string, string> = {
  'character-experiences': 'Character Experiences',
  'live-shows':            'Live Shows',
  'deck-parties':          'Deck Party',
  'nightclub-lounges':     'Nightclub & Lounge',
  'dining':                'Dining',
};

export default function EntertainmentGuidePage() {
  const { session } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedShip, setSelectedShip] = useState<string>('');
  const [selectedIp, setSelectedIp] = useState<string>('');
  const [showHistorical, setShowHistorical] = useState(false);
  const [itemStatuses, setItemStatuses] = useState<Record<string, ItemStatus>>({});

  // Fetch planner statuses for logged-in user
  const fetchStatuses = useCallback(async () => {
    if (!session?.access_token) { setItemStatuses({}); return; }
    try {
      const res = await fetch('/api/planner-items/statuses', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setItemStatuses(data.statuses ?? {});
      }
    } catch { /* ignore */ }
  }, [session?.access_token]);

  useEffect(() => { fetchStatuses(); }, [fetchStatuses]);

  // Resolve status for an entertainment item (check both entertainment and dining cross-ref keys)
  const getStatus = useCallback((expId: string): ItemStatus | null => {
    // Direct match
    const direct = itemStatuses[`entertainment:${expId}`];
    if (direct) return direct;
    // Cross-type match (dining equivalent)
    const diningId = entToDiningId.get(expId);
    if (diningId) {
      const dining = itemStatuses[`dining:${diningId}`];
      if (dining) return dining;
    }
    return null;
  }, [itemStatuses]);

  const filtered = useMemo(() => {
    let results = allExperiences;

    if (!showHistorical) {
      results = results.filter(e => e.status === 'current');
    }

    if (selectedType) {
      results = results.filter(e => e.types.includes(selectedType));
    }

    if (selectedShip) {
      results = results.filter(e => e.ships.includes(selectedShip));
    }

    if (selectedIp) {
      results = results.filter(e => e.ip === selectedIp);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.ip.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      );
    }

    return results;
  }, [search, selectedType, selectedShip, selectedIp, showHistorical]);

  // Group by primary type (first type in the array) for display
  const grouped = useMemo(() => {
    const groups: Record<string, Experience[]> = {};
    for (const e of filtered) {
      // Use the selected type as the grouping key, or the first type
      const groupKey = selectedType && e.types.includes(selectedType)
        ? selectedType
        : e.types[0];
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(e);
    }
    return groups;
  }, [filtered, selectedType]);

  const categoryMap = useMemo(() => {
    return Object.fromEntries(categories.map(c => [c.id, c]));
  }, []);

  // Base filtered by everything EXCEPT category (for dynamic pill counts)
  const filteredExceptType = useMemo(() => {
    let results = allExperiences;
    if (!showHistorical) results = results.filter(e => e.status === 'current');
    if (selectedShip) results = results.filter(e => e.ships.includes(selectedShip));
    if (selectedIp) results = results.filter(e => e.ip === selectedIp);
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.ip.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      );
    }
    return results;
  }, [search, selectedShip, selectedIp, showHistorical]);

  // Get IPs that have experiences in the current filtered set (for the dropdown)
  const availableIps = useMemo(() => {
    let base = allExperiences;
    if (!showHistorical) base = base.filter(e => e.status === 'current');
    if (selectedType) base = base.filter(e => e.types.includes(selectedType));
    if (selectedShip) base = base.filter(e => e.ships.includes(selectedShip));
    const ipSet = new Set(base.map(e => e.ip));
    return allIps.filter(ip => ipSet.has(ip));
  }, [selectedType, selectedShip, showHistorical]);

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
          🎭 Entertainment Guide
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Shows, characters, deck parties & nightlife across the fleet — {totalCount} experiences
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchAutocomplete
          id="entertainment-search"
          suggestions={entertainmentSuggestions}
          value={search}
          onChange={setSearch}
          placeholder="Search shows, characters, IPs..."
        />
      </div>

      {/* Type filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedType(null)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            selectedType === null
              ? 'bg-disney-blue text-white dark:bg-disney-gold dark:text-slate-900'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
        >
          All ({filteredExceptType.length})
        </button>
        {categories.map(cat => {
          const count = filteredExceptType.filter(e => e.types.includes(cat.id)).length;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedType(selectedType === cat.id ? null : cat.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                selectedType === cat.id
                  ? 'bg-disney-blue text-white dark:bg-disney-gold dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {cat.emoji} {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Ship + IP filters */}
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
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm text-slate-500 dark:text-slate-400">No experiences match your filters.</p>
        </div>
      ) : (
        // Render by category groups, in the order categories appear
        categories
          .filter(cat => grouped[cat.id])
          .map(cat => {
            const experiences = grouped[cat.id];
            const colors = categoryColors[cat.color] ?? categoryColors.indigo;
            return (
              <div key={cat.id} className="mb-6">
                <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span>{cat.emoji}</span> {cat.label}
                  <span className="text-xs font-normal text-slate-400 dark:text-slate-500">({experiences.length})</span>
                </h2>
                <div className="space-y-2">
                  {experiences.map(exp => (
                    <ExperienceCard
                      key={exp.id}
                      experience={exp}
                      colors={colors}
                      selectedShip={selectedShip}
                      categoryMap={categoryMap}
                      status={getStatus(exp.id)}
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

function StatusPill({ status }: { status: ItemStatus }) {
  const config = {
    'added':     { label: 'Added',     bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
    'to-review': { label: 'To Review', bg: 'bg-amber-100 dark:bg-amber-900/30',    text: 'text-amber-700 dark:text-amber-400' },
    'reviewed':  { label: 'Reviewed',  bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
  }[status];

  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${config.bg} ${config.text}`}>
      {status === 'to-review' ? (
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01" />
        </svg>
      ) : (
        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      {config.label}
    </span>
  );
}

function ExperienceCard({
  experience,
  colors,
  selectedShip,
  categoryMap,
  status,
}: {
  experience: Experience;
  colors: { pill: string; card: string };
  selectedShip: string;
  categoryMap: Record<string, ExperienceCategory>;
  status: ItemStatus | null;
}) {
  const loc = selectedShip && experience.deckByShip?.[selectedShip];
  return (
    <div
      className={`relative block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 ${colors.card} p-4`}
    >
      {status && (
        <div className="absolute top-2.5 right-3">
          <StatusPill status={status} />
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {/* Line 1: Name + IP */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{experience.name}</h3>
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{experience.ip}</span>
          </div>
          {/* Line 2: Type pills */}
          {experience.types.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              {experience.types.map(type => (
                <span
                  key={type}
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${typePillColors[type] || 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                >
                  {typeLabels[type] || type}
                </span>
              ))}
            </div>
          )}
          {/* Line 3: Ship pills */}
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            {experience.ships.map(ship => (
              <span key={ship} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                selectedShip === ship
                  ? 'bg-disney-blue text-white dark:bg-disney-gold dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}>
                {ship.replace('Disney ', '')}
              </span>
            ))}
            {experience.status === 'historical' && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400">
                RETIRED
              </span>
            )}
          </div>
          {/* Line 4: Description */}
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 line-clamp-2">{experience.description}</p>
        </div>
        {loc && (loc.deck || loc.section) && (
          <div className="flex-shrink-0 text-center bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 w-[76px]">
            {loc.deck && (
              <div className="text-lg font-bold text-disney-navy dark:text-disney-gold leading-tight">{loc.deck}</div>
            )}
            {loc.section && (
              <div className={`text-xs font-semibold mt-0.5 leading-tight ${sectionColor(loc.section)}`}>{loc.section}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
