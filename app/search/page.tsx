'use client';

import { useState, useEffect, useCallback } from 'react';
import SearchBar from '@/components/SearchBar';
import QuestionCard from '@/components/QuestionCard';
import { Question, Category } from '@/types';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [results, setResults] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/questions?categoriesOnly=true');
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    }
    loadCategories();
  }, []);

  const handleSearch = useCallback(async (searchQuery: string) => {
    setQuery(searchQuery);
    setHasSearched(true);

    if (!searchQuery && !category) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (category) params.set('category', category);

      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      setResults(data.questions || []);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  useEffect(() => {
    if (category) {
      handleSearch(query);
    }
  }, [category, query, handleSearch]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Search Trivia Database
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Find questions and answers from our entire trivia collection
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto">
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search questions, answers, or topics..."
        />
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={() => setCategory('')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            category === ''
              ? 'bg-disney-blue text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.slug)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              category === cat.slug
                ? 'bg-disney-blue text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="max-w-3xl mx-auto">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4 animate-bounce">🔍</div>
            <p className="text-slate-600 dark:text-slate-400">Searching...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Found {results.length} question{results.length === 1 ? '' : 's'}
            </p>
            {results.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))}
          </div>
        ) : hasSearched ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🤔</div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No questions found
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Try a different search term or category
            </p>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Start Searching
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Enter a search term or select a category to browse questions
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
