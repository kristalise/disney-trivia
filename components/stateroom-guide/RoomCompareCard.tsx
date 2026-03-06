import Link from 'next/link';
import { useMemo } from 'react';
import type { EnrichedRoom, ShipName, TrafficLight } from '@/lib/stateroom-types';
import { TRAFFIC_LIGHT_CLASSES } from '@/lib/stateroom-scoring';
import { SECTION_X } from '@/lib/stateroom-constants';
import categoryMetadata from '@/data/category-metadata.json';
import ScoreBadge from './ScoreBadge';

const categoryMeta = categoryMetadata as Record<string, Record<string, { name?: string }>>;

const TRAFFIC_DOT: Record<TrafficLight, string> = {
  green: 'fill-green-500',
  yellow: 'fill-amber-500',
  red: 'fill-red-500',
};

interface RoomCompareCardProps {
  rooms: EnrichedRoom[];
  ship: ShipName;
}

export default function RoomCompareCard({ rooms, ship }: RoomCompareCardProps) {
  // Group rooms by deck for multi-deck SVG
  const deckGroups = useMemo(() => {
    const map = new Map<number, EnrichedRoom[]>();
    for (const r of rooms) {
      const arr = map.get(r.deck) || [];
      arr.push(r);
      map.set(r.deck, arr);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b);
  }, [rooms]);

  const deckCount = deckGroups.length;
  const stripHeight = 40;
  const stripGap = 8;
  const topPadding = 20;
  const bottomPadding = 10;
  const svgHeight = topPadding + deckCount * stripHeight + (deckCount - 1) * stripGap + bottomPadding;

  // For positioning rooms within a section, spread them out so dots don't overlap
  const positionRooms = (deckRooms: EnrichedRoom[], stripY: number) => {
    // Group by section, then offset within each section
    const bySec: Record<string, EnrichedRoom[]> = {};
    for (const r of deckRooms) {
      const s = r.section || 'Midship';
      if (!bySec[s]) bySec[s] = [];
      bySec[s].push(r);
    }

    const positioned: { room: EnrichedRoom; cx: number; cy: number }[] = [];
    for (const [sec, secRooms] of Object.entries(bySec)) {
      const baseX = SECTION_X[sec] || 300;
      const spread = Math.min(60, 120 / Math.max(secRooms.length, 1));
      const startX = baseX - (spread * (secRooms.length - 1)) / 2;
      secRooms.forEach((r, i) => {
        const cx = startX + i * spread;
        const cy = stripY + (r.stateroom % 2 === 0 ? stripHeight * 0.3 : stripHeight * 0.7);
        positioned.push({ room: r, cx, cy });
      });
    }
    return positioned;
  };

  const greenCount = rooms.filter(r => r.trafficLight === 'green').length;
  const yellowCount = rooms.filter(r => r.trafficLight === 'yellow').length;
  const redCount = rooms.filter(r => r.trafficLight === 'red').length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-2 border-disney-gold overflow-hidden mb-6 glow-gold">
      {/* Header */}
      <div className="bg-gradient-to-r from-disney-gold/20 to-disney-gold/5 dark:from-disney-gold/10 dark:to-transparent px-5 pt-5 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">🗺️</span>
          <span className="text-sm font-bold text-disney-gold uppercase tracking-wide">Your Rooms Overview</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span><strong className="text-slate-900 dark:text-white">{rooms.length}</strong> rooms across <strong className="text-slate-900 dark:text-white">{deckCount}</strong> {deckCount === 1 ? 'deck' : 'decks'}</span>
          <div className="flex items-center gap-3">
            {greenCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />{greenCount}
              </span>
            )}
            {yellowCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />{yellowCount}
              </span>
            )}
            {redCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />{redCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Multi-deck SVG map */}
      <div className="px-5 py-3 border-t border-disney-gold/20">
        <svg viewBox={`0 0 600 ${svgHeight}`} className="w-full h-auto" role="img" aria-label={`Deck map showing ${rooms.length} rooms`}>
          {/* Section labels */}
          <text x="120" y="12" textAnchor="middle" className="fill-slate-400 dark:fill-slate-500" fontSize="9" fontWeight="500">FWD</text>
          <text x="300" y="12" textAnchor="middle" className="fill-slate-400 dark:fill-slate-500" fontSize="9" fontWeight="500">MID</text>
          <text x="480" y="12" textAnchor="middle" className="fill-slate-400 dark:fill-slate-500" fontSize="9" fontWeight="500">AFT</text>

          {deckGroups.map(([deck, deckRooms], idx) => {
            const stripY = topPadding + idx * (stripHeight + stripGap);
            const positioned = positionRooms(deckRooms, stripY);

            return (
              <g key={deck}>
                {/* Deck strip */}
                <rect x="40" y={stripY} width="520" height={stripHeight} rx="4"
                  className="fill-slate-50 dark:fill-slate-700/50 stroke-slate-200 dark:stroke-slate-600"
                  strokeWidth="1"
                />

                {/* Section dividers */}
                <line x1="200" y1={stripY} x2="200" y2={stripY + stripHeight}
                  className="stroke-slate-200 dark:stroke-slate-600" strokeWidth="1" strokeDasharray="4,4"
                />
                <line x1="400" y1={stripY} x2="400" y2={stripY + stripHeight}
                  className="stroke-slate-200 dark:stroke-slate-600" strokeWidth="1" strokeDasharray="4,4"
                />

                {/* Center line */}
                <line x1="40" y1={stripY + stripHeight / 2} x2="560" y2={stripY + stripHeight / 2}
                  className="stroke-slate-200 dark:stroke-slate-600" strokeWidth="0.5" strokeDasharray="2,4"
                />

                {/* Deck label */}
                <text x="30" y={stripY + stripHeight / 2 + 4} textAnchor="end"
                  className="fill-slate-500 dark:fill-slate-400" fontSize="9" fontWeight="600"
                >
                  {deck}
                </text>

                {/* Room dots */}
                {positioned.map(({ room, cx, cy }) => (
                  <g key={room.stateroom}>
                    <circle cx={cx} cy={cy} r="7"
                      className={`${TRAFFIC_DOT[room.trafficLight]} stroke-white dark:stroke-slate-800`}
                      strokeWidth="1.5"
                    />
                    <text x={cx} y={cy + 3} textAnchor="middle"
                      className="fill-white" fontSize="6" fontWeight="700"
                    >
                      {String(room.stateroom).slice(-2)}
                    </text>
                  </g>
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Room list */}
      <div className="border-t border-slate-100 dark:border-slate-700">
        {rooms.map((r) => {
          const catName = r.category ? (categoryMeta[ship]?.[r.category]?.name || r.type) : r.type;
          const cls = TRAFFIC_LIGHT_CLASSES[r.trafficLight];
          return (
            <Link
              key={r.stateroom}
              href={`/Secret-menU/stateroom?ship=${encodeURIComponent(ship)}&room=${r.stateroom}`}
              className={`flex items-center justify-between px-5 py-3 border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${r.trafficLight === 'green' ? 'bg-green-500' : r.trafficLight === 'yellow' ? 'bg-amber-500' : 'bg-red-500'}`} />
                <span className="text-sm font-mono font-bold text-slate-900 dark:text-white w-14">{r.stateroom}</span>
                <div className="min-w-0">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{r.typeEmoji} {catName}</span>
                  <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    <span>Deck {r.deck}</span>
                    <span>{r.section}</span>
                    {r.sqftPerPax && <span>{r.sqftPerPax} sqft/pax</span>}
                    {r.occupancy && <span>Sleeps {r.occupancy}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <ScoreBadge trafficLight={r.trafficLight} />
                <svg className="w-4 h-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
