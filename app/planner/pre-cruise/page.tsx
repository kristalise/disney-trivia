'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import SailingPicker from '@/components/SailingPicker';

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
}

interface ChecklistItem {
  id: string;
  sailing_id: string;
  category: string;
  label: string;
  checked: boolean;
  sort_order: number;
  created_at: string;
}

type Category = 'items_to_purchase' | 'items_to_pack' | 'pixie_dust_prep' | 'fish_extender';

const CATEGORIES: { key: Category; emoji: string; title: string; placeholder: string }[] = [
  { key: 'items_to_purchase', emoji: '🛒', title: 'Items to Purchase', placeholder: 'e.g. Magnet clips, Lanyards...' },
  { key: 'items_to_pack', emoji: '🧳', title: 'Items to Pack', placeholder: 'e.g. Formal wear, Sunscreen...' },
  { key: 'pixie_dust_prep', emoji: '✨', title: 'Pixie Dust Prep', placeholder: 'e.g. Print gift tags, Buy treat bags...' },
  { key: 'fish_extender', emoji: '🐟', title: 'Fish Extender', placeholder: 'e.g. Make FE gifts, Buy hooks...' },
];

export default function PreCruisePage() {
  return (
    <Suspense>
      <PreCruiseContent />
    </Suspense>
  );
}

function PreCruiseContent() {
  const { user, session } = useAuth();
  const searchParams = useSearchParams();
  const sailingParam = searchParams.get('sailing');

  const [selectedSailing, setSelectedSailing] = useState<Sailing | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [addInputs, setAddInputs] = useState<Record<string, string>>({});
  const [addingCategory, setAddingCategory] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  }), [session?.access_token]);

  const fetchItems = useCallback(async (sailingId: string) => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pre-cruise-checklist?sailing_id=${sailingId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [session?.access_token]);

  const handleToggle = async (item: ChecklistItem) => {
    setTogglingId(item.id);
    try {
      const res = await fetch('/api/pre-cruise-checklist', {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ id: item.id, checked: !item.checked }),
      });
      if (res.ok) {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i));
      }
    } catch { /* ignore */ } finally { setTogglingId(null); }
  };

  const handleAdd = async (category: Category) => {
    const label = addInputs[category]?.trim();
    if (!label || !selectedSailing) return;
    setAddingCategory(category);
    try {
      const res = await fetch('/api/pre-cruise-checklist', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ sailing_id: selectedSailing.id, category, label }),
      });
      if (res.ok) {
        const data = await res.json();
        setItems(prev => [...prev, data.item]);
        setAddInputs(prev => ({ ...prev, [category]: '' }));
      }
    } catch { /* ignore */ } finally { setAddingCategory(null); }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/pre-cruise-checklist?id=${id}`, {
        method: 'DELETE',
        headers: headers(),
      });
      if (res.ok) {
        setItems(prev => prev.filter(i => i.id !== id));
      }
    } catch { /* ignore */ } finally { setDeletingId(null); }
  };

  const toggleSection = (key: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Overall progress
  const totalItems = items.length;
  const checkedItems = items.filter(i => i.checked).length;
  const progressPct = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/planner" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          My Planner
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Pre-Cruise Checklist</h1>
        <p className="text-slate-600 dark:text-slate-400">Track everything you need to buy, pack, and prepare before your cruise.</p>
      </div>

      {user ? (
        <SailingPicker
          onSelect={async (sailing) => {
            setSelectedSailing(sailing);
            setItems([]);
            if (sailing) await fetchItems(sailing.id);
          }}
          selectedSailingId={selectedSailing?.id ?? sailingParam}
        />
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
          <div className="text-4xl mb-3">🔒</div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Sign in to use the pre-cruise checklist.</p>
          <Link href="/auth" className="inline-block px-6 py-2.5 rounded-xl font-medium btn-disney">Sign In</Link>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3 animate-pulse">📋</div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading your checklist...</p>
        </div>
      )}

      {selectedSailing && !loading && (
        <>
          {/* Progress bar */}
          {totalItems > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {checkedItems} of {totalItems} completed
                </span>
                <span className="text-sm font-bold text-disney-blue dark:text-disney-gold">{progressPct}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-disney-blue dark:bg-disney-gold rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Category sections */}
          {CATEGORIES.map(({ key, emoji, title, placeholder }) => {
            const categoryItems = items.filter(i => i.category === key);
            const catChecked = categoryItems.filter(i => i.checked).length;
            const isCollapsed = collapsedSections.has(key);

            return (
              <div key={key} className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 mb-4 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection(key)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{emoji}</span>
                    <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
                    <span className="text-sm text-slate-400 dark:text-slate-500">
                      ({catChecked}/{categoryItems.length})
                    </span>
                  </div>
                  <svg className={`w-4 h-4 text-slate-400 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {!isCollapsed && (
                  <div className="px-5 pb-4">
                    {/* Items */}
                    {categoryItems.length > 0 && (
                      <div className="space-y-0 mb-3">
                        {categoryItems.map(item => (
                          <div key={item.id} className="flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
                            <button
                              type="button"
                              disabled={togglingId === item.id}
                              onClick={() => handleToggle(item)}
                              className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                                item.checked
                                  ? 'bg-disney-blue border-disney-blue dark:bg-disney-gold dark:border-disney-gold'
                                  : 'border-slate-300 dark:border-slate-600 hover:border-disney-blue dark:hover:border-disney-gold'
                              } ${togglingId === item.id ? 'opacity-50' : ''}`}
                            >
                              {item.checked && (
                                <svg className="w-4 h-4 text-white dark:text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                            <span className={`flex-1 text-sm ${item.checked ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                              {item.label}
                            </span>
                            <button
                              type="button"
                              disabled={deletingId === item.id}
                              onClick={() => handleDelete(item.id)}
                              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add item input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={addInputs[key] || ''}
                        onChange={e => setAddInputs(prev => ({ ...prev, [key]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') handleAdd(key); }}
                        placeholder={placeholder}
                        maxLength={200}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
                      />
                      <button
                        type="button"
                        disabled={!addInputs[key]?.trim() || addingCategory === key}
                        onClick={() => handleAdd(key)}
                        className="px-3 py-2 rounded-xl text-sm font-medium btn-disney disabled:opacity-50"
                      >
                        {addingCategory === key ? '...' : 'Add'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
