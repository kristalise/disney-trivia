'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import stateroomData from '@/data/stateroom-data.json';
import {
  type Stateroom,
  type RoomPosition,
  getDecksForShip,
  getRoomsOnDeck,
  getCategoryClass,
  computeRoomPositions,
  computeFallbackGrid,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  getDeckFromRoomNumber,
} from '@/lib/deck-plan-utils';
import ShipSVG from './ShipSVG';

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

interface DeckPlanViewerProps {
  initialShip?: string;
  initialRoom?: number;
  initialDeck?: number;
}

export default function DeckPlanViewer({ initialShip, initialRoom, initialDeck }: DeckPlanViewerProps) {
  const [selectedShip, setSelectedShip] = useState<ShipName>(
    (SHIPS.includes(initialShip as ShipName) ? initialShip : 'Disney Wish') as ShipName
  );

  const shipRooms = data[selectedShip] ?? [];
  const decks = useMemo(() => getDecksForShip(shipRooms), [shipRooms]);

  const [selectedDeck, setSelectedDeck] = useState<number>(() => {
    if (initialDeck && decks.includes(initialDeck)) return initialDeck;
    return decks[0] ?? 1;
  });

  const [selectedRoom, setSelectedRoom] = useState<number | null>(initialRoom ?? null);
  const [tooltip, setTooltip] = useState<{ room: Stateroom; x: number; y: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const deckTabsRef = useRef<HTMLDivElement>(null);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // When ship changes, reset to first deck
  useEffect(() => {
    const newDecks = getDecksForShip(data[selectedShip] ?? []);
    if (initialDeck && newDecks.includes(initialDeck) && selectedShip === initialShip) {
      setSelectedDeck(initialDeck);
    } else {
      setSelectedDeck(newDecks[0] ?? 1);
    }
    if (selectedShip !== initialShip) {
      setSelectedRoom(null);
      setTooltip(null);
    }
  }, [selectedShip, initialShip, initialDeck]);

  const deckRooms = useMemo(() => getRoomsOnDeck(shipRooms, selectedDeck), [shipRooms, selectedDeck]);

  // Check if this ship has TBD positional data
  const isFallback = useMemo(
    () => deckRooms.length > 0 && deckRooms.every((r) => r.assemblySide === 'TBD' || !r.assemblySide),
    [deckRooms]
  );

  const positions = useMemo(
    () => (isFallback ? computeFallbackGrid(deckRooms) : computeRoomPositions(deckRooms)),
    [deckRooms, isFallback]
  );

  const handleRoomClick = useCallback(
    (pos: RoomPosition, event: React.MouseEvent<SVGElement>) => {
      setSelectedRoom(pos.room.stateroom);

      if (isMobile) {
        // Mobile: show bottom sheet (no positioning needed)
        setTooltip({ room: pos.room, x: 0, y: 0 });
      } else {
        // Desktop: position near the click
        const container = svgContainerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        setTooltip({ room: pos.room, x, y });
      }
    },
    [isMobile]
  );

  const closeTooltip = useCallback(() => {
    setTooltip(null);
  }, []);

  // Close tooltip on outside click (desktop)
  useEffect(() => {
    if (!tooltip || isMobile) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-tooltip]') || target.closest('svg')) return;
      closeTooltip();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [tooltip, isMobile, closeTooltip]);

  const tooltipRoom = tooltip?.room;
  const roomDeck = tooltipRoom ? getDeckFromRoomNumber(tooltipRoom.stateroom) : null;

  return (
    <div>
      {/* Ship selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Ship
        </label>
        <select
          value={selectedShip}
          onChange={(e) => setSelectedShip(e.target.value as ShipName)}
          className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
        >
          {SHIPS.map((ship) => (
            <option key={ship} value={ship}>{ship}</option>
          ))}
        </select>
      </div>

      {/* Deck tabs */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Deck
        </label>
        <div ref={deckTabsRef} className="flex gap-1 overflow-x-auto pb-2">
          {decks.map((deck) => (
            <button
              key={deck}
              onClick={() => {
                setSelectedDeck(deck);
                setTooltip(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                deck === selectedDeck
                  ? 'bg-disney-blue text-white dark:bg-disney-gold dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              Deck {deck}
            </button>
          ))}
        </div>
      </div>

      {/* Adventure TBD banner */}
      {isFallback && (
        <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
          <span className="text-lg">⚠️</span>
          <span>
            Positional data is not yet available for this ship. Rooms are shown in a grid layout by room number.
          </span>
        </div>
      )}

      {/* SVG deck plan */}
      <div
        ref={svgContainerRef}
        className="relative bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg border border-slate-200 dark:border-slate-700 mb-4"
      >
        <ShipSVG
          positions={positions}
          selectedRoom={selectedRoom}
          onRoomClick={handleRoomClick}
          isFallback={isFallback}
        />

        {/* Desktop tooltip */}
        {tooltip && !isMobile && (
          <div
            data-tooltip
            className="absolute z-10 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 w-64 animate-fade-in"
            style={{
              left: Math.min(tooltip.x, (svgContainerRef.current?.offsetWidth ?? 300) - 280),
              top: tooltip.y + 10,
            }}
          >
            <TooltipContent room={tooltip.room} shipName={selectedShip} deck={roomDeck} onClose={closeTooltip} />
          </div>
        )}
      </div>

      {/* Mobile bottom sheet */}
      {tooltip && isMobile && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={closeTooltip} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 rounded-t-2xl shadow-xl p-5 animate-slide-up">
            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600 mx-auto mb-4" />
            <TooltipContent room={tooltip.room} shipName={selectedShip} deck={roomDeck} onClose={closeTooltip} />
          </div>
        </>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-sm">
        {(Object.keys(CATEGORY_COLORS) as Array<keyof typeof CATEGORY_COLORS>).map((cls) => (
          <div key={cls} className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ backgroundColor: CATEGORY_COLORS[cls] }}
            />
            <span className="text-slate-600 dark:text-slate-400">{CATEGORY_LABELS[cls]}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-orange-500" />
          <span className="text-slate-600 dark:text-slate-400">Selected</span>
        </div>
      </div>

      {/* Room count */}
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-500">
        {deckRooms.length} rooms on Deck {selectedDeck}
      </p>
    </div>
  );
}

function TooltipContent({
  room,
  shipName,
  deck,
  onClose,
}: {
  room: Stateroom;
  shipName: string;
  deck: number | null;
  onClose: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-slate-900 dark:text-white text-lg">
          Room {room.stateroom}
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-slate-400">Category</span>
          <span className="text-slate-900 dark:text-white font-medium">{room.category ?? '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-slate-400">Type</span>
          <span
            className="font-medium capitalize"
            style={{ color: CATEGORY_COLORS[getCategoryClass(room.category)] }}
          >
            {getCategoryClass(room.category)}
          </span>
        </div>
        {room.bedding && (
          <div className="flex justify-between gap-2">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">Bedding</span>
            <span className="text-slate-900 dark:text-white text-right">{room.bedding}</span>
          </div>
        )}
        {room.assemblyStation && room.assemblyStation !== 'TBD' && (
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Assembly</span>
            <span className="text-slate-900 dark:text-white">
              Station {room.assemblyStation}
              {room.assemblyLocation ? ` — ${room.assemblyLocation}` : ''}
            </span>
          </div>
        )}
      </div>
      <Link
        href={`/stateroom?ship=${encodeURIComponent(shipName)}&room=${room.stateroom}`}
        className="mt-3 block text-center text-sm font-medium text-disney-blue dark:text-disney-gold hover:underline"
      >
        View Full Details →
      </Link>
    </div>
  );
}
