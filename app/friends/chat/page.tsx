'use client';

import { useState } from 'react';
import Link from 'next/link';

type Phase = 'pre_cruise' | 'on_cruise' | 'post_cruise';

const PHASES: { key: Phase; label: string; emoji: string; description: string }[] = [
  {
    key: 'pre_cruise',
    label: 'Pre-Cruise',
    emoji: '📋',
    description: 'Plan and coordinate with your travel party before you board. Share packing lists, meet-up plans, and FE group details.',
  },
  {
    key: 'on_cruise',
    label: 'On-Cruise',
    emoji: '🚢',
    description: 'Stay connected with your group while on board. Coordinate meetups, share photos, and plan your day together — even without internet.',
  },
  {
    key: 'post_cruise',
    label: 'Post-Cruise',
    emoji: '📸',
    description: 'Keep the magic alive after you disembark. Share photos, swap contact info, and plan your next sailing together.',
  },
];

export default function ChatPage() {
  const [activePhase, setActivePhase] = useState<Phase>('pre_cruise');

  const currentPhase = PHASES.find(p => p.key === activePhase)!;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/friends" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Friends
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Chat</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">Message your friends and travel companions.</p>
      </div>

      {/* Phase Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
        {PHASES.map(phase => (
          <button
            key={phase.key}
            onClick={() => setActivePhase(phase.key)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activePhase === phase.key
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {phase.label}
          </button>
        ))}
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
        <div className="text-5xl mb-4">{currentPhase.emoji}</div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          {currentPhase.label} Chat
        </h2>
        <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-disney-blue/10 text-disney-blue dark:bg-disney-gold/10 dark:text-disney-gold mb-4">
          Coming Soon
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          {currentPhase.description}
        </p>
      </div>

      {/* Info cards */}
      <div className="mt-6 grid gap-3">
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">💬</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Direct Messages</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Chat one-on-one with friends and people you&apos;ve met on ship.</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">👥</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Group Chat</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Coordinate with your sailing group or FE exchange partners.</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">📡</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Offline Ready</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Designed to work without internet on the ship. Messages sync when you reconnect.</p>
        </div>
      </div>
    </div>
  );
}
