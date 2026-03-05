'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

interface Sailing {
  id: string;
  ship_name: string;
  sail_start_date: string;
  sail_end_date: string;
  itinerary_name: string | null;
  embarkation_port: string;
  ports_of_call: string | null;
  disembarkation_port: string | null;
  stateroom_numbers: number[] | null;
  num_pax: number | null;
  cost_per_pax: number | null;
  overall_rating: number;
  role?: 'owner' | 'guest';
  guest_stateroom_number?: number | null;
}

interface SailingPickerProps {
  onSelect: (sailing: Sailing | null) => void;
  selectedSailingId?: string | null;
  hidePast?: boolean;
}

export default function SailingPicker({ onSelect, selectedSailingId, hidePast }: SailingPickerProps) {
  const { user, session } = useAuth();
  const [sailings, setSailings] = useState<Sailing[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Sailing | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const fetchSailings = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/sailing-reviews/mine', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSailings(data.sailings ?? []);
        // Auto-select if selectedSailingId is provided
        if (selectedSailingId) {
          const match = (data.sailings ?? []).find((s: Sailing) => s.id === selectedSailingId);
          if (match) {
            setSelected(match);
            onSelectRef.current(match);
          }
        }
      }
    } catch { /* supplemental */ } finally { setLoading(false); }
  }, [session?.access_token, selectedSailingId]);

  useEffect(() => {
    if (user) fetchSailings();
  }, [user, fetchSailings]);

  const handleSelect = (sailing: Sailing) => {
    setSelected(sailing);
    onSelect(sailing);
  };

  const handleClear = () => {
    setSelected(null);
    onSelect(null);
  };

  if (!user) return null;

  // Selected sailing summary card
  if (selected) {
    return (
      <div className="bg-disney-blue/5 dark:bg-disney-gold/5 rounded-2xl p-4 border border-disney-blue/20 dark:border-disney-gold/20 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-disney-blue dark:text-disney-gold uppercase tracking-wide">Linked Sailing</span>
            {selected.role === 'guest' && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">Guest</span>
            )}
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline"
          >
            Change
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">⛵</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{selected.ship_name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {new Date(selected.sail_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {' - '}
              {new Date(selected.sail_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {selected.itinerary_name || `From ${selected.embarkation_port}`}
              {selected.ports_of_call ? ` via ${selected.ports_of_call}` : ''}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const filteredSailings = sailings
    .filter(s => !hidePast || new Date(s.sail_end_date) >= new Date())
    .sort((a, b) => new Date(a.sail_start_date).getTime() - new Date(b.sail_start_date).getTime());

  const now = new Date(); now.setHours(0, 0, 0, 0);
  const upcoming = filteredSailings.filter(s => new Date(s.sail_end_date) >= now);
  const past = filteredSailings
    .filter(s => new Date(s.sail_end_date) < now)
    .sort((a, b) => new Date(b.sail_start_date).getTime() - new Date(a.sail_start_date).getTime());

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) return;
    const match = filteredSailings.find(s => s.id === id);
    if (match) handleSelect(match);
  };

  const renderOption = (sailing: Sailing) => (
    <option key={sailing.id} value={sailing.id}>
      {sailing.ship_name} — {new Date(sailing.sail_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      {sailing.itinerary_name ? ` — ${sailing.itinerary_name}` : ''}
      {sailing.role === 'guest' ? ' (Guest)' : ''}
    </option>
  );

  // Sailing picker dropdown
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 mb-4">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-semibold text-slate-900 dark:text-white">Link to a Sailing</label>
        <span className="text-xs text-slate-400 dark:text-slate-500">(optional)</span>
      </div>

      {loading ? (
        <div className="text-center py-4 text-sm text-slate-500 dark:text-slate-400">Loading your sailings...</div>
      ) : filteredSailings.length > 0 ? (
        <select
          value=""
          onChange={handleDropdownChange}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
        >
          <option value="">Select a sailing...</option>
          {upcoming.length > 0 && (
            <optgroup label="Upcoming Sailings">
              {upcoming.map(renderOption)}
            </optgroup>
          )}
          {past.length > 0 && (
            <optgroup label="Past Sailings">
              {past.map(renderOption)}
            </optgroup>
          )}
        </select>
      ) : (
        <div className="text-center py-3">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">No sailings logged yet.</p>
        </div>
      )}

      <Link
        href="/Secret-menU/sailing"
        className="block mt-3 text-center text-sm font-medium text-disney-blue dark:text-disney-gold hover:underline"
      >
        + Log a new sailing
      </Link>
    </div>
  );
}
