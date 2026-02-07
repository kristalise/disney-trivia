'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Category } from '@/types';
import { getQuestionPriorities } from '@/lib/progress';

interface CategoryCardProps {
  category: Category;
}

const iconMap: Record<string, string> = {
  film: '🎬',
  castle: '🏰',
  ship: '🚢',
  shuffle: '🎲',
};

export default function CategoryCard({ category }: CategoryCardProps) {
  const [progress, setProgress] = useState<{ answered: number; total: number } | null>(null);

  useEffect(() => {
    // Read cached question IDs for this category (stored when user visits the quiz)
    const cached = localStorage.getItem(`trivia-category-questions-${category.slug}`);
    if (!cached) return;

    try {
      const questionIds: string[] = JSON.parse(cached);
      const priorities = getQuestionPriorities(questionIds);
      const correctCount = questionIds.filter(id => priorities.get(id) === -1).length;
      setProgress({ answered: correctCount, total: questionIds.length });
    } catch {
      // Invalid cache, ignore
    }
  }, [category.slug]);

  const progressPercent = progress && progress.total > 0
    ? Math.round((progress.answered / progress.total) * 100)
    : 0;

  return (
    <Link href={`/quiz/${category.slug}`}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md card-hover cursor-pointer border border-slate-200 dark:border-slate-700">
        <div className="text-4xl mb-4">
          {iconMap[category.icon || ''] || '📚'}
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {category.name}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          {category.description}
        </p>

        {/* Progress bar - shows after user has visited this category at least once */}
        {progress && progress.total > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>{progress.answered}/{progress.total} completed</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-disney-blue dark:bg-disney-gold h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center text-disney-blue dark:text-disney-gold font-medium text-sm">
          {progress && progress.answered > 0 ? 'Continue Quiz' : 'Start Quiz'}
          <svg
            className="w-4 h-4 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}
