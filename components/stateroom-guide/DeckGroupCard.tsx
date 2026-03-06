import Link from 'next/link';
import type { EnrichedRoom, ShipName, TrafficLight } from '@/lib/stateroom-types';
import { THEME_COLORS, themeWithEmoji } from '@/lib/stateroom-constants';
import categoryMetadata from '@/data/category-metadata.json';
import ScoreBadge from './ScoreBadge';

const categoryMeta = categoryMetadata as Record<string, Record<string, { name: string }>>;

interface DeckGroupCardProps {
  deck: number;
  rooms: EnrichedRoom[];
  topScore: number;
  selectedShip: ShipName;
  isExpanded: boolean;
  showAll: boolean;
  highlightRoom: number | null;
  onToggleExpand: () => void;
  onShowAll: () => void;
  onShareRoom?: (room: EnrichedRoom) => void;
}

export default function DeckGroupCard({
  deck, rooms, topScore, selectedShip, isExpanded, showAll, highlightRoom,
  onToggleExpand, onShowAll, onShareRoom,
}: DeckGroupCardProps) {
  const displayRooms = showAll ? rooms : rooms.slice(0, 20);
  const sections = [...new Set(rooms.map(r => r.section))];
  const types = [...new Set(rooms.map(r => `${r.typeEmoji} ${r.type}`))];
  const themes = [...new Set(rooms.filter(r => r.theme).map(r => r.theme!))];

  // Derive deck traffic light from the best room (rooms are sorted by score desc)
  const LIGHT_RANK: Record<TrafficLight, number> = { green: 2, yellow: 1, red: 0 };
  const deckTrafficLight = rooms.reduce<TrafficLight>((best, r) =>
    LIGHT_RANK[r.trafficLight] > LIGHT_RANK[best] ? r.trafficLight : best, 'red');

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 mb-4 overflow-hidden">
      {/* Deck Header */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-disney-blue dark:bg-disney-gold flex items-center justify-center text-white dark:text-slate-900 font-bold text-sm flex-shrink-0">
            {deck}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-slate-900 dark:text-white">Deck {deck}</span>
              <ScoreBadge trafficLight={deckTrafficLight} />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <div className="hidden sm:flex flex-wrap gap-1 justify-end">
            {sections.map(s => (
              <span key={s} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">{s}</span>
            ))}
          </div>
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Pill row below header */}
      {isExpanded && (
        <div className="px-5 pb-3 flex flex-wrap gap-1.5">
          {types.map(t => (
            <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">{t}</span>
          ))}
          {themes.map(t => {
            const tc = THEME_COLORS[t] || { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300' };
            return (
              <span key={t} className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${tc.bg} ${tc.text}`}>{themeWithEmoji(t)}</span>
            );
          })}
        </div>
      )}

      {/* Room Rows */}
      {isExpanded && (
        <div className="border-t border-slate-100 dark:border-slate-700">
          {displayRooms.map((r) => {
            const isHighlighted = highlightRoom === r.stateroom;
            return (
              <div key={r.stateroom} className="flex items-center">
                <Link
                  id={isHighlighted ? `room-${r.stateroom}` : undefined}
                  href={`/Secret-menU/stateroom?ship=${encodeURIComponent(selectedShip)}&room=${r.stateroom}`}
                  className={`flex-1 flex items-center justify-between px-5 py-3 border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${
                    isHighlighted ? 'ring-2 ring-disney-gold animate-pulse-gold bg-yellow-50/50 dark:bg-yellow-900/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-mono font-bold text-slate-900 dark:text-white w-14">{r.stateroom}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Cat. {r.category}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{r.typeEmoji} {r.category ? (categoryMeta[selectedShip]?.[r.category]?.name || r.type) : r.type}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <span className="text-xs text-slate-400 dark:text-slate-500">{r.section}</span>
                        {r.occupancy && (
                          <span className="text-xs text-slate-400 dark:text-slate-500">Sleeps {r.occupancy}</span>
                        )}
                        {r.theme && (() => {
                          const tc = THEME_COLORS[r.theme] || { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300' };
                          return (
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${tc.bg} ${tc.text}`}>
                              {themeWithEmoji(r.theme)}
                            </span>
                          );
                        })()}
                        {r.connecting && r.connecting.toUpperCase() !== 'NO' && (
                          <span className="text-xs text-teal-600 dark:text-teal-400">Connects {r.connecting}</span>
                        )}
                        {r.accessible && r.accessible !== 'NO' && (
                          <span className="text-xs text-amber-600 dark:text-amber-400">Accessible</span>
                        )}
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
                {onShareRoom && (
                  <button
                    type="button"
                    onClick={() => onShareRoom(r)}
                    className="px-2 py-3 text-slate-400 hover:text-disney-blue dark:hover:text-disney-gold transition-colors"
                    aria-label={`Share room ${r.stateroom}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}

          {/* Show all button */}
          {!showAll && rooms.length > 20 && (
            <button
              type="button"
              onClick={onShowAll}
              className="w-full py-3 text-sm font-medium text-disney-blue dark:text-disney-gold hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
            >
              Show all {rooms.length} rooms on Deck {deck}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
