'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import stateroomData from '@/data/stateroom-data.json';
import {
  type Stateroom,
  getCategoryClass,
  CATEGORY_COLORS,
} from '@/lib/deck-plan-utils';

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

const data = stateroomData as Record<ShipName, Stateroom[]>;

interface RoomSearchOverlayProps {
  ship: string;
}

export default function RoomSearchOverlay({ ship }: RoomSearchOverlayProps) {
  const [input, setInput] = useState('');
  const [searchedValue, setSearchedValue] = useState('');

  const result = useMemo<Stateroom | null>(() => {
    if (!searchedValue || !ship) return null;
    const num = parseInt(searchedValue, 10);
    if (isNaN(num)) return null;
    const rooms = data[ship as ShipName];
    return rooms?.find((r) => r.stateroom === num) ?? null;
  }, [searchedValue, ship]);

  // Clear search when ship changes
  const [prevShip, setPrevShip] = useState(ship);
  if (ship !== prevShip) {
    setPrevShip(ship);
    setInput('');
    setSearchedValue('');
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchedValue(input);
  };

  const hasSearched = searchedValue !== '';
  const roomType = result ? getCategoryClass(result.category) : null;

  return (
    <div className="absolute top-4 left-4 z-10 w-72 max-w-[calc(100%-2rem)]">
      {/* Search input */}
      <form
        onSubmit={handleSearch}
        className="flex gap-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-xl p-2 shadow-lg border border-slate-200/80 dark:border-slate-700/80"
      >
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/\D/g, ''))}
          placeholder="Room #"
          className="flex-1 min-w-0 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
        />
        <button
          type="submit"
          disabled={!input}
          className="px-3 py-1.5 rounded-lg text-sm font-medium btn-disney disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          Search
        </button>
      </form>

      {/* Result card */}
      {hasSearched && (
        <div className="mt-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/80 dark:border-slate-700/80">
          {result ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Room {result.stateroom}
                </h3>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
                  style={{
                    backgroundColor: CATEGORY_COLORS[roomType!] + '20',
                    color: CATEGORY_COLORS[roomType!],
                  }}
                >
                  {roomType}
                </span>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Category</span>
                  <span className="text-slate-900 dark:text-white font-medium">
                    {result.category ?? '—'}
                  </span>
                </div>
                {result.bedding && (
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 dark:text-slate-400 shrink-0">Bedding</span>
                    <span className="text-slate-900 dark:text-white text-right text-xs">
                      {result.bedding}
                    </span>
                  </div>
                )}
                {result.assemblyStation && result.assemblyStation !== 'TBD' && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Assembly</span>
                    <span className="text-slate-900 dark:text-white">
                      Station {result.assemblyStation}
                    </span>
                  </div>
                )}
              </div>
              <Link
                href={`/stateroom?ship=${encodeURIComponent(ship)}&room=${result.stateroom}`}
                className="mt-3 block text-center text-sm font-medium text-disney-blue dark:text-disney-gold hover:underline"
              >
                View Full Details &rarr;
              </Link>
            </div>
          ) : (
            <div className="text-center py-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                Room {searchedValue} not found
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No stateroom with this number exists on {ship}.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
