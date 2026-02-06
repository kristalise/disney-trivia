'use client';

import Link from 'next/link';
import { Category } from '@/types';

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
        <div className="mt-4 flex items-center text-disney-blue dark:text-disney-gold font-medium text-sm">
          Start Quiz
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
