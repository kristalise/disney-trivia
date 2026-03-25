'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';

export default function QuickStats({ totalQuestions }: { totalQuestions: number }) {
  const stats = [
    { label: 'Categories', value: '13', icon: '📚' },
    { label: 'Questions', value: `${totalQuestions.toLocaleString()}+`, icon: '❓' },
    { label: 'Quiz Modes', value: '3', icon: '🎮' },
    { label: 'Works Offline', value: 'Yes!', icon: '📱' },
  ];
  const [tapCount, setTapCount] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const handleQuestionsTap = useCallback(() => {
    if (revealed) return;
    const next = tapCount + 1;
    setTapCount(next);
    if (next >= 5) {
      setRevealed(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('secret-menu-unlocked', 'true');
      }
    }
  }, [tapCount, revealed]);

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const isQuestionsStat = stat.label === 'Questions';

        if (isQuestionsStat && revealed) {
          return (
            <Link
              key="secret-menu-link"
              href="/Secret-menU"
              className="bg-white dark:bg-slate-800 rounded-xl p-4 text-center shadow-sm border border-slate-200 dark:border-slate-700 animate-pulse-once hover:border-disney-blue dark:hover:border-disney-gold transition-colors"
            >
              <div className="text-2xl mb-1">✨</div>
              <div className="text-lg font-bold text-disney-blue dark:text-disney-gold">
                Secret Menu
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                You found it!
              </div>
            </Link>
          );
        }

        return (
          <div
            key={stat.label}
            onClick={isQuestionsStat ? handleQuestionsTap : undefined}
            className={`bg-white dark:bg-slate-800 rounded-xl p-4 text-center shadow-sm border border-slate-200 dark:border-slate-700${
              isQuestionsStat ? ' cursor-pointer select-none active:scale-95 transition-transform' : ''
            }`}
          >
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stat.value}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {stat.label}
            </div>
          </div>
        );
      })}
    </section>
  );
}
