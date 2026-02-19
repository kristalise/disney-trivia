'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import stateroomData from '@/data/stateroom-data.json';
import { getDeckFromRoomNumber } from '@/lib/deck-plan-utils';

const SHIPS = [
  'Disney Magic',
  'Disney Wonder',
  'Disney Dream',
  'Disney Fantasy',
  'Disney Wish',
  'Disney Treasure',
  'Disney Destiny',
  'Disney Adventure',
] as const;

type ShipName = (typeof SHIPS)[number];

interface Stateroom {
  stateroom: number;
  category: string | null;
  occupancy: number | null;
  connecting: string | null;
  accessible: string | null;
  verandahPartitions: string | null;
  bedding: string | null;
  assemblyStation: string | null;
  assemblyLocation: string | null;
  assemblySide: string | null;
  assemblySection: string | null;
  wishExtender?: string | null;
  theme?: string | null;
  notes: string | null;
}

const data = stateroomData as Record<ShipName, Stateroom[]>;

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value || value === 'NO' && label === 'Connecting') {
    // Show "None" for connecting = NO
  }
  return (
    <div className="flex justify-between items-start py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm text-slate-900 dark:text-white text-right ml-4 max-w-[60%]">
        {value || '—'}
      </span>
    </div>
  );
}

export default function StateroomPage() {
  const [selectedShip, setSelectedShip] = useState<ShipName | ''>('');
  const [stateroomInput, setStateroomInput] = useState('');
  const [searched, setSearched] = useState(false);

  const result = useMemo<Stateroom | null>(() => {
    if (!selectedShip || !stateroomInput) return null;
    const num = parseInt(stateroomInput, 10);
    if (isNaN(num)) return null;
    const rooms = data[selectedShip];
    return rooms?.find((r) => r.stateroom === num) ?? null;
  }, [selectedShip, stateroomInput, searched]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched((s) => !s); // Toggle to trigger re-computation
  };

  const hasThemeFields = selectedShip && ['Disney Wish', 'Disney Treasure', 'Disney Destiny', 'Disney Adventure'].includes(selectedShip);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Home
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Stateroom Lookup
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Look up details about any Disney Cruise Line stateroom — assembly station, bedding, category, and more.
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          {/* Ship Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Ship
            </label>
            <select
              value={selectedShip}
              onChange={(e) => setSelectedShip(e.target.value as ShipName | '')}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
            >
              <option value="">Select a ship...</option>
              {SHIPS.map((ship) => (
                <option key={ship} value={ship}>
                  {ship}
                </option>
              ))}
            </select>
          </div>

          {/* Stateroom Number */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Stateroom Number
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={stateroomInput}
              onChange={(e) => setStateroomInput(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 2050"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={!selectedShip || !stateroomInput}
            className="w-full px-6 py-3 rounded-xl font-medium btn-disney disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Look Up Stateroom
          </button>
        </div>
      </form>

      {/* Explore Deck Plans link */}
      <Link
        href={`/stateroom/deck-plan/explore${selectedShip ? `?ship=${encodeURIComponent(selectedShip)}` : ''}`}
        className="mb-8 flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        Explore Official Deck Plans
      </Link>

      {/* Results */}
      {searched && selectedShip && stateroomInput && (
        result ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="text-3xl">🚢</div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedShip} — Stateroom {result.stateroom}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Category {result.category}
                </p>
              </div>
            </div>

            <div className="space-y-0">
              <DetailRow label="Category" value={result.category} />
              <DetailRow label="Max Occupancy" value={result.occupancy?.toString()} />
              <DetailRow label="Bedding" value={result.bedding} />
              <DetailRow label="Connecting" value={result.connecting === 'NO' ? 'None' : result.connecting} />
              <DetailRow label="Accessible" value={result.accessible === 'NO' ? 'No' : result.accessible || 'No'} />
              <DetailRow label="Verandah Partitions" value={result.verandahPartitions} />
              <DetailRow label="Assembly Station" value={result.assemblyStation} />
              <DetailRow label="Assembly Location" value={result.assemblyLocation} />
              <DetailRow label="Assembly Side" value={result.assemblySide} />
              <DetailRow label="Assembly Section" value={result.assemblySection} />
              {hasThemeFields && (
                <>
                  <DetailRow label="Theme" value={result.theme} />
                  <DetailRow label="Wish Extender" value={result.wishExtender} />
                </>
              )}
              {result.notes && <DetailRow label="Notes" value={result.notes} />}
            </div>

            <Link
              href={`/stateroom/deck-plan?ship=${encodeURIComponent(selectedShip)}&room=${result.stateroom}&deck=${getDeckFromRoomNumber(result.stateroom)}`}
              className="mt-4 flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              View on Deck Plan
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Stateroom Not Found
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              No stateroom {stateroomInput} found on {selectedShip}. Double-check the number and try again.
            </p>
          </div>
        )
      )}

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-400">
        <div className="flex items-start gap-2">
          <span className="text-lg">ℹ️</span>
          <div>
            <p className="font-medium mb-1">About This Data</p>
            <p>
              Stateroom information is sourced from community-maintained spreadsheets and may not reflect recent changes.
              Always verify critical details with Disney Cruise Line directly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
