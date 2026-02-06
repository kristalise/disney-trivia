'use client';

import { useState, useEffect, useCallback } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
}

export default function SearchBar({
  onSearch,
  placeholder = 'Search trivia questions...',
  initialValue = ''
}: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);

  // Debounced search
  const debouncedSearch = useCallback(
    (searchQuery: string) => {
      const timer = setTimeout(() => {
        onSearch(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    },
    [onSearch]
  );

  useEffect(() => {
    if (query.length >= 2 || query.length === 0) {
      const cleanup = debouncedSearch(query);
      return cleanup;
    }
  }, [query, debouncedSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:border-disney-blue dark:focus:border-disney-gold focus:outline-none transition-colors text-lg"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center"
          >
            <svg
              className="h-5 w-5 text-slate-400 hover:text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </form>
  );
}
