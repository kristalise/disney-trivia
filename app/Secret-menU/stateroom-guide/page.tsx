'use client';

import { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import stateroomData from '@/data/stateroom-data.json';
import { getCategoryType, getDeck, getSection, TYPE_EMOJI, isValidStateroomForShip } from '@/lib/stateroom-utils';
import { SHIP_ORDER } from '@/lib/ship-order';
import FilterDrawer from '@/components/FilterDrawer';
import ShareButton from '@/components/ShareButton';

type ShipName = 'Disney Magic' | 'Disney Wonder' | 'Disney Dream' | 'Disney Fantasy' | 'Disney Wish' | 'Disney Treasure' | 'Disney Destiny' | 'Disney Adventure';

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

interface EnrichedRoom extends Stateroom {
  deck: number;
  section: string;
  type: string;
  typeEmoji: string;
  score: number;
}

const data = stateroomData as Record<ShipName, Stateroom[]>;

// Kids activity deck map — Oceaneer Club / kids areas (ages 3-12)
const KIDS_DECKS: Record<string, number[]> = {
  'Disney Magic': [5],
  'Disney Wonder': [5],
  'Disney Dream': [5],
  'Disney Fantasy': [5],
  'Disney Wish': [2],
  'Disney Treasure': [2],
  'Disney Destiny': [2],
  'Disney Adventure': [11],
};

// Teen club deck map — Edge (11-14) & Vibe (14-17) locations
const TEEN_DECKS: Record<string, number[]> = {
  'Disney Magic': [9, 10],
  'Disney Wonder': [9, 10],
  'Disney Dream': [5, 11],
  'Disney Fantasy': [5, 11],
  'Disney Wish': [2, 3],
  'Disney Treasure': [2, 3],
  'Disney Destiny': [2, 3],
  'Disney Adventure': [11, 12],
};

type TravelParty = '' | 'solo' | 'couple' | 'friends' | 'family-kids' | 'family-teens' | 'family-multi';

const TRAVEL_PARTY_OPTIONS: { key: TravelParty; label: string; emoji: string; hint: string }[] = [
  { key: 'solo', label: 'Solo', emoji: '🧳', hint: 'Cozy rooms, social decks' },
  { key: 'couple', label: 'Couple', emoji: '💑', hint: 'Quiet, romantic locations' },
  { key: 'friends', label: 'Friends', emoji: '👯', hint: 'Near pools & nightlife' },
  { key: 'family-kids', label: 'With Kids', emoji: '👨‍👩‍👧', hint: 'Near Oceaneer Club & kids areas' },
  { key: 'family-teens', label: 'With Teens', emoji: '🧑‍🤝‍🧑', hint: 'Near Edge & Vibe teen clubs' },
  { key: 'family-multi', label: 'Multi-gen', emoji: '👴', hint: 'Stable, accessible, midship' },
];

const THEME_EMOJI: Record<string, string> = {
  'Aladdin': '🧞',
  'ALADDIN': '🧞',
  'JASMIN': '🧞',
  'Anna Suite': '❄️',
  'ANNA SUITE': '❄️',
  'Bagheera': '🐆',
  'Big Hero 6': '🤖',
  'Brave': '🏹',
  'Briar Rose': '🌹',
  'Cinderella': '👠',
  'Encanto': '🦋',
  'ENCANTO': '🦋',
  'Epcot': '🌐',
  'ELSA SUITE': '❄️',
  'Fantasia': '🌙',
  'Finding Nemo': '🐠',
  'FINDING NEMO': '🐠',
  'Frozen': '❄️',
  'FROZEN': '❄️',
  'Hercules': '⚡',
  'Hercules/Hero Suite': '⚡',
  'Incredibles': '🦸',
  'Incredibles/Incredisuite': '🦸',
  'Iron Man': '🦾',
  'IRONMAN': '🦾',
  'Lion King': '🦁',
  'LION KING': '🦁',
  'Little Mermaid': '🧜‍♀️',
  'LITTLE MERMAID': '🧜‍♀️',
  'Luca': '🌊',
  'MARVEL': '🦸',
  'Moana': '🌺',
  'MOANA': '🌺',
  'Mulan': '⚔️',
  'Pocahontas': '🍂',
  'Princess & The Frog': '🐸',
  'Princess Aurora': '🌹',
  'Rajah': '🐯',
  'Raya': '🐉',
  'Sleeping Beauty': '🌹',
  'SPIDERMAN': '🕷️',
  'Tangled': '🏮',
  'THOR': '🔨',
  'Up': '🎈',
  'UP': '🎈',
};

function themeWithEmoji(theme: string): string {
  return `${THEME_EMOJI[theme] || '🎨'} ${theme}`;
}

type BudgetLevel = 'budget' | 'reasonable' | 'splurge' | 'concierge';

const BUDGET_OPTIONS: { key: BudgetLevel; label: string; emoji: string; types: string[] }[] = [
  { key: 'budget', label: 'Budget', emoji: '🛏', types: ['Inside'] },
  { key: 'reasonable', label: 'Reasonable', emoji: '🪟', types: ['Oceanview', 'Oceanview (Porthole)'] },
  { key: 'splurge', label: 'Splurge', emoji: '🌊', types: ['Verandah'] },
  { key: 'concierge', label: 'Concierge', emoji: '👑', types: ['Concierge / Suite'] },
];

function ScoreBadge({ score }: { score: number }) {
  if (score >= 80) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400">
        Best Match
      </span>
    );
  }
  if (score >= 65) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400">
        Great
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
      Good
    </span>
  );
}

export default function StateroomGuidePageWrapper() {
  return (
    <Suspense>
      <StateroomGuidePage />
    </Suspense>
  );
}

function StateroomGuidePage() {
  const searchParams = useSearchParams();

  const [selectedShip, setSelectedShip] = useState<ShipName | ''>(() => {
    const sp = searchParams.get('ship');
    return sp && SHIP_ORDER.includes(sp as ShipName) ? sp as ShipName : '';
  });
  const [budget, setBudget] = useState<BudgetLevel | ''>(() => {
    const sp = searchParams.get('budget');
    return sp && ['value', 'moderate', 'premium', 'splurge'].includes(sp) ? sp as BudgetLevel : '';
  });
  const [partySize, setPartySize] = useState(() => {
    const sp = searchParams.get('party');
    const n = sp ? parseInt(sp, 10) : NaN;
    return !isNaN(n) && n >= 1 && n <= 20 ? n : 2;
  });
  const [travelParty, setTravelParty] = useState<TravelParty>(() => {
    const sp = searchParams.get('travel');
    return sp && ['couple', 'family-young', 'family-teens', 'multi-gen', 'friends', 'solo'].includes(sp) ? sp as TravelParty : '';
  });
  const [noiseSensitive, setNoiseSensitive] = useState(() => searchParams.get('noise') === '1');
  const [needsAccessible, setNeedsAccessible] = useState(() => searchParams.get('accessible') === '1');
  const [needsConnecting, setNeedsConnecting] = useState(() => searchParams.get('connecting') === '1');
  const [selectedTheme, setSelectedTheme] = useState(() => searchParams.get('theme') ?? '');
  const [selectedDeck, setSelectedDeck] = useState<number | ''>(() => {
    const sp = searchParams.get('deck');
    const n = sp ? parseInt(sp, 10) : NaN;
    return !isNaN(n) ? n : '';
  });
  const [selectedSection, setSelectedSection] = useState(() => searchParams.get('section') ?? '');
  const [expandedDeck, setExpandedDeck] = useState<number | null>(null);
  const [showAllRooms, setShowAllRooms] = useState<Record<number, boolean>>({});

  // Stateroom lookup
  const router = useRouter();
  const [lookupShip, setLookupShip] = useState<ShipName | ''>('');
  const [lookupRoom, setLookupRoom] = useState('');
  const [lookupNotFound, setLookupNotFound] = useState(false);

  // Number of staterooms → dynamic party size cap
  const [numStaterooms, setNumStaterooms] = useState(1);
  const maxPartyForRooms = numStaterooms * 5;

  // Count active filters for FilterDrawer badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedShip) count++;
    if (budget) count++;
    if (partySize !== 2) count++;
    if (travelParty) count++;
    if (noiseSensitive) count++;
    if (needsAccessible) count++;
    if (needsConnecting) count++;
    if (selectedTheme) count++;
    if (selectedDeck !== '') count++;
    if (selectedSection) count++;
    return count;
  }, [selectedShip, budget, partySize, travelParty, noiseSensitive, needsAccessible, needsConnecting, selectedTheme, selectedDeck, selectedSection]);

  // Generate shareable URL with current filter state
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams();
    if (selectedShip) params.set('ship', selectedShip);
    if (budget) params.set('budget', budget);
    if (partySize !== 2) params.set('party', String(partySize));
    if (travelParty) params.set('travel', travelParty);
    if (noiseSensitive) params.set('noise', '1');
    if (needsAccessible) params.set('accessible', '1');
    if (needsConnecting) params.set('connecting', '1');
    if (selectedTheme) params.set('theme', selectedTheme);
    if (selectedDeck !== '') params.set('deck', String(selectedDeck));
    if (selectedSection) params.set('section', selectedSection);
    const qs = params.toString();
    return `${window.location.origin}${window.location.pathname}${qs ? '?' + qs : ''}`;
  }, [selectedShip, budget, partySize, travelParty, noiseSensitive, needsAccessible, needsConnecting, selectedTheme, selectedDeck, selectedSection]);

  // Ships with themed rooms
  const hasThemes = selectedShip && ['Disney Wish', 'Disney Treasure', 'Disney Destiny', 'Disney Adventure'].includes(selectedShip);

  // Available themes for the current ship + budget filter
  const availableThemes = useMemo(() => {
    if (!selectedShip || !budget || !hasThemes) return [];
    const budgetTypes = BUDGET_OPTIONS.find(b => b.key === budget)?.types ?? [];
    const rooms = data[selectedShip] || [];
    const themeSet = new Set<string>();
    rooms.forEach(r => {
      const type = getCategoryType(r.category);
      if (budgetTypes.includes(type) && r.theme) themeSet.add(r.theme);
    });
    return Array.from(themeSet).sort();
  }, [selectedShip, budget, hasThemes]);

  // Scoring & filtering
  const { filtered, deckGroups, availableDecks, availableSections } = useMemo(() => {
    if (!selectedShip || !budget) return { filtered: [], deckGroups: [], availableDecks: [] as number[], availableSections: [] as string[] };

    const shipRooms = data[selectedShip] || [];
    const budgetTypes = BUDGET_OPTIONS.find(b => b.key === budget)?.types ?? [];
    const kidsDeckList = KIDS_DECKS[selectedShip] || [];
    const teenDeckList = TEEN_DECKS[selectedShip] || [];

    // Enrich all rooms
    const enriched: EnrichedRoom[] = shipRooms.map(r => ({
      ...r,
      deck: getDeck(r.stateroom),
      section: getSection(r, shipRooms),
      type: getCategoryType(r.category),
      typeEmoji: TYPE_EMOJI[getCategoryType(r.category)] || '',
      score: 0,
    }));

    // Hard filter (without deck/section, to derive available options)
    let baseRooms = enriched.filter(r => {
      if (!budgetTypes.includes(r.type)) return false;
      const perRoom = Math.ceil(partySize / numStaterooms);
      if (r.occupancy != null && r.occupancy < perRoom) return false;
      if (needsAccessible && (!r.accessible || r.accessible === 'NO')) return false;
      if (needsConnecting && (!r.connecting || r.connecting === 'NO')) return false;
      if (selectedTheme && r.theme !== selectedTheme) return false;
      return true;
    });

    // Derive available deck/section options from base results
    const deckSet = new Set(baseRooms.map(r => r.deck));
    const sectionSet = new Set(baseRooms.map(r => r.section));
    const sortedDecks = Array.from(deckSet).sort((a, b) => a - b);
    const sortedSections = ['Forward', 'Midship', 'Aft'].filter(s => sectionSet.has(s));

    // Apply deck/section filters
    let rooms = baseRooms;
    if (selectedDeck !== '') {
      rooms = rooms.filter(r => r.deck === selectedDeck);
    }
    if (selectedSection) {
      rooms = rooms.filter(r => r.section === selectedSection);
    }

    // Soft scoring
    // Compute deck range for "middle decks" scoring
    const allDecks = rooms.map(r => r.deck).filter(d => d > 0);
    const minDeck = Math.min(...allDecks, 1);
    const maxDeck = Math.max(...allDecks, 1);
    const midDeck = (minDeck + maxDeck) / 2;

    // Compute lower-deck threshold for multi-gen scoring
    const lowerDeckThreshold = minDeck + Math.floor((maxDeck - minDeck) / 3);

    rooms = rooms.map(r => {
      let score = 50;

      // Noise sensitive: prefer midship
      if (noiseSensitive && r.section === 'Midship') score += 20;
      // Noise sensitive: prefer middle decks (within 2 of center)
      if (noiseSensitive && Math.abs(r.deck - midDeck) <= 2) score += 15;

      // Travel party scoring
      if (travelParty === 'solo') {
        // Smaller rooms are fine — bonus for exact occupancy match (1-2)
        if (r.occupancy != null && r.occupancy <= 2) score += 10;
        // Midship for easy access to everything
        if (r.section === 'Midship') score += 10;
      } else if (travelParty === 'family-kids') {
        // Near Oceaneer Club / kids areas
        if (kidsDeckList.includes(r.deck)) score += 15;
      } else if (travelParty === 'family-teens') {
        // Near Edge & Vibe teen clubs
        if (teenDeckList.includes(r.deck)) score += 15;
      } else if (travelParty === 'couple') {
        // Quiet midship location
        if (r.section === 'Midship') score += 10;
        // Middle-to-upper decks (away from engine noise)
        if (r.deck >= midDeck) score += 10;
      } else if (travelParty === 'friends') {
        // Near pool/entertainment decks (upper decks)
        if (r.deck >= maxDeck - 2) score += 10;
        // Connecting rooms are a bonus for friends
        if (r.connecting && r.connecting.toUpperCase() !== 'NO') score += 10;
      } else if (travelParty === 'family-multi') {
        // Lower-to-mid decks for stability (less ship motion)
        if (r.deck <= lowerDeckThreshold) score += 10;
        // Midship for less motion
        if (r.section === 'Midship') score += 10;
        // Connecting rooms help multi-gen families
        if (r.connecting && r.connecting.toUpperCase() !== 'NO') score += 5;
      }

      // Exact occupancy match bonus
      if (r.occupancy != null && r.occupancy === partySize) score += 5;

      return { ...r, score: Math.min(score, 100) };
    });

    // Sort by score desc, deck asc, room number asc
    rooms.sort((a, b) => b.score - a.score || a.deck - b.deck || a.stateroom - b.stateroom);

    // Group by deck
    const deckMap = new Map<number, EnrichedRoom[]>();
    for (const r of rooms) {
      const arr = deckMap.get(r.deck) || [];
      arr.push(r);
      deckMap.set(r.deck, arr);
    }
    const groups = Array.from(deckMap.entries())
      .map(([deck, rooms]) => ({
        deck,
        rooms,
        topScore: Math.max(...rooms.map(r => r.score)),
      }))
      .sort((a, b) => b.topScore - a.topScore || a.deck - b.deck);

    return { filtered: rooms, deckGroups: groups, availableDecks: sortedDecks, availableSections: sortedSections };
  }, [selectedShip, budget, partySize, numStaterooms, travelParty, noiseSensitive, needsAccessible, needsConnecting, selectedTheme, selectedDeck, selectedSection]);

  const handleShipChange = (ship: ShipName | '') => {
    setSelectedShip(ship);
    setBudget('');
    setSelectedTheme('');
    setSelectedDeck('');
    setSelectedSection('');
    setExpandedDeck(null);
    setShowAllRooms({});
  };

  const handleBudgetChange = (b: BudgetLevel) => {
    setBudget(b);
    setSelectedTheme('');
    setSelectedDeck('');
    setSelectedSection('');
    setExpandedDeck(null);
    setShowAllRooms({});
  };

  const clearPreferences = () => {
    setBudget('');
    setNumStaterooms(1);
    setPartySize(2);
    setTravelParty('');
    setNoiseSensitive(false);
    setNeedsAccessible(false);
    setNeedsConnecting(false);
    setSelectedTheme('');
    setSelectedDeck('');
    setSelectedSection('');
    setExpandedDeck(null);
    setShowAllRooms({});
  };

  const handleLookup = () => {
    setLookupNotFound(false);
    const num = parseInt(lookupRoom, 10);
    if (!lookupShip || isNaN(num)) return;
    if (isValidStateroomForShip(num, lookupShip)) {
      router.push(`/Secret-menU/stateroom?ship=${encodeURIComponent(lookupShip)}&room=${num}`);
    } else {
      setLookupNotFound(true);
    }
  };

  const handleNumStateroomsChange = (n: number) => {
    setNumStaterooms(n);
    if (partySize > n * 5) setPartySize(n * 5);
  };

  const selectCls = "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent";

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/Secret-menU"
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Cruise Guide
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          🛏 Stateroom Guide
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Find the perfect stateroom based on your travel party, budget, and preferences.
        </p>
      </div>

      {/* Stateroom Lookup */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">🔍 Room Lookup</h2>
        <div className="flex gap-3">
          <select
            value={lookupShip}
            onChange={(e) => { setLookupShip(e.target.value as ShipName | ''); setLookupNotFound(false); }}
            className={selectCls + ' flex-1'}
          >
            <option value="">Ship...</option>
            {SHIP_ORDER.map((ship) => (
              <option key={ship} value={ship}>{ship.replace('Disney ', '')}</option>
            ))}
          </select>
          <input
            type="text"
            inputMode="numeric"
            value={lookupRoom}
            onChange={(e) => { setLookupRoom(e.target.value.replace(/\D/g, '').slice(0, 5)); setLookupNotFound(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleLookup(); }}
            placeholder="Room #"
            className="w-28 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent text-center font-mono"
          />
          <button
            type="button"
            onClick={handleLookup}
            disabled={!lookupShip || !lookupRoom}
            className="btn-disney px-4 py-3 rounded-xl whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Look Up
          </button>
        </div>

        {lookupNotFound && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            Room {lookupRoom} not found on {lookupShip}.
          </p>
        )}
      </div>

      {/* Preference Panel */}
      <FilterDrawer activeCount={activeFilterCount} onClear={clearPreferences}>
      <div className="bg-white dark:bg-slate-800 md:rounded-2xl md:p-6 md:shadow-lg md:border md:border-slate-200 md:dark:border-slate-700 mb-6">
        {/* Ship Select */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Ship</label>
          <select
            value={selectedShip}
            onChange={(e) => handleShipChange(e.target.value as ShipName | '')}
            className={selectCls}
          >
            <option value="">Select a ship...</option>
            {SHIP_ORDER.map((ship) => (
              <option key={ship} value={ship}>{ship}</option>
            ))}
          </select>
        </div>

        {selectedShip && (
          <>
            {/* Budget Chips */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Budget</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {BUDGET_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleBudgetChange(opt.key)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors text-center ${
                      budget === opt.key
                        ? 'bg-disney-blue text-white border-disney-blue dark:bg-disney-gold dark:text-slate-900 dark:border-disney-gold'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                    }`}
                  >
                    <span className="mr-1">{opt.emoji}</span> {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Staterooms & Party Size — side by side */}
            <div className="flex gap-4 mb-5">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Staterooms</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleNumStateroomsChange(Math.max(1, numStaterooms - 1))}
                    disabled={numStaterooms <= 1}
                    className="w-9 h-9 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-lg font-bold text-slate-900 dark:text-white">{numStaterooms}</span>
                  <button
                    type="button"
                    onClick={() => handleNumStateroomsChange(Math.min(4, numStaterooms + 1))}
                    disabled={numStaterooms >= 4}
                    className="w-9 h-9 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Party Size</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPartySize(Math.max(1, partySize - 1))}
                    disabled={partySize <= 1}
                    className="w-9 h-9 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-lg font-bold text-slate-900 dark:text-white">{partySize}</span>
                  <button
                    type="button"
                    onClick={() => setPartySize(Math.min(maxPartyForRooms, partySize + 1))}
                    disabled={partySize >= maxPartyForRooms}
                    className="w-9 h-9 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            {numStaterooms > 1 && (
              <p className="text-xs text-slate-400 dark:text-slate-500 -mt-4 mb-5">
                ~{Math.ceil(partySize / numStaterooms)} per room across {numStaterooms} staterooms
              </p>
            )}

            {/* Travel Party */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Who&apos;s Traveling?</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TRAVEL_PARTY_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setTravelParty(travelParty === opt.key ? '' : opt.key)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors text-left ${
                      travelParty === opt.key
                        ? 'bg-disney-blue text-white border-disney-blue dark:bg-disney-gold dark:text-slate-900 dark:border-disney-gold'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                    }`}
                  >
                    <span className="mr-1">{opt.emoji}</span> {opt.label}
                    <span className={`block text-[10px] mt-0.5 ${
                      travelParty === opt.key
                        ? 'text-white/70 dark:text-slate-900/60'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}>{opt.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Preferences */}
            <div className="mb-5 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noiseSensitive}
                  onChange={(e) => setNoiseSensitive(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-disney-blue dark:text-disney-gold focus:ring-disney-blue dark:focus:ring-disney-gold"
                />
                <div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">Noise sensitive</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">Prefer midship, middle deck rooms</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={needsAccessible}
                  onChange={(e) => setNeedsAccessible(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-disney-blue dark:text-disney-gold focus:ring-disney-blue dark:focus:ring-disney-gold"
                />
                <div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">Accessible room needed</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">Wheelchair accessible staterooms only</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={needsConnecting}
                  onChange={(e) => setNeedsConnecting(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-disney-blue dark:text-disney-gold focus:ring-disney-blue dark:focus:ring-disney-gold"
                />
                <div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">Connecting room needed</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">Rooms that connect to an adjacent stateroom</span>
                </div>
              </label>
            </div>

            {/* Theme dropdown (conditional) */}
            {hasThemes && budget && availableThemes.length > 0 && (
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Theme</label>
                <select
                  value={selectedTheme}
                  onChange={(e) => { setSelectedTheme(e.target.value); setExpandedDeck(null); setShowAllRooms({}); }}
                  className={selectCls}
                >
                  <option value="">All themes</option>
                  {availableThemes.map((theme) => (
                    <option key={theme} value={theme}>{themeWithEmoji(theme)}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Deck & Section filters */}
            {budget && availableDecks.length > 0 && (
              <div className="flex gap-3 mb-5">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Deck</label>
                  <select
                    value={selectedDeck}
                    onChange={(e) => { setSelectedDeck(e.target.value ? Number(e.target.value) : ''); setExpandedDeck(null); setShowAllRooms({}); }}
                    className={selectCls}
                  >
                    <option value="">All decks</option>
                    {availableDecks.map((d) => (
                      <option key={d} value={d}>Deck {d}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Section</label>
                  <div className="flex gap-1.5">
                    {availableSections.map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => { setSelectedSection(selectedSection === sec ? '' : sec); setExpandedDeck(null); setShowAllRooms({}); }}
                        className={`flex-1 px-2 py-3 rounded-xl text-xs font-medium border transition-colors ${
                          selectedSection === sec
                            ? 'bg-disney-blue text-white border-disney-blue dark:bg-disney-gold dark:text-slate-900 dark:border-disney-gold'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                        }`}
                      >
                        {sec}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      </FilterDrawer>

      {/* Summary Bar */}
      {selectedShip && budget && (
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            <span className="font-bold text-slate-900 dark:text-white">{filtered.length}</span>{' '}
            {filtered.length === 1 ? 'room' : 'rooms'} found
          </p>
          <div className="flex items-center gap-3">
            <ShareButton
              title="Stateroom Guide"
              text="Check out these Disney cruise stateroom recommendations!"
              url={shareUrl}
            />
            <button
              type="button"
              onClick={clearPreferences}
              className="text-sm text-disney-blue dark:text-disney-gold hover:underline"
            >
              Clear preferences
            </button>
          </div>
        </div>
      )}

      {/* No results */}
      {selectedShip && budget && filtered.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No rooms match</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Try adjusting your preferences or party size.</p>
        </div>
      )}

      {/* Deck Group Cards */}
      {selectedShip && budget && deckGroups.map(({ deck, rooms, topScore }) => {
        const isExpanded = expandedDeck === deck;
        const showAll = showAllRooms[deck] ?? false;
        const displayRooms = showAll ? rooms : rooms.slice(0, 20);
        const sections = [...new Set(rooms.map(r => r.section))];
        const types = [...new Set(rooms.map(r => `${r.typeEmoji} ${r.type}`))];
        const themes = [...new Set(rooms.filter(r => r.theme).map(r => r.theme!))];

        return (
          <div
            key={deck}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 mb-4 overflow-hidden"
          >
            {/* Deck Header */}
            <button
              type="button"
              onClick={() => { setExpandedDeck(isExpanded ? null : deck); }}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-disney-blue dark:bg-disney-gold flex items-center justify-center text-white dark:text-slate-900 font-bold text-sm flex-shrink-0">
                  {deck}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-bold text-slate-900 dark:text-white">Deck {deck}</span>
                    <ScoreBadge score={topScore} />
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
                {themes.map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">{themeWithEmoji(t)}</span>
                ))}
              </div>
            )}

            {/* Room Rows */}
            {isExpanded && (
              <div className="border-t border-slate-100 dark:border-slate-700">
                {displayRooms.map((r) => (
                  <Link
                    key={r.stateroom}
                    href={`/Secret-menU/stateroom?ship=${encodeURIComponent(selectedShip)}&room=${r.stateroom}`}
                    className="flex items-center justify-between px-5 py-3 border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-mono font-bold text-slate-900 dark:text-white w-14">{r.stateroom}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs text-slate-500 dark:text-slate-400">Cat. {r.category}</span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">{r.typeEmoji} {r.type}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <span className="text-xs text-slate-400 dark:text-slate-500">{r.section}</span>
                          {r.occupancy && (
                            <span className="text-xs text-slate-400 dark:text-slate-500">Sleeps {r.occupancy}</span>
                          )}
                          {r.theme && (
                            <span className="text-xs text-purple-600 dark:text-purple-400">{themeWithEmoji(r.theme)}</span>
                          )}
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
                      <ScoreBadge score={r.score} />
                      <svg className="w-4 h-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}

                {/* Show all button */}
                {!showAll && rooms.length > 20 && (
                  <button
                    type="button"
                    onClick={() => setShowAllRooms(prev => ({ ...prev, [deck]: true }))}
                    className="w-full py-3 text-sm font-medium text-disney-blue dark:text-disney-gold hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    Show all {rooms.length} rooms on Deck {deck}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Prompt to get started */}
      {!selectedShip && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
          <div className="text-4xl mb-3">🚢</div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Choose a Ship</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Select a ship above to start finding your ideal stateroom.</p>
        </div>
      )}

      {selectedShip && !budget && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
          <div className="text-4xl mb-3">💰</div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Pick a Budget</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Choose a budget tier to see matching staterooms on {selectedShip}.</p>
        </div>
      )}
    </div>
  );
}
