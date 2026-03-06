'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import sailingData from '@/data/sailing-data.json';
import { isValidStateroomForShip, lookupStateroomInfo, getMaxOccupancy, TYPE_EMOJI } from '@/lib/stateroom-utils';
import { getCastawayLevel, type CastawayInfo } from '@/lib/castaway-levels';
import CastawayLevelUp from '@/components/CastawayLevelUp';

const SHIPS = [
  'Disney Magic', 'Disney Wonder', 'Disney Dream', 'Disney Fantasy',
  'Disney Wish', 'Disney Treasure', 'Disney Destiny', 'Disney Adventure',
] as const;

type ShipName = (typeof SHIPS)[number];

const allItineraries = sailingData.itineraries;
const allPortsOfCall = sailingData.allPortsOfCall;

// Combined list of all known ports (embarkation + disembarkation + ports of call)
const allKnownPorts = [...new Set([
  ...allItineraries.map(it => it.embarkationPort),
  ...allItineraries.map(it => it.disembarkationPort),
  ...allPortsOfCall,
])].sort();

function PortAutocomplete({ value, onChange, placeholder, maxLength, className }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  maxLength: number;
  className: string;
}) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    if (!value || value.length < 2) return [];
    const lower = value.toLowerCase();
    return allKnownPorts.filter(p => p.toLowerCase().includes(lower)).slice(0, 8);
  }, [value]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const showDropdown = open && focused && suggestions.length > 0;

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => { setFocused(true); setOpen(true); }}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={className}
      />
      {showDropdown && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-600 max-h-48 overflow-y-auto">
          {suggestions.map(port => (
            <button
              key={port}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(port); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 first:rounded-t-xl last:rounded-b-xl"
            >
              {port}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface Sailing {
  id: string;
  ship_name: string;
  sail_start_date: string;
  sail_end_date: string;
  itinerary_name: string | null;
  embarkation_port: string;
  ports_of_call: string | null;
  stateroom_numbers: number[] | null;
  num_pax: number | null;
  cost_per_pax: number | null;
  overall_rating: number | null;
  service_rating: number | null;
  entertainment_rating: number | null;
  food_rating: number | null;
  review_text: string | null;
  created_at: string;
}

function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} className={`${cls} ${star <= rating ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

const OCCASIONS = [
  'Birthday', 'Anniversary', 'Honeymoon', 'Family Vacation', 'Holiday',
  'Graduation', 'Just for Fun', 'Babymoon', 'Reunion', 'Other',
];

function Stepper({ label, sublabel, value, onChange, min = 0, max = 20 }: {
  label: string; sublabel: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <span className="text-sm font-medium text-slate-900 dark:text-white">{label}</span>
        <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">({sublabel})</span>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
          className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">-</button>
        <span className="w-6 text-center text-sm font-medium text-slate-900 dark:text-white">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
          className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">+</button>
      </div>
    </div>
  );
}

export default function SailingReviewPage() {
  const { user, session } = useAuth();

  // Form state
  const [selectedShip, setSelectedShip] = useState<ShipName | ''>('');
  const [sailStartDate, setSailStartDate] = useState('');
  const [sailEndDate, setSailEndDate] = useState('');
  const [itineraryName, setItineraryName] = useState('');
  const [isOpenSailing, setIsOpenSailing] = useState(false);
  const [openItineraryName, setOpenItineraryName] = useState('');
  const [embarkationPort, setEmbarkationPort] = useState('');
  const [disembarkationPort, setDisembarkationPort] = useState('');
  const [openPortsOfCall, setOpenPortsOfCall] = useState('');
  const [selectedPorts, setSelectedPorts] = useState<string[]>([]);
  const [stateroomNumbers, setStateroomNumbers] = useState<string[]>([]);
  const [stateroomInput, setStateroomInput] = useState('');
  const [stateroomError, setStateroomError] = useState('');
  const [roomPax, setRoomPax] = useState<Record<string, { adults: number; children: number; infants: number }>>({});
  const [numAdults, setNumAdults] = useState(0);
  const [numChildren, setNumChildren] = useState(0);
  const [numInfants, setNumInfants] = useState(0);
  const [occasions, setOccasions] = useState<string[]>([]);
  const [purchasedFrom, setPurchasedFrom] = useState('');
  const [totalCost, setTotalCost] = useState('');

  // Fellow sailors
  const [companionSearch, setCompanionSearch] = useState('');
  const [companionResults, setCompanionResults] = useState<Array<{ id: string; display_name: string; avatar_url: string | null; handle: string | null }>>([]);
  const [selectedCompanions, setSelectedCompanions] = useState<Array<{ id: string; display_name: string; avatar_url: string | null; handle: string | null }>>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [pendingInvites, setPendingInvites] = useState<string[]>([]);
  const companionSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Level-up celebration state
  const [levelUpInfo, setLevelUpInfo] = useState<CastawayInfo | null>(null);

  // My Sailings state
  const [mySailings, setMySailings] = useState<Sailing[]>([]);
  const [mySailingsLoading, setMySailingsLoading] = useState(false);
  const [now, setNow] = useState(() => new Date());

  // Delete state

  // Tick now every minute for countdowns
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Compute number of nights from selected dates
  const selectedNights = useMemo(() => {
    if (!sailStartDate || !sailEndDate) return null;
    const start = new Date(sailStartDate + 'T00:00:00');
    const end = new Date(sailEndDate + 'T00:00:00');
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : null;
  }, [sailStartDate, sailEndDate]);

  // Filter itineraries by selected ship and number of nights
  const filteredItineraries = useMemo(() => {
    let list = allItineraries;
    if (selectedShip) list = list.filter((it) => it.ships.includes(selectedShip));
    if (selectedNights) {
      list = list.filter((it) => {
        const match = it.name.match(/^(\d+)-Night/);
        return match && parseInt(match[1], 10) === selectedNights;
      });
    }
    return list;
  }, [selectedShip, selectedNights]);

  // Get selected itinerary object
  const selectedItinerary = useMemo(() => {
    if (!itineraryName) return null;
    return allItineraries.find((it) => it.id === itineraryName) ?? null;
  }, [itineraryName]);

  // Clear itinerary if it no longer matches the filtered list
  useEffect(() => {
    if (itineraryName && filteredItineraries.length > 0 && !filteredItineraries.some(it => it.id === itineraryName)) {
      setItineraryName('');
      setEmbarkationPort('');
      setDisembarkationPort('');
      setSelectedPorts([]);
    }
  }, [filteredItineraries, itineraryName]);

  // Auto-populate ports when itinerary changes
  useEffect(() => {
    if (selectedItinerary && !isOpenSailing) {
      setEmbarkationPort(selectedItinerary.embarkationPort);
      setDisembarkationPort(selectedItinerary.disembarkationPort);
      setSelectedPorts(selectedItinerary.portsOfCall);
    }
  }, [selectedItinerary, isOpenSailing]);

  // Validate and add stateroom number
  const tryAddStateroom = useCallback((input: string) => {
    setStateroomError('');
    if (!input) return;
    if (stateroomNumbers.includes(input)) return;
    const num = parseInt(input, 10);
    if (isNaN(num) || num <= 0) { setStateroomError('Please enter a valid room number.'); return; }
    if (selectedShip && !isValidStateroomForShip(num, selectedShip)) {
      setStateroomError(`Room ${num} doesn't exist on ${selectedShip}`);
      return;
    }
    setStateroomNumbers(prev => [...prev, input]);
    setStateroomInput('');
    // Initialize per-room pax with defaults
    setRoomPax(prev => ({ ...prev, [input]: { adults: 0, children: 0, infants: 0 } }));
  }, [stateroomNumbers, selectedShip]);

  const embarkationPortOptions = useMemo(() => {
    const ports = new Set(filteredItineraries.map((it) => it.embarkationPort));
    return Array.from(ports);
  }, [filteredItineraries]);

  const disembarkationPortOptions = useMemo(() => {
    const ports = new Set(filteredItineraries.map((it) => it.disembarkationPort));
    return Array.from(ports);
  }, [filteredItineraries]);

  // Fetch user's own sailings
  const fetchMySailings = useCallback(async () => {
    if (!user || !session?.access_token) return;
    setMySailingsLoading(true);
    try {
      const res = await fetch(`/api/profiles/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setMySailings(data.sailings ?? []);
      }
    } catch { /* ignore */ } finally { setMySailingsLoading(false); }
  }, [user, session?.access_token]);

  useEffect(() => {
    fetchMySailings();
  }, [fetchMySailings]);

  // 3-way split
  const todayStart = useMemo(() => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [now]);

  const currentlySailing = useMemo(() => {
    return mySailings.filter(s => {
      const start = new Date(s.sail_start_date + 'T00:00:00');
      const end = new Date(s.sail_end_date + 'T23:59:59');
      return start <= now && end >= todayStart;
    });
  }, [mySailings, now, todayStart]);

  const upcomingSailings = useMemo(() => {
    return mySailings
      .filter(s => new Date(s.sail_start_date + 'T00:00:00') > now)
      .sort((a, b) => new Date(a.sail_start_date).getTime() - new Date(b.sail_start_date).getTime());
  }, [mySailings, now]);

  const pastSailings = useMemo(() => {
    return mySailings
      .filter(s => new Date(s.sail_end_date + 'T23:59:59') < todayStart)
      .sort((a, b) => new Date(b.sail_end_date).getTime() - new Date(a.sail_end_date).getTime());
  }, [mySailings, todayStart]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess(false);

    if (!selectedShip) { setSubmitError('Please select a ship.'); return; }
    if (!sailStartDate || !sailEndDate) { setSubmitError('Please enter sailing dates.'); return; }
    if (!embarkationPort) { setSubmitError('Please select an embarkation port.'); return; }

    setSubmitting(true);
    try {
      const portsStr = isOpenSailing
        ? (openPortsOfCall || undefined)
        : (selectedPorts.length > 0 ? selectedPorts.join(', ') : undefined);
      const itinLabel = isOpenSailing
        ? (openItineraryName || undefined)
        : (selectedItinerary?.name || undefined);
      // Compute passenger counts: per-room totals if rooms exist, else global steppers
      let submitAdults = numAdults;
      let submitChildren = numChildren;
      let submitInfants = numInfants;
      if (stateroomNumbers.length > 0) {
        submitAdults = 0; submitChildren = 0; submitInfants = 0;
        for (const num of stateroomNumbers) {
          const rp = roomPax[num];
          if (rp) { submitAdults += rp.adults; submitChildren += rp.children; submitInfants += rp.infants; }
        }
      }

      const res = await fetch('/api/sailing-reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          ship_name: selectedShip, sail_start_date: sailStartDate, sail_end_date: sailEndDate,
          itinerary_name: itinLabel, embarkation_port: embarkationPort,
          disembarkation_port: disembarkationPort || undefined,
          ports_of_call: portsStr,
          stateroom_numbers: stateroomNumbers.length > 0 ? stateroomNumbers.map(Number) : undefined,
          adults: submitAdults || undefined,
          children: submitChildren || undefined,
          infants: submitInfants || undefined,
          occasions: occasions.length > 0 ? occasions : undefined,
          purchased_from: purchasedFrom || undefined,
          total_cost: totalCost ? parseFloat(totalCost) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error || 'Failed to submit'); setSubmitting(false); return; }

      // Detect Castaway Club level-up
      const todayMid = new Date();
      todayMid.setHours(0, 0, 0, 0);
      const oldPastCount = mySailings.filter(s => new Date(s.sail_end_date + 'T23:59:59') < todayMid).length;
      const newSailingEndDate = new Date(sailEndDate + 'T23:59:59');
      const newPastCount = oldPastCount + (newSailingEndDate < todayMid ? 1 : 0);
      const oldLevel = getCastawayLevel(oldPastCount);
      const newLevel = getCastawayLevel(newPastCount);

      setSubmitSuccess(true);
      setSubmitSuccessMsg('Sailing logged!');
      const newSailingId = data.review?.id || null;

      // Save companions and invites
      if (newSailingId && session?.access_token) {
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` };
        await Promise.all([
          ...selectedCompanions.map(c =>
            fetch('/api/sailing-companions', { method: 'POST', headers, body: JSON.stringify({ sailing_id: newSailingId, companion_id: c.id }) }).catch(() => {})
          ),
          ...pendingInvites.map(email =>
            fetch('/api/sailing-invites', { method: 'POST', headers, body: JSON.stringify({ sailing_id: newSailingId, email }) }).catch(() => {})
          ),
        ]);
      }

      // Show level-up celebration and update profile if level changed
      if (newLevel.level !== 'none' && newLevel.level !== oldLevel.level) {
        setLevelUpInfo(newLevel);
        if (user) {
          fetch(`/api/profiles/${user.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dcl_membership: `${newLevel.label} Castaway` }),
          }).catch(() => {});
        }
      }

      // Reset form
      setSelectedShip(''); setSailStartDate(''); setSailEndDate(''); setItineraryName('');
      setEmbarkationPort(''); setDisembarkationPort(''); setSelectedPorts([]);
      setOpenItineraryName(''); setOpenPortsOfCall(''); setIsOpenSailing(false);
      setStateroomNumbers([]); setStateroomInput(''); setStateroomError(''); setRoomPax({});
      setNumAdults(0); setNumChildren(0); setNumInfants(0);
      setTotalCost(''); setOccasions([]); setPurchasedFrom('');
      setSelectedCompanions([]); setPendingInvites([]); setCompanionSearch(''); setInviteEmail('');
      fetchMySailings();
    } catch { setSubmitError('Failed to submit. Please try again.'); } finally { setSubmitting(false); }
  };

  const selectCls = "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent";

  function formatCountdown(startDate: string) {
    const startMidnight = new Date(startDate + 'T00:00:00');
    const todayMid = new Date(now);
    todayMid.setHours(0, 0, 0, 0);
    const calendarDays = Math.round((startMidnight.getTime() - todayMid.getTime()) / (1000 * 60 * 60 * 24));
    if (calendarDays <= 0) return 'Starting soon';
    if (calendarDays === 1) return '1 day to go';
    return `${calendarDays} days to go`;
  }

  function SailingCardDetails({ sailing }: { sailing: Sailing }) {
    return (
      <>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {new Date(sailing.sail_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          {' - '}
          {new Date(sailing.sail_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        {sailing.itinerary_name && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{sailing.itinerary_name}</p>
        )}
        <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
          <span>From {sailing.embarkation_port}</span>
          {sailing.ports_of_call && <span>via {sailing.ports_of_call}</span>}
          {sailing.num_pax && <span>{sailing.num_pax} pax</span>}
          {sailing.cost_per_pax != null && <span>${Number(sailing.cost_per_pax).toLocaleString()} USD/pax</span>}
        </div>
        {sailing.stateroom_numbers && sailing.stateroom_numbers.length > 0 && (
          <div className="space-y-1.5 mt-2">
            {sailing.stateroom_numbers.map((num) => {
              const info = lookupStateroomInfo(num, sailing.ship_name);
              return (
                <div key={num} className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white">#{num}</span>
                  {info && (
                    <>
                      <span className="px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">Deck {info.deck}</span>
                      <span className="px-2 py-0.5 rounded-full font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">{info.typeEmoji} {info.type}</span>
                      <span className="px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{info.section}</span>
                      {info.bedding && <span className="text-slate-500 dark:text-slate-400">🛏 {info.bedding}</span>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/Secret-menU" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Cruise Guide
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">My Sailings</h1>
        <p className="text-slate-600 dark:text-slate-400">Log past and upcoming sailings. Review them after you return.</p>
      </div>

      {/* Log a New Sailing Form */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add a Sailing</h3>
        {user ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Ship Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Ship</label>
              <select value={selectedShip} onChange={(e) => { setSelectedShip(e.target.value as ShipName | ''); setItineraryName(''); setEmbarkationPort(''); setDisembarkationPort(''); setSelectedPorts([]); }}
                className={selectCls}>
                <option value="">Select a ship...</option>
                {SHIPS.map((ship) => <option key={ship} value={ship}>{ship}</option>)}
              </select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Sail Start Date</label>
                <input type="date" value={sailStartDate} onChange={(e) => setSailStartDate(e.target.value)}
                  className={selectCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Sail End Date</label>
                <input type="date" value={sailEndDate} onChange={(e) => setSailEndDate(e.target.value)} min={sailStartDate || undefined}
                  className={selectCls} />
              </div>
            </div>

            {/* Open Sailing Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Can&apos;t find your sailing?
              </label>
              <button
                type="button"
                onClick={() => {
                  const next = !isOpenSailing;
                  setIsOpenSailing(next);
                  if (next) {
                    setItineraryName(''); setEmbarkationPort(''); setDisembarkationPort(''); setSelectedPorts([]);
                  } else {
                    setOpenItineraryName(''); setOpenPortsOfCall('');
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  isOpenSailing
                    ? 'bg-disney-blue text-white border-disney-blue dark:bg-disney-gold dark:text-slate-900 dark:border-disney-gold'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                }`}
              >
                {isOpenSailing ? 'Back to list' : 'Enter manually'}
              </button>
            </div>

            {!isOpenSailing ? (
              <>
                {/* Itinerary Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Sailing Itinerary</label>
                  <select value={itineraryName} onChange={(e) => setItineraryName(e.target.value)}
                    className={selectCls}>
                    <option value="">Select itinerary...</option>
                    {filteredItineraries.map((it) => (
                      <option key={it.id} value={it.id}>{it.name}</option>
                    ))}
                  </select>
                </div>

                {/* Embarkation / Disembarkation Port Dropdowns */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Embarkation Port</label>
                    <select value={embarkationPort} onChange={(e) => setEmbarkationPort(e.target.value)}
                      className={selectCls}>
                      <option value="">Select port...</option>
                      {embarkationPortOptions.map((port) => (
                        <option key={port} value={port}>{port}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Disembarkation Port</label>
                    <select value={disembarkationPort} onChange={(e) => setDisembarkationPort(e.target.value)}
                      className={selectCls}>
                      <option value="">Select port...</option>
                      {disembarkationPortOptions.map((port) => (
                        <option key={port} value={port}>{port}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Ports of Call */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Ports of Call
                    {selectedPorts.length > 0 && (
                      <span className="font-normal text-slate-400 dark:text-slate-500 ml-1">({selectedPorts.length} selected)</span>
                    )}
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900">
                    {[...allPortsOfCall].sort((a, b) => {
                      const aSelected = selectedPorts.includes(a);
                      const bSelected = selectedPorts.includes(b);
                      if (aSelected && !bSelected) return -1;
                      if (!aSelected && bSelected) return 1;
                      return 0;
                    }).map((port) => {
                      const selected = selectedPorts.includes(port);
                      return (
                        <button
                          key={port}
                          type="button"
                          onClick={() =>
                            setSelectedPorts((prev) =>
                              selected ? prev.filter((p) => p !== port) : [...prev, port]
                            )
                          }
                          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                            selected
                              ? 'bg-disney-blue text-white border-disney-blue dark:bg-disney-gold dark:text-slate-900 dark:border-disney-gold'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                          }`}
                        >
                          {port}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Open Sailing — all free text */}
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
                  Entering a custom sailing. Fill in the details as they appeared on your booking.
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Itinerary Name</label>
                  <input type="text" value={openItineraryName} onChange={(e) => setOpenItineraryName(e.target.value)}
                    placeholder="e.g. 5-Night Western Caribbean" maxLength={200}
                    className={selectCls} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Embarkation Port</label>
                    <PortAutocomplete
                      value={embarkationPort}
                      onChange={setEmbarkationPort}
                      placeholder="e.g. Port Canaveral, FL"
                      maxLength={100}
                      className={selectCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Disembarkation Port</label>
                    <PortAutocomplete
                      value={disembarkationPort}
                      onChange={setDisembarkationPort}
                      placeholder="e.g. Port Canaveral, FL"
                      maxLength={100}
                      className={selectCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Ports of Call (optional)</label>
                  <PortAutocomplete
                    value={openPortsOfCall}
                    onChange={setOpenPortsOfCall}
                    placeholder="e.g. Nassau, Castaway Cay, Cozumel"
                    maxLength={500}
                    className={selectCls}
                  />
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Separate multiple ports with commas</p>
                </div>
              </>
            )}

            {/* Stateroom Numbers */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Stateroom Number(s)
                {stateroomNumbers.length > 0 && (
                  <span className="font-normal text-slate-400 dark:text-slate-500 ml-1">({stateroomNumbers.length} added)</span>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={stateroomInput}
                  onChange={(e) => { setStateroomInput(e.target.value.replace(/\D/g, '')); setStateroomError(''); }}
                  placeholder="e.g. 8500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      tryAddStateroom(stateroomInput);
                    }
                  }}
                  className={selectCls}
                />
                <button
                  type="button"
                  disabled={!stateroomInput || stateroomNumbers.includes(stateroomInput)}
                  onClick={() => tryAddStateroom(stateroomInput)}
                  className="px-4 py-3 rounded-xl font-medium btn-disney disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  Add
                </button>
              </div>
              {stateroomError && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{stateroomError}</p>
              )}
              {stateroomNumbers.length > 0 && (
                <div className="space-y-2 mt-3">
                  {stateroomNumbers.map((num) => {
                    const info = selectedShip ? lookupStateroomInfo(parseInt(num, 10), selectedShip) : null;
                    return (
                      <div key={num} className="flex items-center gap-2 flex-wrap bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-600">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">#{num}</span>
                        {info && (
                          <>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">Deck {info.deck}</span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">{info.typeEmoji} {info.type}</span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{info.section}</span>
                            {info.bedding && <span className="text-xs text-slate-500 dark:text-slate-400">🛏 {info.bedding}</span>}
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setStateroomNumbers(prev => prev.filter(n => n !== num));
                            setRoomPax(prev => { const next = { ...prev }; delete next[num]; return next; });
                          }}
                          className="ml-auto hover:opacity-70 text-slate-400 hover:text-red-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Passengers */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Passengers (optional)</label>
              {stateroomNumbers.length > 0 ? (
                <div className="space-y-3">
                  {stateroomNumbers.map((num) => {
                    const pax = roomPax[num] ?? { adults: 0, children: 0, infants: 0 };
                    const maxOcc = selectedShip ? getMaxOccupancy(parseInt(num, 10), selectedShip) : null;
                    const totalPax = pax.adults + pax.children + pax.infants;
                    const overMax = maxOcc !== null && totalPax > maxOcc;
                    return (
                      <div key={num} className="bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2 border border-slate-200 dark:border-slate-600">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">Room #{num}</span>
                          {maxOcc !== null && (
                            <span className={`text-xs font-medium ${overMax ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`}>
                              {totalPax}/{maxOcc} guests {overMax ? '(exceeds max)' : `(max ${maxOcc})`}
                            </span>
                          )}
                        </div>
                        {overMax && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">
                            This room is listed for {maxOcc} guests. You may still proceed.
                          </p>
                        )}
                        <Stepper label="Adults" sublabel="18+" value={pax.adults} onChange={(v) => setRoomPax(prev => ({ ...prev, [num]: { ...prev[num], adults: v } }))} />
                        <Stepper label="Children" sublabel="3-17" value={pax.children} onChange={(v) => setRoomPax(prev => ({ ...prev, [num]: { ...prev[num], children: v } }))} />
                        <Stepper label="Infants" sublabel="0-2" value={pax.infants} onChange={(v) => setRoomPax(prev => ({ ...prev, [num]: { ...prev[num], infants: v } }))} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-1 border border-slate-200 dark:border-slate-600">
                  <Stepper label="Adults" sublabel="18+" value={numAdults} onChange={setNumAdults} />
                  <Stepper label="Children" sublabel="3-17" value={numChildren} onChange={setNumChildren} />
                  <Stepper label="Infants" sublabel="0-2" value={numInfants} onChange={setNumInfants} />
                </div>
              )}
            </div>

            {/* Occasions */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Occasion (optional)</label>
              <div className="flex flex-wrap gap-2">
                {OCCASIONS.map((occasion) => {
                  const sel = occasions.includes(occasion);
                  return (
                    <button key={occasion} type="button"
                      onClick={() => setOccasions((prev) => sel ? prev.filter((o) => o !== occasion) : [...prev, occasion])}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        sel
                          ? 'bg-disney-blue text-white border-disney-blue dark:bg-disney-gold dark:text-slate-900 dark:border-disney-gold'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                      }`}>{occasion}</button>
                  );
                })}
              </div>
            </div>

            {/* Purchased From */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Purchased From (optional)</label>
              <input type="text" value={purchasedFrom} onChange={(e) => setPurchasedFrom(e.target.value)}
                placeholder="e.g. Disney, travel agent" maxLength={200} className={selectCls} />
            </div>

            {/* Total Cost */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Total Cost USD (optional)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={totalCost}
                  onChange={(e) => setTotalCost(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
                />
              </div>
              {totalCost && (() => {
                let totalPax = numAdults + numChildren + numInfants;
                if (stateroomNumbers.length > 0) {
                  totalPax = 0;
                  for (const num of stateroomNumbers) {
                    const rp = roomPax[num];
                    if (rp) totalPax += rp.adults + rp.children + rp.infants;
                  }
                }
                return totalPax > 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    ~${(parseFloat(totalCost) / totalPax).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD per person
                  </p>
                ) : null;
              })()}
            </div>

            {/* Fellow Sailors */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fellow Sailors (optional)</label>

              {/* User search */}
              <div className="relative mb-2">
                <input
                  type="text"
                  value={companionSearch}
                  onChange={(e) => {
                    const q = e.target.value;
                    setCompanionSearch(q);
                    if (companionSearchTimer.current) clearTimeout(companionSearchTimer.current);
                    if (q.length >= 2) {
                      companionSearchTimer.current = setTimeout(async () => {
                        try {
                          const res = await fetch(`/api/profiles?search=${encodeURIComponent(q)}&limit=5`);
                          if (res.ok) {
                            const data = await res.json();
                            setCompanionResults((data.profiles ?? []).filter((p: { id: string }) => p.id !== user?.id && !selectedCompanions.some(c => c.id === p.id)));
                          }
                        } catch { /* ignore */ }
                      }, 300);
                    } else {
                      setCompanionResults([]);
                    }
                  }}
                  placeholder="Search by name..."
                  className={selectCls}
                />
                {companionResults.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-600 max-h-40 overflow-y-auto">
                    {companionResults.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedCompanions(prev => [...prev, p]);
                          setCompanionSearch('');
                          setCompanionResults([]);
                        }}
                        className="w-full text-left px-4 py-2.5 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        {p.avatar_url ? (
                          <img src={p.avatar_url} className="w-6 h-6 rounded-full object-cover" alt="" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-disney-gold flex items-center justify-center text-xs font-bold text-disney-blue">
                            {p.display_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm text-slate-900 dark:text-white">{p.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected companions */}
              {selectedCompanions.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedCompanions.map(c => (
                    <span key={c.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-disney-blue text-white dark:bg-disney-gold dark:text-slate-900">
                      {c.avatar_url ? (
                        <img src={c.avatar_url} className="w-4 h-4 rounded-full object-cover" alt="" />
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px] font-bold">{c.display_name.charAt(0).toUpperCase()}</span>
                      )}
                      {c.display_name}
                      <button type="button" onClick={() => setSelectedCompanions(prev => prev.filter(x => x.id !== c.id))} className="ml-0.5 hover:opacity-70">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Invite by email */}
              <div className="flex gap-2 mt-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Invite by email..."
                  className={selectCls}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (inviteEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail) && !pendingInvites.includes(inviteEmail.toLowerCase())) {
                        setPendingInvites(prev => [...prev, inviteEmail.toLowerCase()]);
                        setInviteEmail('');
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={!inviteEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)}
                  onClick={() => {
                    if (inviteEmail && !pendingInvites.includes(inviteEmail.toLowerCase())) {
                      setPendingInvites(prev => [...prev, inviteEmail.toLowerCase()]);
                      setInviteEmail('');
                    }
                  }}
                  className="px-4 py-3 rounded-xl font-medium btn-disney disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 text-sm"
                >
                  Invite
                </button>
              </div>

              {/* Pending invites */}
              {pendingInvites.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {pendingInvites.map(email => (
                    <span key={email} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {email}
                      <button type="button" onClick={() => setPendingInvites(prev => prev.filter(e => e !== email))} className="ml-0.5 hover:opacity-70">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {submitError && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">{submitError}</div>}
            {submitSuccess && <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-3">{submitSuccessMsg}</div>}

            <button type="submit" disabled={submitting}
              className="w-full px-6 py-3 rounded-xl font-medium btn-disney disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Saving...' : 'Add Sailing'}
            </button>
          </form>
        ) : (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">🔒</div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Sign in to log your sailing.</p>
            <Link href="/auth" className="inline-block px-6 py-2.5 rounded-xl font-medium btn-disney">Sign In</Link>
          </div>
        )}
      </div>

      {/* My Sailings Sections */}
      {user && (
        <>
          {mySailingsLoading && mySailings.length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">Loading your sailings...</div>
          )}

          {/* Currently Sailing */}
          {currentlySailing.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Currently Sailing</h3>
              <div className="space-y-4">
                {currentlySailing.map((sailing) => (
                  <div key={sailing.id} className="pb-4 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-slate-900 dark:text-white">{sailing.ship_name}</h4>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        On Board
                      </span>
                    </div>
                    <SailingCardDetails sailing={sailing} />
                    <Link
                      href="/planner"
                      className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl text-sm font-medium btn-disney"
                    >
                      Plan Your Day
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Sailings */}
          {upcomingSailings.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Upcoming Sailings</h3>
              <div className="space-y-4">
                {upcomingSailings.map((sailing) => (
                  <div key={sailing.id} className="pb-4 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-slate-900 dark:text-white">{sailing.ship_name}</h4>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        {formatCountdown(sailing.sail_start_date)}
                      </span>
                    </div>
                    <SailingCardDetails sailing={sailing} />
                    <Link
                      href="/planner"
                      className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      Plan Your Trip
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past Sailings */}
          {pastSailings.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Past Sailings</h3>
              <div className="space-y-4">
                {pastSailings.map((sailing) => (
                  <div key={sailing.id} className="pb-4 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-slate-900 dark:text-white">{sailing.ship_name}</h4>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {new Date(sailing.sail_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {' - '}
                        {new Date(sailing.sail_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    {sailing.itinerary_name && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{sailing.itinerary_name}</p>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                      <span>From {sailing.embarkation_port}</span>
                      {sailing.ports_of_call && <span>via {sailing.ports_of_call}</span>}
                      {sailing.stateroom_numbers && sailing.stateroom_numbers.length > 0 && (
                        <span>Room{sailing.stateroom_numbers.length > 1 ? 's' : ''} {sailing.stateroom_numbers.join(', ')}</span>
                      )}
                      {sailing.num_pax && <span>{sailing.num_pax} pax</span>}
                      {sailing.cost_per_pax != null && <span>${Number(sailing.cost_per_pax).toLocaleString()} USD/pax</span>}
                    </div>

                    {sailing.overall_rating != null ? (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <StarDisplay rating={sailing.overall_rating} size="sm" />
                          <span className="text-xs text-slate-500 dark:text-slate-400">Overall</span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                          {sailing.service_rating != null && <span>Service: {sailing.service_rating}/5</span>}
                          {sailing.entertainment_rating != null && <span>Entertainment: {sailing.entertainment_rating}/5</span>}
                          {sailing.food_rating != null && <span>Food: {sailing.food_rating}/5</span>}
                        </div>
                        {sailing.review_text && (
                          <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">{sailing.review_text}</p>
                        )}
                        <Link
                          href={`/Secret-menU/sailing/${sailing.id}/review`}
                          className="inline-flex items-center gap-1 mt-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        >
                          Edit review
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </>
                    ) : (
                      <Link
                        href={`/Secret-menU/sailing/${sailing.id}/review`}
                        className="inline-flex items-center gap-2 mt-2 px-3 py-2 rounded-xl text-sm font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                      >
                        Rate this sailing!
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!mySailingsLoading && mySailings.length === 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-4xl mb-3">🚢</div>
              <p className="text-sm text-slate-500 dark:text-slate-400">No sailings logged yet. Use the form above to add your first!</p>
            </div>
          )}
        </>
      )}

      {/* Castaway Club Level-Up Celebration */}
      {levelUpInfo && (
        <CastawayLevelUp
          newLevel={levelUpInfo}
          onDismiss={() => setLevelUpInfo(null)}
        />
      )}
    </div>
  );
}
