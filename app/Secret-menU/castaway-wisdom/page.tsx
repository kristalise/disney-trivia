'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import castawayWisdomData from '@/data/castaway-wisdom-data.json';

const CATEGORIES = ['Embarkation', 'Dining', 'Packing', 'Saving Money', 'Kids', 'First-Time'];

const LEVEL_META: Record<string, { label: string; emoji: string; color: string; gradient: string; border: string; textAccent: string }> = {
  new:      { label: 'First Sail', emoji: '\u2693', color: 'text-white',      gradient: 'from-slate-600 to-slate-700',   border: 'border-slate-500/30',   textAccent: 'text-slate-200' },
  silver:   { label: 'Silver',     emoji: '\uD83E\uDD48', color: 'text-slate-300',  gradient: 'from-slate-500 to-slate-600',   border: 'border-slate-400/30',   textAccent: 'text-slate-200' },
  gold:     { label: 'Gold',       emoji: '\uD83E\uDD47', color: 'text-yellow-300', gradient: 'from-amber-600 to-yellow-700',  border: 'border-amber-400/30',   textAccent: 'text-amber-200' },
  platinum: { label: 'Platinum',   emoji: '\uD83D\uDC8E', color: 'text-blue-200',   gradient: 'from-blue-600 to-indigo-700',   border: 'border-blue-400/30',    textAccent: 'text-blue-200' },
  pearl:    { label: 'Pearl',      emoji: '\uD83E\uDD0D', color: 'text-slate-100',  gradient: 'from-slate-300 to-slate-400 dark:from-slate-500 dark:to-slate-600', border: 'border-white/30', textAccent: 'text-slate-700 dark:text-slate-200' },
  concierge:{ label: 'Concierge',  emoji: '👑', color: 'text-purple-100', gradient: 'from-purple-600 to-indigo-700', border: 'border-purple-400/30', textAccent: 'text-purple-200' },
};

const LEVEL_ORDER = ['new', 'silver', 'gold', 'platinum', 'pearl', 'concierge'];

interface CommunityTip {
  id: string;
  user_id: string;
  castaway_level: string;
  category: string;
  title: string;
  tip_text: string;
  upvotes: number;
  created_at: string;
  reviewer_name?: string;
  reviewer_avatar?: string | null;
  reviewer_handle?: string | null;
  user_upvoted?: boolean;
  author_sailings?: number;
  author_ships?: number;
  author_reviews?: number;
}

export default function CastawayWisdomPage() {
  const { user, session } = useAuth();
  const [activeLevel, setActiveLevel] = useState('new');
  const [activeCategory, setActiveCategory] = useState('all');
  const [communityTips, setCommunityTips] = useState<CommunityTip[]>([]);
  const [loading, setLoading] = useState(false);

  // Form
  const [formTitle, setFormTitle] = useState('');
  const [formTip, setFormTip] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  const fetchTips = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ level: activeLevel });
      if (activeCategory !== 'all') params.set('category', activeCategory);
      const res = await fetch(`/api/castaway-tips?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCommunityTips(data.tips || []);
      }
    } catch { /* supplemental */ } finally { setLoading(false); }
  }, [activeLevel, activeCategory]);

  useEffect(() => { fetchTips(); }, [fetchTips]);

  const activeLevelData = useMemo(() => {
    return castawayWisdomData.levels.find(l => l.level === activeLevel);
  }, [activeLevel]);

  // Curated tips for active level + category
  const curatedTips = useMemo(() => {
    if (!activeLevelData) return [];
    return activeCategory === 'all'
      ? activeLevelData.tips
      : activeLevelData.tips.filter(t => t.category === activeCategory);
  }, [activeLevelData, activeCategory]);

  const handleUpvote = async (tipId: string) => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`/api/castaway-tips/${tipId}/upvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) fetchTips();
    } catch { /* supplemental */ }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMsg('');
    if (!formTitle || !formTip || !formCategory) { setSubmitMsg('Please fill in all fields.'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/castaway-tips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ title: formTitle, tip_text: formTip, category: formCategory }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitMsg(data.error || 'Failed to submit.'); return; }
      setSubmitMsg('Tip submitted!');
      setFormTitle(''); setFormTip(''); setFormCategory('');
      fetchTips();
    } catch { setSubmitMsg('Failed to submit.'); } finally { setSubmitting(false); }
  };

  const meta = LEVEL_META[activeLevel];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/Secret-menU" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Cruise Guide
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Castaway Club Wisdom</h1>
        <p className="text-slate-600 dark:text-slate-400">Benefits, hidden perks, and insider tips for every Castaway Club level.</p>
      </div>

      {/* Level Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {LEVEL_ORDER.map(level => {
          const m = LEVEL_META[level];
          return (
            <button
              key={level}
              onClick={() => setActiveLevel(level)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeLevel === level
                  ? 'bg-disney-blue text-white border-disney-blue dark:bg-disney-gold dark:text-slate-900 dark:border-disney-gold'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
              }`}
            >
              <span>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Level Header Card */}
      {activeLevelData && (
        <div className={`bg-gradient-to-br ${meta.gradient} rounded-2xl p-5 shadow-lg border ${meta.border} mb-6`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{meta.emoji}</span>
            <div>
              <h2 className="text-xl font-bold text-white dark:text-white">{meta.label}</h2>
              <p className={`text-sm ${meta.textAccent}`}>{activeLevelData.sailings} {activeLevelData.sailings === '0' ? 'sailings' : 'sailings'}</p>
            </div>
          </div>
          <p className={`text-sm ${meta.textAccent} leading-relaxed`}>{activeLevelData.description}</p>
        </div>
      )}

      {/* Official Benefits */}
      {activeLevelData && activeLevelData.benefits.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 mb-4 overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Official Benefits
            </h3>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {activeLevelData.benefits.map((b, i) => (
              <li key={i} className="px-5 py-3 flex items-start gap-3">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-slate-700 dark:text-slate-300">{b.perk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Hidden Perks */}
      {activeLevelData && activeLevelData.hiddenPerks.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-amber-200 dark:border-amber-800/50 mb-6 overflow-hidden">
          <div className="px-5 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/50">
            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
              Hidden Perks & Insider Knowledge
            </h3>
          </div>
          <ul className="divide-y divide-amber-100 dark:divide-amber-900/20">
            {activeLevelData.hiddenPerks.map((p, i) => (
              <li key={i} className="px-5 py-3 flex items-start gap-3">
                <span className="text-amber-500 flex-shrink-0 mt-0.5 text-sm">&#9733;</span>
                <span className="text-sm text-slate-700 dark:text-slate-300">{p.perk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            activeCategory === 'all'
              ? 'bg-disney-blue text-white border-disney-blue dark:bg-disney-gold dark:text-slate-900 dark:border-disney-gold'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600'
          }`}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat === activeCategory ? 'all' : cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeCategory === cat
                ? 'bg-disney-blue text-white border-disney-blue dark:bg-disney-gold dark:text-slate-900 dark:border-disney-gold'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Curated Tips */}
      {curatedTips.length > 0 && (
        <div className="space-y-3 mb-8">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Curated Tips</h3>
          {curatedTips.map(tip => (
            <div key={tip.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-start gap-3">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex-shrink-0 mt-0.5">
                  Curated
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">{tip.title}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{tip.tip}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">{tip.category}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Community Tips */}
      <div className="space-y-3 mb-8">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Community Tips</h3>
        {loading ? (
          <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">Loading tips...</div>
        ) : communityTips.length > 0 ? (
          communityTips.map(tip => (
            <div key={tip.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleUpvote(tip.id)}
                  disabled={!user}
                  className={`flex flex-col items-center gap-0.5 flex-shrink-0 pt-0.5 ${user ? 'hover:text-disney-blue dark:hover:text-disney-gold cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                >
                  <svg className={`w-5 h-5 ${tip.user_upvoted ? 'text-disney-blue dark:text-disney-gold' : 'text-slate-400'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 3l-2.5 5H3l4 3.5-1.5 5.5L10 14l4.5 3-1.5-5.5 4-3.5h-4.5L10 3z" />
                  </svg>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{tip.upvotes}</span>
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-1">
                    {tip.reviewer_name && (
                      <Link href={`/profile/${tip.reviewer_handle || tip.user_id}`} className="text-xs font-medium text-slate-700 dark:text-slate-300 hover:underline">
                        {tip.reviewer_name}
                      </Link>
                    )}
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                      {LEVEL_META[tip.castaway_level]?.emoji} {LEVEL_META[tip.castaway_level]?.label}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {tip.author_ships ?? 0} {(tip.author_ships ?? 0) === 1 ? 'ship' : 'ships'} &middot; {tip.author_reviews ?? 0} {(tip.author_reviews ?? 0) === 1 ? 'review' : 'reviews'}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">{tip.title}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{tip.tip_text}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">{tip.category}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">No community tips for this level yet. Be the first to share one!</p>
          </div>
        )}
      </div>

      {/* Submit Form */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Share a Tip</h3>
        {user ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tip Title</label>
              <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} maxLength={200} placeholder="e.g. Best time to book spa treatments"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Your Tip</label>
              <textarea value={formTip} onChange={(e) => setFormTip(e.target.value)} maxLength={2000} rows={3} placeholder="Share your wisdom..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
              <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent">
                <option value="">Select category...</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            {submitMsg && (
              <div className={`text-sm rounded-xl px-4 py-3 ${submitMsg.includes('submitted') ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'}`}>
                {submitMsg}
              </div>
            )}
            <button type="submit" disabled={submitting}
              className="w-full px-6 py-3 rounded-xl font-medium btn-disney disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Submitting...' : 'Share Tip'}
            </button>
          </form>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Sign in to share a tip. Your Castaway level is auto-detected from your sailing history.</p>
            <Link href="/auth" className="inline-block px-6 py-2.5 rounded-xl font-medium btn-disney">Sign In</Link>
          </div>
        )}
      </div>
    </div>
  );
}
