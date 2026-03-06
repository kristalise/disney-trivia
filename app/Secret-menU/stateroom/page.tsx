'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import stateroomData from '@/data/stateroom-data.json';
import categoryMetadata from '@/data/category-metadata.json';
import { getDeck as getDeckUtil, getSection, getSide } from '@/lib/stateroom-utils';
import { getVenuesByDeck, getCategories } from '@/lib/unified-data';

const venueCategories = getCategories();

const categoryMeta = categoryMetadata as Record<string, Record<string, CategoryMeta>>;

interface CategoryMeta {
  name: string;
  description: string;
  sleeps: number | string;
  sqft: string;
  sqm: string;
  includesVerandah: boolean;
  layoutImage: string | null;
}

const SHIPS = [
  'Disney Magic', 'Disney Wonder', 'Disney Dream', 'Disney Fantasy',
  'Disney Wish', 'Disney Treasure', 'Disney Destiny', 'Disney Adventure',
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

interface Review {
  id: string;
  ship_name: string;
  stateroom_number: number;
  sail_start_date: string;
  sail_end_date: string | null;
  stateroom_rating: number;
  sailing_rating: number | null;
  num_passengers: number | null;
  adults: number | null;
  children: number | null;
  infants: number | null;
  occasions: string | null;
  boarding_port: string | null;
  ports_of_call: string | null;
  departure_port: string | null;
  purchased_from: string | null;
  price_paid: number | null;
  review_text: string | null;
  created_at: string;
  reviewer_name?: string;
  reviewer_avatar?: string | null;
  reviewer_id?: string;
  reviewer_handle?: string | null;
  sailing_id?: string | null;
  sailing_ship?: string | null;
  sailing_start?: string | null;
  sailing_itinerary?: string | null;
}

interface ReviewGroup {
  reviewer_id: string | undefined;
  reviewer_name: string;
  reviewer_avatar: string | null | undefined;
  reviewer_handle: string | null | undefined;
  reviews: Review[];
}

const data = stateroomData as Record<ShipName, Stateroom[]>;

// Derive stateroom type from category code (1-3=Concierge, 4-5=Verandah, 6=Oceanview, 7=Porthole, 8-11=Inside)
function getCategoryType(category: string | null): string {
  if (!category) return 'Unknown';
  const num = parseInt(category.replace(/^0+/, ''), 10);
  if (isNaN(num)) return 'Unknown';
  if (num >= 1 && num <= 3) return 'Concierge / Suite';
  if (num >= 4 && num <= 5) return 'Verandah';
  if (num === 6) return 'Oceanview';
  if (num === 7) return 'Oceanview (Porthole)';
  if (num >= 8 && num <= 11) return 'Inside';
  return 'Other';
}

// Derive deck number from stateroom number
function getDeck(stateroom: number): number {
  const s = stateroom.toString();
  if (s.length === 5) return parseInt(s.slice(0, 2), 10);
  if (s.length === 4) return parseInt(s[0], 10);
  return 0;
}

const STATEROOM_TYPES = ['Concierge / Suite', 'Verandah', 'Oceanview', 'Oceanview (Porthole)', 'Inside'] as const;
const TYPE_EMOJI: Record<string, string> = {
  'Concierge / Suite': '👑',
  'Verandah': '🌊',
  'Oceanview': '🪟',
  'Oceanview (Porthole)': '⭕',
  'Inside': '🛏',
};

// Franchise IP color mapping for theme pills
const THEME_COLORS: Record<string, { bg: string; text: string; emoji: string }> = {
  // Frozen franchise
  'Frozen': { bg: 'bg-sky-100 dark:bg-sky-900/40', text: 'text-sky-700 dark:text-sky-300', emoji: '❄️' },
  'FROZEN': { bg: 'bg-sky-100 dark:bg-sky-900/40', text: 'text-sky-700 dark:text-sky-300', emoji: '❄️' },
  'ELSA SUITE': { bg: 'bg-sky-100 dark:bg-sky-900/40', text: 'text-sky-700 dark:text-sky-300', emoji: '❄️' },
  'ANNA SUITE': { bg: 'bg-sky-100 dark:bg-sky-900/40', text: 'text-sky-700 dark:text-sky-300', emoji: '❄️' },
  // Marvel franchise
  'MARVEL': { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', emoji: '🦸' },
  'IRONMAN': { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', emoji: '🦾' },
  'Iron Man': { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', emoji: '🦾' },
  'SPIDERMAN': { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', emoji: '🕷️' },
  'THOR': { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', emoji: '🔨' },
  'Incredibles': { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', emoji: '🦸' },
  'Incredibles/Incredisuite': { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', emoji: '🦸' },
  'Hercules': { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', emoji: '⚡' },
  'Hercules/Hero Suite': { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', emoji: '⚡' },
  'Big Hero 6': { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', emoji: '🤖' },
  // Ocean / tropical franchise
  'Finding Nemo': { bg: 'bg-cyan-100 dark:bg-cyan-900/40', text: 'text-cyan-700 dark:text-cyan-300', emoji: '🐠' },
  'FINDING NEMO': { bg: 'bg-cyan-100 dark:bg-cyan-900/40', text: 'text-cyan-700 dark:text-cyan-300', emoji: '🐠' },
  'Little Mermaid': { bg: 'bg-cyan-100 dark:bg-cyan-900/40', text: 'text-cyan-700 dark:text-cyan-300', emoji: '🧜‍♀️' },
  'LITTLE MERMAID': { bg: 'bg-cyan-100 dark:bg-cyan-900/40', text: 'text-cyan-700 dark:text-cyan-300', emoji: '🧜‍♀️' },
  'Moana': { bg: 'bg-teal-100 dark:bg-teal-900/40', text: 'text-teal-700 dark:text-teal-300', emoji: '🌺' },
  'MOANA': { bg: 'bg-teal-100 dark:bg-teal-900/40', text: 'text-teal-700 dark:text-teal-300', emoji: '🌺' },
  'Luca': { bg: 'bg-cyan-100 dark:bg-cyan-900/40', text: 'text-cyan-700 dark:text-cyan-300', emoji: '🌊' },
  // Princess franchise
  'Tangled': { bg: 'bg-violet-100 dark:bg-violet-900/40', text: 'text-violet-700 dark:text-violet-300', emoji: '🏮' },
  'Cinderella': { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300', emoji: '👠' },
  'Sleeping Beauty': { bg: 'bg-pink-100 dark:bg-pink-900/40', text: 'text-pink-700 dark:text-pink-300', emoji: '🌹' },
  'Princess Aurora': { bg: 'bg-pink-100 dark:bg-pink-900/40', text: 'text-pink-700 dark:text-pink-300', emoji: '🌹' },
  'Briar Rose': { bg: 'bg-pink-100 dark:bg-pink-900/40', text: 'text-pink-700 dark:text-pink-300', emoji: '🌹' },
  'Brave': { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300', emoji: '🏹' },
  'Mulan': { bg: 'bg-rose-100 dark:bg-rose-900/40', text: 'text-rose-700 dark:text-rose-300', emoji: '⚔️' },
  'Pocahontas': { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300', emoji: '🍂' },
  'Princess & The Frog': { bg: 'bg-lime-100 dark:bg-lime-900/40', text: 'text-lime-700 dark:text-lime-300', emoji: '🐸' },
  'Raya': { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300', emoji: '🐉' },
  // Aladdin
  'Aladdin': { bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-700 dark:text-indigo-300', emoji: '🧞' },
  'ALADDIN': { bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-700 dark:text-indigo-300', emoji: '🧞' },
  'JASMIN': { bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-700 dark:text-indigo-300', emoji: '🧞' },
  // Encanto
  'Encanto': { bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/40', text: 'text-fuchsia-700 dark:text-fuchsia-300', emoji: '🦋' },
  'ENCANTO': { bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/40', text: 'text-fuchsia-700 dark:text-fuchsia-300', emoji: '🦋' },
  // Lion King / Jungle
  'Lion King': { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300', emoji: '🦁' },
  'LION KING': { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300', emoji: '🦁' },
  'Bagheera': { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300', emoji: '🐆' },
  'Rajah': { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300', emoji: '🐯' },
  // Classic / Other
  'Fantasia': { bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-700 dark:text-indigo-300', emoji: '🌙' },
  'Up': { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-700 dark:text-yellow-300', emoji: '🎈' },
  'UP': { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-700 dark:text-yellow-300', emoji: '🎈' },
  'Epcot': { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-300', emoji: '🌐' },
};

const DEFAULT_THEME_COLOR = { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300', emoji: '🎨' };

function ThemePill({ theme }: { theme: string }) {
  const colors = THEME_COLORS[theme] || DEFAULT_THEME_COLOR;
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${colors.bg} ${colors.text}`}>
      {colors.emoji} {theme}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm text-slate-900 dark:text-white text-right ml-4 max-w-[60%]">
        {value || '—'}
      </span>
    </div>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}


export default function StateroomReviewPage() {
  return (
    <Suspense>
      <StateroomReviewContent />
    </Suspense>
  );
}

function StateroomReviewContent() {
  const searchParams = useSearchParams();
  const [selectedShip, setSelectedShip] = useState<ShipName | ''>('');
  const [lookupMode, setLookupMode] = useState<'browse' | 'search'>('browse');
  const [initializedFromParams, setInitializedFromParams] = useState(false);

  // Search mode state
  const [stateroomInput, setStateroomInput] = useState('');
  const [searched, setSearched] = useState(false);

  // Browse (cascading dropdown) state
  const [selectedType, setSelectedType] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('');
  const [selectedDeck, setSelectedDeck] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');

  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageStateroomRating, setAverageStateroomRating] = useState<number | null>(null);
  const [averageSailingRating, setAverageSailingRating] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);


  // Auto-select ship & type from URL params (e.g. from ships page)
  useEffect(() => {
    if (initializedFromParams) return;
    const shipParam = searchParams.get('ship');
    const typeParam = searchParams.get('type');
    const roomParam = searchParams.get('room');
    if (shipParam && SHIPS.includes(shipParam as ShipName)) {
      setSelectedShip(shipParam as ShipName);
      if (roomParam) {
        // Direct room link — switch to search mode with room number
        setLookupMode('search');
        setStateroomInput(roomParam);
        setSearched(true);
      } else if (typeParam && STATEROOM_TYPES.includes(typeParam as typeof STATEROOM_TYPES[number])) {
        setSelectedType(typeParam);
      }
      setInitializedFromParams(true);
    }
  }, [searchParams, initializedFromParams]);

  // Rooms for the selected ship
  const shipRooms = useMemo(() => {
    if (!selectedShip) return [];
    return data[selectedShip] || [];
  }, [selectedShip]);

  // Available stateroom types for selected ship
  const availableTypes = useMemo(() => {
    const typeSet = new Set<string>();
    shipRooms.forEach((r) => {
      const t = getCategoryType(r.category);
      if (t !== 'Unknown' && t !== 'Other') typeSet.add(t);
    });
    return STATEROOM_TYPES.filter((t) => typeSet.has(t));
  }, [shipRooms]);

  // Rooms filtered by selected type
  const roomsByType = useMemo(() => {
    if (!selectedType) return [];
    return shipRooms.filter((r) => getCategoryType(r.category) === selectedType);
  }, [shipRooms, selectedType]);

  // Available themes for selected type
  const availableThemes = useMemo(() => {
    const themeSet = new Set<string>();
    roomsByType.forEach((r) => {
      if (r.theme) themeSet.add(r.theme);
    });
    return Array.from(themeSet).sort();
  }, [roomsByType]);

  // Rooms filtered by theme (pass-through if no themes or "All" selected)
  const roomsByTheme = useMemo(() => {
    if (!selectedTheme) return roomsByType;
    return roomsByType.filter((r) => r.theme === selectedTheme);
  }, [roomsByType, selectedTheme]);

  // Available decks for selected type (+ theme)
  const availableDecks = useMemo(() => {
    const deckSet = new Set<number>();
    roomsByTheme.forEach((r) => {
      const d = getDeck(r.stateroom);
      if (d > 0) deckSet.add(d);
    });
    return Array.from(deckSet).sort((a, b) => a - b);
  }, [roomsByTheme]);

  // Rooms filtered by deck
  const roomsByDeck = useMemo(() => {
    if (!selectedDeck) return [];
    const deckNum = parseInt(selectedDeck, 10);
    return roomsByTheme.filter((r) => getDeck(r.stateroom) === deckNum)
      .sort((a, b) => a.stateroom - b.stateroom);
  }, [roomsByTheme, selectedDeck]);

  // The resolved stateroom (from either mode)
  const activeRoomNumber = lookupMode === 'search'
    ? (searched ? stateroomInput : '')
    : selectedRoom;

  const result = useMemo<Stateroom | null>(() => {
    if (!selectedShip || !activeRoomNumber) return null;
    const num = parseInt(activeRoomNumber, 10);
    if (isNaN(num)) return null;
    const rooms = data[selectedShip];
    return rooms?.find((r) => r.stateroom === num) ?? null;
  }, [selectedShip, activeRoomNumber]);

  const groupedReviews = useMemo((): ReviewGroup[] => {
    const groups: ReviewGroup[] = [];
    const seen = new Map<string, number>();
    for (const r of reviews) {
      const key = r.reviewer_id || `anon-${r.id}`;
      if (r.reviewer_id && seen.has(key)) {
        groups[seen.get(key)!].reviews.push(r);
      } else {
        seen.set(key, groups.length);
        groups.push({
          reviewer_id: r.reviewer_id,
          reviewer_name: r.reviewer_name || 'Anonymous',
          reviewer_avatar: r.reviewer_avatar,
          reviewer_handle: r.reviewer_handle,
          reviews: [r],
        });
      }
    }
    return groups;
  }, [reviews]);

  const fetchReviews = useCallback(async () => {
    if (!selectedShip || !activeRoomNumber) return;
    setReviewsLoading(true);
    try {
      const res = await fetch(`/api/stateroom-reviews?ship=${encodeURIComponent(selectedShip)}&room=${encodeURIComponent(activeRoomNumber)}`);
      if (res.ok) {
        const d = await res.json();
        setReviews(d.reviews);
        setAverageStateroomRating(d.averageStateroomRating);
        setAverageSailingRating(d.averageSailingRating);
        setTotalReviews(d.totalReviews);
      }
    } catch { /* reviews are supplemental */ } finally { setReviewsLoading(false); }
  }, [selectedShip, activeRoomNumber]);

  // Fetch reviews when a room is resolved
  useEffect(() => {
    if (selectedShip && activeRoomNumber) fetchReviews();
  }, [selectedShip, activeRoomNumber, fetchReviews]);

  // Reset downstream state when ship changes
  const handleShipChange = (ship: ShipName | '') => {
    setSelectedShip(ship);
    setSelectedType('');
    setSelectedDeck('');
    setSelectedRoom('');
    setStateroomInput('');
    setSearched(false);
    setReviews([]);
    setTotalReviews(0);
    setAverageStateroomRating(null);
    setAverageSailingRating(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
  };

  const hasThemeFields = selectedShip && ['Disney Wish', 'Disney Treasure', 'Disney Destiny', 'Disney Adventure'].includes(selectedShip);
  const selectCls = "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/Secret-menU" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Cruise Guide
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">🛏 Stateroom Lookup & Reviews</h1>
        <p className="text-slate-600 dark:text-slate-400">Look up details about any Disney Cruise Line stateroom and read community reviews.</p>
      </div>

      {/* Ship Selector */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Ship</label>
          <select value={selectedShip} onChange={(e) => handleShipChange(e.target.value as ShipName | '')}
            className={selectCls}>
            <option value="">Select a ship...</option>
            {SHIPS.map((ship) => <option key={ship} value={ship}>{ship}</option>)}
          </select>
        </div>

        {selectedShip && (
          <>
            {/* Mode Toggle */}
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Find your stateroom</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setLookupMode('browse'); setStateroomInput(''); setSearched(false); }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    lookupMode === 'browse'
                      ? 'bg-disney-blue text-white border-disney-blue dark:bg-disney-gold dark:text-slate-900 dark:border-disney-gold'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                  }`}
                >
                  Browse
                </button>
                <button
                  type="button"
                  onClick={() => { setLookupMode('search'); setSelectedType(''); setSelectedTheme(''); setSelectedDeck(''); setSelectedRoom(''); }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    lookupMode === 'search'
                      ? 'bg-disney-blue text-white border-disney-blue dark:bg-disney-gold dark:text-slate-900 dark:border-disney-gold'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                  }`}
                >
                  Search by #
                </button>
              </div>
            </div>

            {lookupMode === 'browse' ? (
              <div className="space-y-4">
                {/* Stateroom Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Stateroom Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => { setSelectedType(type); setSelectedTheme(''); setSelectedDeck(''); setSelectedRoom(''); }}
                        className={`px-4 py-3 rounded-xl text-sm font-medium border transition-colors text-left ${
                          selectedType === type
                            ? 'bg-disney-blue text-white border-disney-blue dark:bg-disney-gold dark:text-slate-900 dark:border-disney-gold'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                        }`}
                      >
                        <span className="mr-2">{TYPE_EMOJI[type] || ''}</span>{type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme (only for ships with themed rooms) */}
                {selectedType && availableThemes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Theme</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => { setSelectedTheme(''); setSelectedDeck(''); setSelectedRoom(''); }}
                        className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                          !selectedTheme
                            ? 'bg-disney-blue text-white border-disney-blue dark:bg-disney-gold dark:text-slate-900 dark:border-disney-gold'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                        }`}
                      >
                        All
                      </button>
                      {availableThemes.map((theme) => (
                        <button
                          key={theme}
                          type="button"
                          onClick={() => { setSelectedTheme(theme); setSelectedDeck(''); setSelectedRoom(''); }}
                          className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                            selectedTheme === theme
                              ? 'bg-disney-blue text-white border-disney-blue dark:bg-disney-gold dark:text-slate-900 dark:border-disney-gold'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                          }`}
                        >
                          {theme}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deck */}
                {selectedType && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Deck</label>
                    <div className="flex flex-wrap gap-2">
                      {availableDecks.map((deck) => (
                        <button
                          key={deck}
                          type="button"
                          onClick={() => { setSelectedDeck(deck.toString()); setSelectedRoom(''); }}
                          className={`w-12 h-12 rounded-xl text-sm font-medium border transition-colors ${
                            selectedDeck === deck.toString()
                              ? 'bg-disney-blue text-white border-disney-blue dark:bg-disney-gold dark:text-slate-900 dark:border-disney-gold'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                          }`}
                        >
                          {deck}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Room Number */}
                {selectedDeck && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Stateroom Number
                      <span className="font-normal text-slate-400 dark:text-slate-500 ml-1">({roomsByDeck.length} rooms)</span>
                    </label>
                    <select
                      value={selectedRoom}
                      onChange={(e) => setSelectedRoom(e.target.value)}
                      className={selectCls}
                    >
                      <option value="">Select a stateroom...</option>
                      {roomsByDeck.map((r) => (
                        <option key={r.stateroom} value={r.stateroom.toString()}>
                          {r.stateroom} — Cat. {r.category}{r.occupancy ? ` (sleeps ${r.occupancy})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Stateroom Number</label>
                  <input type="text" inputMode="numeric" pattern="[0-9]*" value={stateroomInput}
                    onChange={(e) => { setStateroomInput(e.target.value.replace(/\D/g, '')); setSearched(false); }} placeholder="e.g. 2050"
                    className={selectCls} />
                </div>
                <button type="submit" disabled={!stateroomInput}
                  className="w-full px-6 py-3 rounded-xl font-medium btn-disney disabled:opacity-50 disabled:cursor-not-allowed">
                  Look Up Stateroom
                </button>
              </form>
            )}
          </>
        )}
      </div>

      {/* Stateroom Details */}
      {selectedShip && activeRoomNumber && (
        <>
          {result ? (() => {
            const catMeta = selectedShip && result.category
              ? categoryMeta[selectedShip]?.[result.category] ?? null
              : null;
            return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                <div className="text-3xl">🚢</div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedShip} — Stateroom {result.stateroom}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Category {result.category} — {catMeta?.name || getCategoryType(result.category)}
                  </p>
                </div>
              </div>

              {/* Category layout image & description */}
              {catMeta && (
                <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  {catMeta.layoutImage && (
                    <div className="mb-3 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900">
                      <img
                        src={catMeta.layoutImage}
                        alt={`${catMeta.name} layout`}
                        className="w-full h-auto"
                      />
                    </div>
                  )}
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{catMeta.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-disney-blue/10 text-disney-blue dark:bg-disney-gold/20 dark:text-disney-gold">
                        {result.category}
                      </span>
                      {catMeta.includesVerandah && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          {(catMeta.name || '').toLowerCase().includes('garden view') ? 'Garden View Verandah'
                            : (catMeta.name || '').toLowerCase().includes('reef view') ? 'Reef View Verandah'
                            : 'Oceanview Verandah'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {(catMeta?.name || '').toLowerCase().includes('concierge') && (
                        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-disney-gold/20 text-disney-gold">
                          CONCIERGE
                        </span>
                      )}
                      {result.theme && <ThemePill theme={result.theme} />}
                    </div>
                  </div>
                </div>
              )}

              {/* Theme pill fallback when no category metadata */}
              {!catMeta && result.theme && (
                <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-end">
                  <ThemePill theme={result.theme} />
                </div>
              )}

              <div className="space-y-0">
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Category</span>
                  <span className="text-sm text-slate-900 dark:text-white text-right">
                    {catMeta?.name || getCategoryType(result.category)}
                  </span>
                </div>
                <div className="py-2 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Location</span>
                    <span className="text-sm text-slate-900 dark:text-white text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 mr-1.5">
                        Deck {getDeck(result.stateroom)}
                      </span>
                      {getSection(result, shipRooms)} · {getSide(result.stateroom) === 'port' ? 'Port Side' : 'Starboard Side'}
                    </span>
                  </div>
                  {(() => {
                    const deckNum = getDeck(result.stateroom);
                    const section = getSection(result, shipRooms);
                    const sectionKey = section === 'Forward' ? 'fwd' : section === 'Midship' ? 'mid' : 'aft';

                    // Venues directly above (deck + 1, matching section)
                    const aboveVenues = deckNum > 0
                      ? getVenuesByDeck(selectedShip, deckNum + 1).filter(({ instance }) =>
                          instance.position.includes(sectionKey)
                        )
                      : [];

                    // Venues on the same level
                    const deckVenues = deckNum > 0 ? getVenuesByDeck(selectedShip, deckNum) : [];

                    if (aboveVenues.length === 0 && deckVenues.length === 0) return null;
                    return (
                      <div className="mt-2 space-y-2">
                        {aboveVenues.length > 0 && (
                          <div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1.5">Venue above (potential noise)</p>
                            <div className="flex flex-wrap gap-1.5">
                              {aboveVenues.map(({ venue, instance }) => (
                                <Link
                                  key={venue.id}
                                  href={`/venues/${venue.id}`}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                                >
                                  <span>{venueCategories[venue.category]?.emoji || '📍'}</span>
                                  <span>{instance.name || venue.name}</span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                        {deckVenues.length > 0 && (
                          <div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1.5">Venues on the same level (convenience & traffic)</p>
                            <div className="flex flex-wrap gap-1.5">
                              {deckVenues.map(({ venue, instance }) => (
                                <Link
                                  key={venue.id}
                                  href={`/venues/${venue.id}`}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                                >
                                  <span>{venueCategories[venue.category]?.emoji || '📍'}</span>
                                  <span>{instance.name || venue.name}</span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Capacity</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    Sleeps max. {result.occupancy ?? '—'}
                  </span>
                </div>
                {catMeta && (
                  <DetailRow label="Area" value={`${catMeta.sqft} sq. ft. | ${catMeta.sqm} m²`} />
                )}
                <div className="flex justify-between items-start py-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Bedding</span>
                  <div className="text-sm text-slate-900 dark:text-white text-right ml-4 max-w-[60%]">
                    {result.bedding ? result.bedding.split(', ').map((b, i) => {
                      const match = b.match(/^(.+?)\s*\(([^)]+)\)$/);
                      return <div key={i}>{match ? `${match[1]} (${match[2]})` : b}</div>;
                    }) : '—'}
                  </div>
                </div>
                <DetailRow label="Connecting" value={result.connecting === 'NO' ? 'None' : result.connecting} />
                <DetailRow label="Accessible" value={result.accessible === 'NO' ? 'No' : result.accessible || 'No'} />
                <DetailRow label="Verandah Partitions" value={result.verandahPartitions} />
                <DetailRow label="Assembly Station" value={[result.assemblyStation, result.assemblyLocation].filter(Boolean).join(' · ') || null} />
                <DetailRow label="Assembly Section" value={[result.assemblySide, result.assemblySection].filter(Boolean).join(' · ') || null} />
                {result.notes && <DetailRow label="Notes" value={result.notes} />}
              </div>
            </div>
            );
          })() : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Stateroom Not Found</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">No stateroom {activeRoomNumber} found on {selectedShip}.</p>
            </div>
          )}

          {/* Community Reviews */}
          <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Community Reviews for {selectedShip} #{activeRoomNumber}</h3>
            {reviewsLoading ? (
              <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">Loading reviews...</div>
            ) : totalReviews > 0 ? (
              <>
                <div className="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Stateroom</p>
                    <div className="flex items-center gap-2">
                      <StarDisplay rating={Math.round(averageStateroomRating!)} />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{averageStateroomRating}</span>
                    </div>
                  </div>
                  {averageSailingRating && (
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Sailing</p>
                      <div className="flex items-center gap-2">
                        <StarDisplay rating={Math.round(averageSailingRating)} />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{averageSailingRating}</span>
                      </div>
                    </div>
                  )}
                  <span className="text-sm text-slate-500 dark:text-slate-400">{totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</span>
                </div>
                <div className="space-y-4">
                  {groupedReviews.map((group) => (
                    <div key={group.reviewer_id || group.reviews[0].id} className="pb-4 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0">
                      {group.reviewer_id && (
                        <Link href={`/profile/${group.reviewer_handle || group.reviewer_id}`} className="flex items-center gap-2 hover:underline mb-2">
                          {group.reviewer_avatar ? (
                            <img src={group.reviewer_avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-disney-gold flex items-center justify-center text-xs font-bold text-disney-blue">
                              {group.reviewer_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{group.reviewer_name}</span>
                        </Link>
                      )}
                      {group.reviews.length === 1 ? (
                        (() => { const review = group.reviews[0]; return (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div>
                                  <p className="text-xs text-slate-400 dark:text-slate-500">Room</p>
                                  <StarDisplay rating={review.stateroom_rating} />
                                </div>
                                {review.sailing_rating && (
                                  <div>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">Sailing</p>
                                    <StarDisplay rating={review.sailing_rating} />
                                  </div>
                                )}
                              </div>
                              <span className="text-xs text-slate-400 dark:text-slate-500">
                                {review.sailing_start
                                  ? `${review.sailing_ship?.replace('Disney ', '') || ''} ${new Date(review.sailing_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                                  : new Date(review.sail_start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                              {review.num_passengers && (
                                <span>
                                  {review.adults || review.children || review.infants
                                    ? [
                                        review.adults ? `${review.adults} adult${review.adults !== 1 ? 's' : ''}` : null,
                                        review.children ? `${review.children} child${review.children !== 1 ? 'ren' : ''}` : null,
                                        review.infants ? `${review.infants} infant${review.infants !== 1 ? 's' : ''}` : null,
                                      ].filter(Boolean).join(', ')
                                    : `${review.num_passengers} pax`}
                                </span>
                              )}
                              {review.occasions && <span>{review.occasions.split(',').join(', ')}</span>}
                              {review.boarding_port && <span>From {review.boarding_port}</span>}
                              {review.ports_of_call && <span>via {review.ports_of_call}</span>}
                              {review.price_paid != null && <span>${Number(review.price_paid).toLocaleString()}</span>}
                            </div>
                            {review.review_text && (
                              <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{review.review_text}</p>
                            )}
                          </div>
                        ); })()
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {group.reviews.map((review) => (
                            <div key={review.id} className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Room</p>
                                    <StarDisplay rating={review.stateroom_rating} />
                                  </div>
                                  {review.sailing_rating && (
                                    <div>
                                      <p className="text-[10px] text-slate-400 dark:text-slate-500">Sailing</p>
                                      <StarDisplay rating={review.sailing_rating} />
                                    </div>
                                  )}
                                </div>
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                  {review.sailing_start
                                    ? `${review.sailing_ship?.replace('Disney ', '') || ''} ${new Date(review.sailing_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                                    : new Date(review.sail_start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1 text-xs text-slate-500 dark:text-slate-400 mb-1">
                                {review.num_passengers && <span>{review.num_passengers} pax</span>}
                                {review.boarding_port && <span>From {review.boarding_port}</span>}
                              </div>
                              {review.review_text && (
                                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{review.review_text}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">💬</div>
                <p className="text-sm text-slate-500 dark:text-slate-400">No reviews yet for this stateroom. Be the first!</p>
              </div>
            )}
          </div>

        </>
      )}
    </div>
  );
}
