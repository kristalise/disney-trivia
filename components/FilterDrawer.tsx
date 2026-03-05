'use client';

import { useState, useEffect, useCallback } from 'react';

interface FilterDrawerProps {
  children: React.ReactNode;
  activeCount: number;
  onClear: () => void;
  title?: string;
}

export default function FilterDrawer({ children, activeCount, onClear, title = 'Filters' }: FilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleClose = useCallback(() => setIsOpen(false), []);

  return (
    <>
      {/* Desktop: render inline */}
      <div className="hidden md:block">
        {children}
      </div>

      {/* Mobile: trigger button + bottom sheet */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {title}
          {activeCount > 0 && (
            <span className="bg-disney-blue dark:bg-disney-gold text-white dark:text-slate-900 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Bottom sheet overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 animate-fade-in"
            onClick={handleClose}
          />

          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-800 rounded-t-2xl max-h-[85vh] flex flex-col animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {children}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-5 py-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
              <button
                type="button"
                onClick={() => { onClear(); handleClose(); }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium btn-disney"
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
