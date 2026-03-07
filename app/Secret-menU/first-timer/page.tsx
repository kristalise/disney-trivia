'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import firstTimerData from '@/data/first-timer-data.json';

interface HackReview {
  id: string;
  title: string;
  hack_text: string;
  verdict: string;
  rating: number;
  category: string;
  reviewer_name?: string;
}

export default function FirstTimerPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [communityHacks, setCommunityHacks] = useState<HackReview[]>([]);
  const [hacksLoading, setHacksLoading] = useState(false);

  const sections = firstTimerData.sections;

  useEffect(() => {
    setHacksLoading(true);
    fetch('/api/cruise-hacks?category=First-Time')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.reviews) setCommunityHacks(data.reviews.slice(0, 6)); })
      .catch(() => {})
      .finally(() => setHacksLoading(false));
  }, []);

  const filteredSections = useMemo(() => {
    if (!searchQuery && !activeSection) return sections;
    return sections
      .filter(s => !activeSection || s.id === activeSection)
      .map(s => ({
        ...s,
        items: searchQuery
          ? s.items.filter(i =>
              i.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
              i.answer.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : s.items,
      }))
      .filter(s => s.items.length > 0);
  }, [sections, searchQuery, activeSection]);

  const toggleItem = (sectionId: string, idx: number) => {
    const key = `${sectionId}-${idx}`;
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">First-Timer&apos;s Guide to Disney Cruise Line</h1>
        <p className="text-slate-600 dark:text-slate-400">Everything you need to know for your first Disney cruise, from booking to debarkation.</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tips..."
          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
        />
      </div>

      {/* Section Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveSection(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            !activeSection
              ? 'bg-disney-blue text-white border-disney-blue dark:bg-disney-gold dark:text-slate-900 dark:border-disney-gold'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600'
          }`}
        >
          All
        </button>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id === activeSection ? null : s.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeSection === s.id
                ? 'bg-disney-blue text-white border-disney-blue dark:bg-disney-gold dark:text-slate-900 dark:border-disney-gold'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600'
            }`}
          >
            {s.emoji} {s.title}
          </button>
        ))}
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {filteredSections.map(section => (
          <div key={section.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-disney-blue/5 to-transparent dark:from-disney-blue/10">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-2xl">{section.emoji}</span>
                {section.title}
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({section.items.length})</span>
              </h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {section.items.map((item, idx) => {
                const key = `${section.id}-${idx}`;
                const isExpanded = expandedItems.has(key);
                return (
                  <div key={idx}>
                    <button
                      onClick={() => toggleItem(section.id, idx)}
                      className="w-full px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-start gap-3"
                    >
                      <svg
                        className={`w-5 h-5 mt-0.5 flex-shrink-0 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="font-medium text-slate-900 dark:text-white text-sm">{item.question}</span>
                    </button>
                    {isExpanded && (
                      <div className="px-6 pb-4 pl-14">
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.answer}</p>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {item.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Community Hacks Section */}
      <div className="mt-10">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          Community First-Timer Hacks
        </h2>
        {hacksLoading ? (
          <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">Loading community hacks...</div>
        ) : communityHacks.length > 0 ? (
          <div className="space-y-3">
            {communityHacks.map(hack => (
              <div key={hack.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{hack.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ml-2 ${
                    hack.verdict === 'Must Try' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                    hack.verdict === 'Worth It' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {hack.verdict}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">{hack.hack_text}</p>
              </div>
            ))}
            <Link href="/Secret-menU/hacks" className="block text-center text-sm text-disney-blue dark:text-disney-gold hover:underline py-2">
              View all community hacks &rarr;
            </Link>
          </div>
        ) : (
          <div className="text-center py-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">No community hacks yet.</p>
            <Link href="/Secret-menU/hacks" className="text-sm text-disney-blue dark:text-disney-gold hover:underline mt-1 inline-block">
              Share a hack &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
