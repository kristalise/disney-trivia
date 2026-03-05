'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

const SHIPS = [
  'Disney Magic', 'Disney Wonder', 'Disney Dream', 'Disney Fantasy',
  'Disney Wish', 'Disney Treasure', 'Disney Destiny', 'Disney Adventure',
] as const;

type ShipName = (typeof SHIPS)[number];

const CATEGORIES = ['Embarkation', 'Dining', 'Packing', 'Saving Money', 'Kids', 'First-Time'];
const VERDICTS = ['Must Try', 'Worth It', 'Skip It'] as const;
type Verdict = (typeof VERDICTS)[number];

const VERDICT_COLORS: Record<Verdict, string> = {
  'Must Try': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  'Worth It': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  'Skip It': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

const VERDICT_BAR_COLORS: Record<Verdict, string> = {
  'Must Try': 'bg-green-500',
  'Worth It': 'bg-blue-500',
  'Skip It': 'bg-red-500',
};

interface HackReview {
  id: string;
  ship_name: string | null;
  category: string;
  title: string;
  hack_text: string;
  verdict: Verdict;
  rating: number;
  review_text: string | null;
  created_at: string;
  reviewer_name?: string;
  reviewer_avatar?: string | null;
  reviewer_id?: string;
  reviewer_handle?: string | null;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function StarInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button" onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)} onClick={() => onChange(star)} className="focus:outline-none">
            <svg className={`w-8 h-8 transition-colors ${star <= (hover || value) ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

function VerdictBreakdownBar({ breakdown }: { breakdown: Record<string, number> }) {
  const total = Object.values(breakdown).reduce((s, v) => s + v, 0);
  if (total === 0) return null;

  return (
    <div className="mt-4">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Verdict Breakdown</p>
      <div className="flex rounded-full overflow-hidden h-3">
        {VERDICTS.map((v) => {
          const pct = total > 0 ? (breakdown[v] || 0) / total * 100 : 0;
          if (pct === 0) return null;
          return (
            <div key={v} className={`${VERDICT_BAR_COLORS[v]} transition-all`} style={{ width: `${pct}%` }} title={`${v}: ${Math.round(pct)}%`} />
          );
        })}
      </div>
      <div className="flex justify-between mt-1.5 text-xs text-slate-500 dark:text-slate-400">
        {VERDICTS.map((v) => {
          const pct = total > 0 ? Math.round((breakdown[v] || 0) / total * 100) : 0;
          return <span key={v}>{v}: {pct}%</span>;
        })}
      </div>
    </div>
  );
}

export default function CruiseHacksPage() {
  const { user, session } = useAuth();
  const [selectedShip, setSelectedShip] = useState<ShipName | ''>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const [reviews, setReviews] = useState<HackReview[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [verdictBreakdown, setVerdictBreakdown] = useState<Record<string, number>>({});
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Form
  const [formTitle, setFormTitle] = useState('');
  const [formHackText, setFormHackText] = useState('');
  const [formVerdict, setFormVerdict] = useState<Verdict | ''>('');
  const [formRating, setFormRating] = useState(0);
  const [formReviewText, setFormReviewText] = useState('');
  const [formShip, setFormShip] = useState<ShipName | ''>('');
  const [formCategory, setFormCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fetchHacks = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedShip) params.set('ship', selectedShip);
      if (activeCategory !== 'all') params.set('category', activeCategory);
      const res = await fetch(`/api/cruise-hacks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
        setTotalReviews(data.totalReviews);
        setVerdictBreakdown(data.verdictBreakdown);
      }
    } catch { /* supplemental */ } finally { setReviewsLoading(false); }
  }, [selectedShip, activeCategory]);

  useEffect(() => { fetchHacks(); }, [fetchHacks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess(false);

    if (!formTitle) { setSubmitError('Please enter a title.'); return; }
    if (!formHackText) { setSubmitError('Please describe the hack.'); return; }
    if (!formVerdict) { setSubmitError('Please select a verdict.'); return; }
    if (!formRating) { setSubmitError('Please select a rating.'); return; }
    if (!formCategory) { setSubmitError('Please select a category.'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/cruise-hacks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          ship_name: formShip || undefined,
          category: formCategory,
          title: formTitle,
          hack_text: formHackText,
          verdict: formVerdict,
          rating: formRating,
          review_text: formReviewText || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error || 'Failed to submit'); return; }
      setSubmitSuccess(true);
      setFormTitle(''); setFormHackText(''); setFormVerdict(''); setFormRating(0);
      setFormReviewText(''); setFormShip(''); setFormCategory('');
      fetchHacks();
    } catch { setSubmitError('Failed to submit.'); } finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/Secret-menU" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Cruise Guide
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">🏴‍☠️ Disney Cruise Hacks</h1>
        <p className="text-slate-600 dark:text-slate-400">Community-rated tips, tricks, and insider hacks for Disney Cruise Line.</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Filter by Ship (optional)</label>
          <select value={selectedShip} onChange={(e) => setSelectedShip(e.target.value as ShipName | '')}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent">
            <option value="">All Ships</option>
            {SHIPS.map((ship) => <option key={ship} value={ship}>{ship}</option>)}
          </select>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${activeCategory === 'all' ? 'bg-disney-blue text-white border-disney-blue dark:bg-disney-gold dark:text-slate-900 dark:border-disney-gold' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600'}`}>
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${activeCategory === cat ? 'bg-disney-blue text-white border-disney-blue dark:bg-disney-gold dark:text-slate-900 dark:border-disney-gold' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Verdict Breakdown */}
      {totalReviews > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {totalReviews} {totalReviews === 1 ? 'Hack' : 'Hacks'}
          </h3>
          <VerdictBreakdownBar breakdown={verdictBreakdown} />
        </div>
      )}

      {/* Hack Cards */}
      <div className="space-y-4 mb-6">
        {reviewsLoading ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">Loading hacks...</div>
        ) : reviews.length > 0 ? (
          reviews.map((hack) => (
            <div key={hack.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
              {hack.reviewer_id && (
                <Link href={`/profile/${hack.reviewer_handle || hack.reviewer_id}`} className="flex items-center gap-2 hover:underline mb-2">
                  {hack.reviewer_avatar ? (
                    <img src={hack.reviewer_avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-disney-gold flex items-center justify-center text-xs font-bold text-disney-blue">
                      {(hack.reviewer_name || 'A').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{hack.reviewer_name || 'Anonymous'}</span>
                </Link>
              )}
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-slate-900 dark:text-white">{hack.title}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ml-2 ${VERDICT_COLORS[hack.verdict]}`}>
                  {hack.verdict}
                </span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">{hack.hack_text}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StarDisplay rating={hack.rating} />
                  <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">{hack.category}</span>
                  {hack.ship_name && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">{hack.ship_name}</span>
                  )}
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {new Date(hack.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>
              {hack.review_text && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 italic">&ldquo;{hack.review_text}&rdquo;</p>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🏴‍☠️</div>
            <p className="text-slate-500 dark:text-slate-400">No hacks yet. Be the first to share one!</p>
          </div>
        )}
      </div>

      {/* Submit Hack Form */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Review a Hack</h3>
        {user ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Hack Title</label>
              <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} maxLength={200} placeholder="e.g. Book port excursions independently"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Hack Description</label>
              <textarea value={formHackText} onChange={(e) => setFormHackText(e.target.value)} maxLength={2000} rows={3} placeholder="Describe the hack in detail..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
              <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent">
                <option value="">Select category...</option>
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Verdict</label>
              <div className="flex gap-2">
                {VERDICTS.map((v) => (
                  <button key={v} type="button" onClick={() => setFormVerdict(v)}
                    className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                      formVerdict === v
                        ? v === 'Must Try' ? 'bg-green-500 text-white border-green-500'
                          : v === 'Worth It' ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-red-500 text-white border-red-500'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                    }`}>{v}</button>
                ))}
              </div>
            </div>

            <StarInput value={formRating} onChange={setFormRating} label="Rating" />

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Ship (optional)</label>
              <select value={formShip} onChange={(e) => setFormShip(e.target.value as ShipName | '')}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent">
                <option value="">All Ships / General</option>
                {SHIPS.map((ship) => <option key={ship} value={ship}>{ship}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Why this verdict? (optional)</label>
              <textarea value={formReviewText} onChange={(e) => setFormReviewText(e.target.value)} maxLength={1000} rows={2} placeholder="Explain your experience with this hack..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent resize-none" />
            </div>

            {submitError && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">{submitError}</div>}
            {submitSuccess && <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-3">Hack submitted!</div>}

            <button type="submit" disabled={submitting}
              className="w-full px-6 py-3 rounded-xl font-medium btn-disney disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Submitting...' : 'Submit Hack'}
            </button>
          </form>
        ) : (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">🔒</div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Sign in to share a hack.</p>
            <Link href="/auth" className="inline-block px-6 py-2.5 rounded-xl font-medium btn-disney">Sign In</Link>
          </div>
        )}
      </div>
    </div>
  );
}
