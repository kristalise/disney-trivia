'use client';

import { useState, useRef } from 'react';
import ImageViewer, { type ImageViewerHandle } from './ImageViewer';
import RoomSearchOverlay from './RoomSearchOverlay';
import {
  SHIP_DECK_PLAN_IMAGES,
  SHIP_ROOM_LAYOUT_IMAGES,
  SHIP_PAIRS,
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

interface DeckPlanExplorerProps {
  initialShip?: string;
}

export default function DeckPlanExplorer({ initialShip }: DeckPlanExplorerProps) {
  const [selectedShip, setSelectedShip] = useState<ShipName>(
    (SHIPS.includes(initialShip as ShipName) ? initialShip : 'Disney Wish') as ShipName
  );
  const [showLayouts, setShowLayouts] = useState(false);
  const viewerRef = useRef<ImageViewerHandle>(null);
  const layoutViewerRef = useRef<ImageViewerHandle>(null);

  const imageSrc = SHIP_DECK_PLAN_IMAGES[selectedShip];
  const layoutSrc = SHIP_ROOM_LAYOUT_IMAGES[selectedShip];
  const sisterShip = SHIP_PAIRS[selectedShip];

  const handleShipChange = (ship: ShipName) => {
    setSelectedShip(ship);
    viewerRef.current?.reset();
    layoutViewerRef.current?.reset();
  };

  return (
    <div>
      {/* Ship selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Ship
        </label>
        <select
          value={selectedShip}
          onChange={(e) => handleShipChange(e.target.value as ShipName)}
          className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
        >
          {SHIPS.map((ship) => (
            <option key={ship} value={ship}>{ship}</option>
          ))}
        </select>
      </div>

      {/* Sister-ship note */}
      {sisterShip && (
        <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-sm text-blue-700 dark:text-blue-400 flex items-start gap-2">
          <span className="text-lg">ℹ️</span>
          <span>
            This deck plan also covers {sisterShip}. Both ships share the same layout.
          </span>
        </div>
      )}

      {/* Image viewer with search overlay */}
      <div className="relative mb-4">
        <ImageViewer
          ref={viewerRef}
          src={imageSrc}
          alt={`${selectedShip} deck plan`}
        />
        <RoomSearchOverlay ship={selectedShip} />
      </div>

      {/* Room Layouts toggle */}
      <div className="mb-4">
        <button
          onClick={() => setShowLayouts((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors w-full sm:w-auto"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showLayouts ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Stateroom Categories &amp; Layouts
        </button>
      </div>

      {showLayouts && (
        <div className="mb-4">
          <ImageViewer
            ref={layoutViewerRef}
            src={layoutSrc}
            alt={`${selectedShip} stateroom category layouts`}
          />
        </div>
      )}

      {/* Usage tips */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-sm text-slate-600 dark:text-slate-400">
        <p className="font-medium text-slate-700 dark:text-slate-300 mb-2">Tips</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Scroll to zoom in/out, or use the +/− buttons</li>
          <li>Click and drag to pan when zoomed in</li>
          <li>Double-click to toggle zoom</li>
          <li>On mobile: pinch to zoom, drag to pan</li>
          <li>Use the search box to look up a specific room number</li>
        </ul>
      </div>
    </div>
  );
}
