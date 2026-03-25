'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

function getSlides(totalQuestions: number) {
  return [
    {
      emoji: '🧠',
      title: 'Welcome to Disney Cruise Trivia',
      description: `Study ${totalQuestions.toLocaleString()}+ real questions from Disney cruise trivia nights. Practice with quizzes, flashcards, and timed challenges.`,
    },
    {
      emoji: '🚢',
      title: 'Your Cruise Companion',
      description: 'Explore staterooms, dining, characters, activities, and entertainment across all 8 Disney ships.',
    },
    {
      emoji: '✨',
      title: 'Get Started',
      description: 'Jump into a quiz or explore the cruise guide — your Disney cruise adventure starts here!',
    },
  ];
}

export default function OnboardingOverlay({ totalQuestions }: { totalQuestions: number }) {
  const SLIDES = getSlides(totalQuestions);
  const [visible, setVisible] = useState(false);
  const [slide, setSlide] = useState(0);
  const touchStartX = useRef(0);

  useEffect(() => {
    if (localStorage.getItem('onboarding-completed')) return;
    setVisible(true);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem('onboarding-completed', 'true');
  }, []);

  const next = useCallback(() => {
    if (slide < SLIDES.length - 1) setSlide(s => s + 1);
  }, [slide]);

  const prev = useCallback(() => {
    if (slide > 0) setSlide(s => s - 1);
  }, [slide]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  }, [next, prev]);

  if (!visible) return null;

  const currentSlide = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 animate-fade-in">
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden animate-slide-up"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Skip */}
        <div className="flex justify-end px-4 pt-4">
          <button
            type="button"
            onClick={dismiss}
            className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            Skip
          </button>
        </div>

        {/* Content */}
        <div className="px-8 pb-6 text-center">
          <div className="text-5xl mb-4">{currentSlide.emoji}</div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
            {currentSlide.title}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {currentSlide.description}
          </p>
        </div>

        {/* CTAs on last slide */}
        {isLast && (
          <div className="px-8 pb-4 flex flex-col gap-2">
            <Link
              href="/quiz"
              onClick={dismiss}
              className="block text-center px-6 py-3 rounded-xl font-semibold btn-disney text-sm"
            >
              Start Quiz
            </Link>
            <Link
              href="/Secret-menU"
              onClick={dismiss}
              className="block text-center px-6 py-3 rounded-xl font-semibold bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
            >
              Explore Cruise Guide
            </Link>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between px-8 pb-6 pt-2">
          {/* Dots */}
          <div className="flex gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSlide(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === slide
                    ? 'bg-disney-blue dark:bg-disney-gold'
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Next / Done */}
          {!isLast ? (
            <button
              type="button"
              onClick={next}
              className="text-sm font-medium text-disney-blue dark:text-disney-gold hover:underline"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={dismiss}
              className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:underline"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
