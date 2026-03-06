'use client';

import { useEffect, useState } from 'react';
import Confetti from '@/components/Confetti';
import type { CastawayInfo } from '@/lib/castaway-levels';

interface CastawayLevelUpProps {
  newLevel: CastawayInfo;
  onDismiss: () => void;
}

export default function CastawayLevelUp({ newLevel, onDismiss }: CastawayLevelUpProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger fade-in after mount
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setVisible(true);
      });
    });
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onDismiss}
      />

      {/* Confetti */}
      <Confetti />

      {/* Card */}
      <div
        className={`relative z-10 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-8 mx-4 max-w-sm w-full text-center transition-all duration-500 ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
      >
        <div className="text-6xl mb-4">{newLevel.emoji}</div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Level Up!
        </h2>
        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">
          You&apos;ve reached{' '}
          <span className={newLevel.color.replace('text-', 'text-') + ' font-bold'}>
            {newLevel.label} Castaway
          </span>
          !
        </p>

        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 mb-6 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">Activity booking opens</span>
            <span className="font-semibold text-slate-900 dark:text-white">{newLevel.activityDays} days before</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">Online check-in opens</span>
            <span className="font-semibold text-slate-900 dark:text-white">{newLevel.checkInDays} days before</span>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="w-full px-6 py-3 rounded-xl font-medium btn-disney"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
