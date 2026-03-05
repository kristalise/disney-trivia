'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  getShopCategories,
  getAllShops,
  getTotalShopCount,
  type ShopCategory,
  type Shop,
} from '@/lib/shopping-data';
import { CATEGORY_COLORS } from '@/lib/guide-colors';

const categories = getShopCategories();
const allShops = getAllShops();
const totalCount = getTotalShopCount();

const SHIPS = [
  'Disney Magic', 'Disney Wonder', 'Disney Dream', 'Disney Fantasy',
  'Disney Wish', 'Disney Treasure', 'Disney Destiny', 'Disney Adventure',
];

const categoryColors = CATEGORY_COLORS;

export default function ShoppingGuidePage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedShip, setSelectedShip] = useState<string>('');
  const [showHistorical, setShowHistorical] = useState(false);

  const filtered = useMemo(() => {
    let results = allShops;

    if (!showHistorical) {
      results = results.filter(s => s.status === 'current');
    }

    if (selectedCategory) {
      results = results.filter(s => s.category === selectedCategory);
    }

    if (selectedShip) {
      results = results.filter(s => s.ships.includes(selectedShip));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        (s.ip && s.ip.toLowerCase().includes(q))
      );
    }

    return results;
  }, [search, selectedCategory, selectedShip, showHistorical]);

  // Group by category for display
  const grouped = useMemo(() => {
    const groups: Record<string, Shop[]> = {};
    for (const s of filtered) {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    }
    return groups;
  }, [filtered]);

  const categoryMap = useMemo(() => {
    return Object.fromEntries(categories.map(c => [c.id, c]));
  }, []);

  // Base filtered by everything EXCEPT category (for dynamic pill counts)
  const filteredExceptCategory = useMemo(() => {
    let results = allShops;
    if (!showHistorical) results = results.filter(s => s.status === 'current');
    if (selectedShip) results = results.filter(s => s.ships.includes(selectedShip));
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        (s.ip && s.ip.toLowerCase().includes(q))
      );
    }
    return results;
  }, [search, selectedShip, showHistorical]);

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
          🛍️ Shopping Guide
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Shops, boutiques & retail across the fleet — {totalCount} shops
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search shops, brands, merchandise..."
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
          const count = filteredExceptCategory.filter(s => s.category === cat.id).length;
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

      {/* Ship filter + historical toggle */}
      <div className="mb-3">
        <select
          value={selectedShip}
          onChange={e => setSelectedShip(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold"
        >
          <option value="">All Ships</option>
          {SHIPS.map(s => (
            <option key={s} value={s}>{s}</option>
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
          <p className="text-sm text-slate-500 dark:text-slate-400">No shops match your filters.</p>
        </div>
      ) : (
        categories
          .filter(cat => grouped[cat.id])
          .map(cat => {
            const shops = grouped[cat.id];
            const colors = categoryColors[cat.color] ?? categoryColors.blue;
            return (
              <div key={cat.id} className="mb-6">
                <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span>{cat.emoji}</span> {cat.label}
                  <span className="text-xs font-normal text-slate-400 dark:text-slate-500">({shops.length})</span>
                </h2>
                <div className="space-y-2">
                  {shops.map(shop => (
                    <ShopCard key={shop.id} shop={shop} colors={colors} selectedShip={selectedShip} />
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

function ShopCard({ shop, colors, selectedShip }: { shop: Shop; colors: { pill: string; card: string }; selectedShip: string }) {
  return (
    <div
      className={`block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 ${colors.card} p-4`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{shop.name}</h3>
            {shop.ships.map(ship => (
              <span key={ship} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                selectedShip === ship
                  ? 'bg-disney-blue text-white dark:bg-disney-gold dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {ship.replace('Disney ', '')}
              </span>
            ))}
            {shop.status === 'historical' && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400">
                RETIRED
              </span>
            )}
          </div>
          {shop.ip && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{shop.ip}</p>
          )}
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 line-clamp-2">{shop.description}</p>
        </div>
        {selectedShip && shop.deckByShip?.[selectedShip] && (shop.deckByShip[selectedShip].deck || shop.deckByShip[selectedShip].section) && (
          <div className="flex-shrink-0 text-center bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 w-[76px]">
            {shop.deckByShip[selectedShip].deck && (
              <div className="text-lg font-bold text-disney-navy dark:text-disney-gold leading-tight">{shop.deckByShip[selectedShip].deck}</div>
            )}
            {shop.deckByShip[selectedShip].section && (
              <div className={`text-xs font-semibold mt-0.5 leading-tight ${sectionColor(shop.deckByShip[selectedShip].section!)}`}>{shop.deckByShip[selectedShip].section}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
