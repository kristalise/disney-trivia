'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  getActivityCategories,
  getAllActivities,
  getAgeGroups,
  getTotalActivityCount,
  type ActivityCategory,
  type Activity,
} from '@/lib/things-to-do-data';
import { CATEGORY_COLORS } from '@/lib/guide-colors';

const categories = getActivityCategories();
const allActivities = getAllActivities();
const ageGroups = getAgeGroups();
const totalCount = getTotalActivityCount();

const SHIPS = [
  'Disney Magic', 'Disney Wonder', 'Disney Dream', 'Disney Fantasy',
  'Disney Wish', 'Disney Treasure', 'Disney Destiny', 'Disney Adventure',
];

const categoryColors = CATEGORY_COLORS;

const agePillColors: Record<string, string> = {
  'all-ages':  'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
  'families':  'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  'kids':      'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  'tweens':    'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
  'teens':     'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
  'adults':    'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
  'toddlers':  'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
};

const ageLabels: Record<string, string> = Object.fromEntries(ageGroups.map(a => [a.id, a.label]));

export default function ThingsToDoPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedShip, setSelectedShip] = useState<string>('');
  const [selectedAge, setSelectedAge] = useState<string>('');
  const [showHistorical, setShowHistorical] = useState(false);

  const filtered = useMemo(() => {
    let results = allActivities;

    if (!showHistorical) {
      results = results.filter(a => a.status === 'current');
    }

    if (selectedCategory) {
      results = results.filter(a => a.category === selectedCategory);
    }

    if (selectedShip) {
      results = results.filter(a => a.ships.includes(selectedShip));
    }

    if (selectedAge) {
      results = results.filter(a => a.ageGroup === selectedAge);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        (a.ip && a.ip.toLowerCase().includes(q))
      );
    }

    return results;
  }, [search, selectedCategory, selectedShip, selectedAge, showHistorical]);

  // Group by category for display
  const grouped = useMemo(() => {
    const groups: Record<string, Activity[]> = {};
    for (const a of filtered) {
      if (!groups[a.category]) groups[a.category] = [];
      groups[a.category].push(a);
    }
    return groups;
  }, [filtered]);

  const categoryMap = useMemo(() => {
    return Object.fromEntries(categories.map(c => [c.id, c]));
  }, []);

  // Base filtered by everything EXCEPT category (for dynamic pill counts)
  const filteredExceptCategory = useMemo(() => {
    let results = allActivities;
    if (!showHistorical) results = results.filter(a => a.status === 'current');
    if (selectedShip) results = results.filter(a => a.ships.includes(selectedShip));
    if (selectedAge) results = results.filter(a => a.ageGroup === selectedAge);
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        (a.ip && a.ip.toLowerCase().includes(q))
      );
    }
    return results;
  }, [search, selectedShip, selectedAge, showHistorical]);

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
          🎢 Activity Guide
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Pools, rides, sports & youth clubs across the fleet — {totalCount} activities
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search pools, rides, sports..."
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
          const count = filteredExceptCategory.filter(a => a.category === cat.id).length;
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

      {/* Ship + Age filters */}
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
          value={selectedAge}
          onChange={e => setSelectedAge(e.target.value)}
          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold"
        >
          <option value="">All Ages</option>
          {ageGroups.map(ag => (
            <option key={ag.id} value={ag.id}>{ag.label}</option>
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
          <p className="text-sm text-slate-500 dark:text-slate-400">No activities match your filters.</p>
        </div>
      ) : (
        categories
          .filter(cat => grouped[cat.id])
          .map(cat => {
            const activities = grouped[cat.id];
            const colors = categoryColors[cat.color] ?? categoryColors.sky;
            return (
              <div key={cat.id} className="mb-6">
                <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span>{cat.emoji}</span> {cat.label}
                  <span className="text-xs font-normal text-slate-400 dark:text-slate-500">({activities.length})</span>
                </h2>
                <div className="space-y-2">
                  {activities.map(activity => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      colors={colors}
                      selectedShip={selectedShip}
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
    default: return 'text-slate-500 dark:text-slate-400';
  }
}

function ActivityCard({
  activity,
  colors,
  selectedShip,
}: {
  activity: Activity;
  colors: { pill: string; card: string };
  selectedShip: string;
}) {
  const loc = selectedShip && activity.deckByShip?.[selectedShip];
  return (
    <div
      className={`block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 ${colors.card} p-4`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {/* Line 1: Name + Ship pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{activity.name}</h3>
            {activity.ships.map(ship => (
              <span key={ship} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                selectedShip === ship
                  ? 'bg-disney-blue text-white dark:bg-disney-gold dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {ship.replace('Disney ', '')}
              </span>
            ))}
            {activity.status === 'historical' && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400">
                RETIRED
              </span>
            )}
          </div>
          {/* Line 2: IP (if any) */}
          {activity.ip && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{activity.ip}</p>
          )}
          {/* Line 3: Age group + height req pills */}
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${agePillColors[activity.ageGroup] || agePillColors['all-ages']}`}>
              {ageLabels[activity.ageGroup] || activity.ageGroup}
            </span>
            {activity.heightReq && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                Min. {activity.heightReq}
              </span>
            )}
            {activity.seasonal && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                {activity.seasonal}
              </span>
            )}
          </div>
          {/* Line 4: Description */}
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 line-clamp-2">{activity.description}</p>
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
