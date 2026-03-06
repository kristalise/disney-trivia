'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { EnrichedRoom, DeckGroup, ShipName } from '@/lib/stateroom-types';
import { scoreCompareRooms } from '@/lib/stateroom-scoring';
import type { BudgetLevel, TravelParty } from '@/lib/stateroom-types';
import RoomCompareCard from './RoomCompareCard';
import DeckGroupCard from './DeckGroupCard';
import ShareModal from './ShareModal';

interface ResultsViewProps {
  filtered: EnrichedRoom[];
  deckGroups: DeckGroup[];
  selectedShip: ShipName;
  highlightRoom: number | null;
  shareUrl: string;
  onClearPreferences: () => void;
  onEditStep: (step: number) => void;
  // Scoring params for room comparison
  budgets: BudgetLevel[];
  partySize: number;
  numStaterooms: number;
  travelParty: TravelParty;
  noiseSensitive: boolean;
  needsAccessible: boolean;
  needsConnecting: boolean;
  noBunkBed: boolean;
  elderlyFriendly: boolean;
  childFriendly: boolean;
  selectedThemes: string[];
}

export default function ResultsView({
  filtered, deckGroups, selectedShip, highlightRoom, shareUrl, onClearPreferences, onEditStep,
  budgets, partySize, numStaterooms, travelParty, noiseSensitive, needsAccessible, needsConnecting, noBunkBed, elderlyFriendly, childFriendly, selectedThemes,
}: ResultsViewProps) {
  const [expandedDeck, setExpandedDeck] = useState<number | null>(null);
  const [showAllRooms, setShowAllRooms] = useState<Record<number, boolean>>({});
  const [shareModal, setShareModal] = useState<{ url: string; text: string } | null>(null);

  // Room compare input
  const [roomInput, setRoomInput] = useState('');
  const [compareRooms, setCompareRooms] = useState<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-expand deck containing highlighted room and scroll to it
  useEffect(() => {
    if (highlightRoom && filtered.length > 0) {
      const room = filtered.find(r => r.stateroom === highlightRoom);
      if (room) {
        setExpandedDeck(room.deck);
        setTimeout(() => {
          document.getElementById(`room-${highlightRoom}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    }
  }, [highlightRoom, filtered]);

  // Score compare rooms
  const scoredCompareRooms = compareRooms.length > 0
    ? scoreCompareRooms(compareRooms, {
        selectedShip, budgets, partySize, numStaterooms, travelParty,
        noiseSensitive, needsAccessible, needsConnecting, noBunkBed, elderlyFriendly, childFriendly, selectedThemes,
      })
    : [];

  const handleAddRoom = useCallback(() => {
    const num = parseInt(roomInput.trim(), 10);
    if (isNaN(num) || num < 1000) return;
    if (compareRooms.includes(num)) {
      setRoomInput('');
      return;
    }
    setCompareRooms(prev => [...prev, num]);
    setRoomInput('');
    inputRef.current?.focus();
  }, [roomInput, compareRooms]);

  const handleRemoveRoom = useCallback((room: number) => {
    setCompareRooms(prev => prev.filter(r => r !== room));
  }, []);

  const handlePasteRooms = useCallback((text: string) => {
    // Parse pasted text: comma, space, newline, or tab separated
    const nums = text.split(/[\s,;]+/).map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n >= 1000);
    if (nums.length > 0) {
      setCompareRooms(prev => {
        const set = new Set(prev);
        nums.forEach(n => set.add(n));
        return Array.from(set);
      });
      setRoomInput('');
    }
  }, []);

  const handleShareRoom = useCallback((room: EnrichedRoom) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    params.set('highlight', String(room.stateroom));
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    const scoreBadge = room.trafficLight === 'green' ? 'Great Fit' : room.trafficLight === 'yellow' ? 'Decent' : 'Not Ideal';
    setShareModal({
      url,
      text: `Check out stateroom ${room.stateroom} on ${selectedShip} - ${scoreBadge} for your cruise!`,
    });
  }, [selectedShip]);

  const handleShareResults = useCallback(() => {
    setShareModal({
      url: shareUrl,
      text: `Check out these ${selectedShip} stateroom recommendations!`,
    });
  }, [shareUrl, selectedShip]);

  // No results
  if (filtered.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No rooms match</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Try adjusting your preferences or party size.</p>
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => onEditStep(4)}
              className="text-sm text-disney-blue dark:text-disney-gold hover:underline"
            >
              Edit Preferences
            </button>
            <button
              type="button"
              onClick={() => onEditStep(3)}
              className="text-sm text-disney-blue dark:text-disney-gold hover:underline"
            >
              Edit Party
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Room Compare Input */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg border border-slate-200 dark:border-slate-700 mb-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Compare Specific Rooms</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Enter room numbers you&apos;re considering and we&apos;ll rank them for you.
        </p>

        <div className="flex gap-2 mb-3">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddRoom();
            }}
            onPaste={(e) => {
              const text = e.clipboardData.getData('text');
              if (text.includes(',') || text.includes(' ') || text.includes('\n')) {
                e.preventDefault();
                handlePasteRooms(text);
              }
            }}
            placeholder="Room #"
            className="w-28 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent text-center font-mono text-sm"
          />
          <button
            type="button"
            onClick={handleAddRoom}
            disabled={!roomInput.trim()}
            className="btn-disney px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add
          </button>
          {compareRooms.length > 0 && (
            <button
              type="button"
              onClick={() => setCompareRooms([])}
              className="px-3 py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Room chips */}
        {compareRooms.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {compareRooms.map(num => {
              const scored = scoredCompareRooms.find(r => r.stateroom === num);
              const found = !!scored;
              return (
                <span
                  key={num}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                    !found
                      ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                      : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {found && (
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      scored!.trafficLight === 'green' ? 'bg-green-500' : scored!.trafficLight === 'yellow' ? 'bg-amber-500' : 'bg-red-500'
                    }`} />
                  )}
                  {num}
                  {!found && <span className="text-[10px]">not found</span>}
                  <button
                    type="button"
                    onClick={() => handleRemoveRoom(num)}
                    className="ml-0.5 hover:text-red-500 transition-colors"
                    aria-label={`Remove room ${num}`}
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Room Compare Card (hero) */}
      {scoredCompareRooms.length > 0 && (
        <RoomCompareCard rooms={scoredCompareRooms} ship={selectedShip} />
      )}

      {/* Summary Bar */}
      <div className="flex items-center justify-between mb-4 px-1">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          <span className="font-bold text-slate-900 dark:text-white">{filtered.length}</span>{' '}
          {filtered.length === 1 ? 'room' : 'rooms'} found
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleShareResults}
            className="text-slate-500 hover:text-disney-blue dark:text-slate-400 dark:hover:text-disney-gold transition-colors"
            aria-label="Share Results"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onClearPreferences}
            className="text-sm text-disney-blue dark:text-disney-gold hover:underline"
          >
            Clear preferences
          </button>
        </div>
      </div>

      {/* Deck Group Cards */}
      {deckGroups.map(({ deck, rooms, topScore }) => (
        <DeckGroupCard
          key={deck}
          deck={deck}
          rooms={rooms}
          topScore={topScore}
          selectedShip={selectedShip}
          isExpanded={expandedDeck === deck}
          showAll={showAllRooms[deck] ?? false}
          highlightRoom={highlightRoom}
          onToggleExpand={() => setExpandedDeck(expandedDeck === deck ? null : deck)}
          onShowAll={() => setShowAllRooms(prev => ({ ...prev, [deck]: true }))}
          onShareRoom={handleShareRoom}
        />
      ))}

      {/* Share Modal */}
      {shareModal && (
        <ShareModal
          isOpen={!!shareModal}
          onClose={() => setShareModal(null)}
          url={shareModal.url}
          previewText={shareModal.text}
        />
      )}
    </div>
  );
}
