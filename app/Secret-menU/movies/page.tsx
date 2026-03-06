'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';
import { getStudios, getAllMovies, getUpcomingMovies, isUpcoming, getPosterUrl, type Movie, type Studio } from '@/lib/movie-data';
import { CATEGORY_COLORS } from '@/lib/guide-colors';

interface ChecklistEntry {
  id: string;
  movie_id: string;
  status: 'want_to_watch' | 'watched';
  rating: number | null;
}

const studios = getStudios();
const allMovies = getAllMovies();
const upcomingMovies = getUpcomingMovies();

const studioMap = new Map<string, Studio>();
for (const s of studios) studioMap.set(s.id, s);

// ALL movies grouped by studio (both released and upcoming), sorted by year desc
const allByStudio = studios.map(s => ({
  studio: s,
  movies: allMovies
    .filter(m => m.studio === s.id)
    .sort((a, b) => b.year - a.year),
})).filter(g => g.movies.length > 0);

function formatReleaseDate(dateStr: string): string {
  if (dateStr === '2029-12-31') return 'TBD';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MovieChecklistPage() {
  const { user, session } = useAuth();
  const [checklist, setChecklist] = useState<Map<string, ChecklistEntry>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<Set<string>>(new Set());

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [studioFilter, setStudioFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [expandedStudios, setExpandedStudios] = useState<Set<string>>(new Set());
  const [comingSoonExpanded, setComingSoonExpanded] = useState(false);
  const [sortMode, setSortMode] = useState<'year' | 'alpha'>('year');
  const [communityRatings, setCommunityRatings] = useState<Record<string, { avg: number; count: number }>>({});

  // Fetch community ratings (public, no auth needed)
  useEffect(() => {
    fetch('/api/movie-reviews?aggregate=1')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.ratings) setCommunityRatings(data.ratings); })
      .catch(() => {});
  }, []);

  // Fetch user's checklist
  const fetchChecklist = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/movie-checklist', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const map = new Map<string, ChecklistEntry>();
        for (const item of (data.items ?? [])) {
          map.set(item.movie_id, item);
        }
        setChecklist(map);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [session?.access_token]);

  useEffect(() => {
    if (user) fetchChecklist();
  }, [user, fetchChecklist]);

  // Upsert a movie status
  const setMovieStatus = useCallback(async (movieId: string, status: 'want_to_watch' | 'watched', rating?: number) => {
    if (!session?.access_token) return;
    setSaving(prev => new Set(prev).add(movieId));
    try {
      const res = await fetch('/api/movie-checklist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ movie_id: movieId, status, rating: rating ?? null }),
      });
      if (res.ok) {
        const data = await res.json();
        setChecklist(prev => {
          const next = new Map(prev);
          next.set(movieId, data.item);
          return next;
        });
      }
    } catch { /* ignore */ } finally {
      setSaving(prev => { const next = new Set(prev); next.delete(movieId); return next; });
    }
  }, [session?.access_token]);

  // Set rating on a watched movie
  const setMovieRating = useCallback(async (movieId: string, rating: number) => {
    const entry = checklist.get(movieId);
    if (!session?.access_token) return;
    setSaving(prev => new Set(prev).add(movieId));
    try {
      if (entry) {
        const res = await fetch('/api/movie-checklist', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ id: entry.id, rating }),
        });
        if (res.ok) {
          const data = await res.json();
          setChecklist(prev => {
            const next = new Map(prev);
            next.set(movieId, data.item);
            return next;
          });
        }
      } else {
        await setMovieStatus(movieId, 'watched', rating);
      }
    } catch { /* ignore */ } finally {
      setSaving(prev => { const next = new Set(prev); next.delete(movieId); return next; });
    }
  }, [session?.access_token, checklist, setMovieStatus]);

  // Remove a movie from checklist
  const removeMovie = useCallback(async (movieId: string) => {
    const entry = checklist.get(movieId);
    if (!entry || !session?.access_token) return;
    setSaving(prev => new Set(prev).add(movieId));
    try {
      const res = await fetch(`/api/movie-checklist?id=${entry.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        setChecklist(prev => {
          const next = new Map(prev);
          next.delete(movieId);
          return next;
        });
      }
    } catch { /* ignore */ } finally {
      setSaving(prev => { const next = new Set(prev); next.delete(movieId); return next; });
    }
  }, [session?.access_token, checklist]);

  // Handle status button click
  const handleStatusClick = useCallback((movieId: string, targetStatus: 'want_to_watch' | 'watched') => {
    const entry = checklist.get(movieId);
    if (entry?.status === targetStatus) {
      removeMovie(movieId);
    } else {
      setMovieStatus(movieId, targetStatus);
    }
  }, [checklist, removeMovie, setMovieStatus]);

  // Filter logic
  const matchesSearch = useCallback((movie: Movie) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const studio = studioMap.get(movie.studio);
    return (
      movie.title.toLowerCase().includes(q) ||
      movie.tagline.toLowerCase().includes(q) ||
      (studio?.label.toLowerCase().includes(q) ?? false)
    );
  }, [searchQuery]);

  const matchesStudio = useCallback((movie: Movie) => {
    if (!studioFilter) return true;
    return movie.studio === studioFilter;
  }, [studioFilter]);

  const matchesStatus = useCallback((movie: Movie) => {
    if (!statusFilter) return true;
    const entry = checklist.get(movie.id);
    if (!entry) return false;
    return entry.status === statusFilter;
  }, [statusFilter, checklist]);

  const filteredUpcoming = useMemo(() =>
    upcomingMovies.filter(m => matchesSearch(m) && matchesStudio(m) && matchesStatus(m)),
    [matchesSearch, matchesStudio, matchesStatus]
  );

  // All movies by studio (including upcoming), filtered and sorted
  const filteredByStudio = useMemo(() =>
    allByStudio.map(g => ({
      ...g,
      movies: g.movies
        .filter(m => matchesSearch(m) && matchesStudio(m) && matchesStatus(m))
        .sort((a, b) => sortMode === 'alpha' ? a.title.localeCompare(b.title) : b.year - a.year),
    })).filter(g => g.movies.length > 0),
    [matchesSearch, matchesStudio, matchesStatus, sortMode]
  );

  // Stats
  const watchedCount = useMemo(() => {
    let count = 0;
    for (const entry of checklist.values()) {
      if (entry.status === 'watched') count++;
    }
    return count;
  }, [checklist]);

  const wantToWatchCount = useMemo(() => {
    let count = 0;
    for (const entry of checklist.values()) {
      if (entry.status === 'want_to_watch') count++;
    }
    return count;
  }, [checklist]);

  const totalMovies = allMovies.length;

  const toggleStudio = (studioId: string) => {
    setExpandedStudios(prev => {
      const next = new Set(prev);
      if (next.has(studioId)) next.delete(studioId); else next.add(studioId);
      return next;
    });
  };

  // Studio pill counts
  const studioCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of studios) {
      counts.set(s.id, allMovies.filter(m => m.studio === s.id).length);
    }
    return counts;
  }, []);

  // Per-studio watched counts (all movies, not just released)
  const studioWatchedCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of studios) {
      let count = 0;
      for (const m of allMovies.filter(mv => mv.studio === s.id)) {
        if (checklist.get(m.id)?.status === 'watched') count++;
      }
      counts.set(s.id, count);
    }
    return counts;
  }, [checklist]);

  const hasResults = filteredUpcoming.length > 0 || filteredByStudio.length > 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/Secret-menU"
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Cruise Guide
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Movie Checklist</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Track Disney movies you want to watch and rate the ones you&apos;ve seen.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search movies, taglines, studios..."
          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
        />
      </div>

      {/* Studio filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
        <button
          onClick={() => setStudioFilter(null)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            !studioFilter
              ? 'bg-disney-navy text-white dark:bg-disney-gold dark:text-disney-navy'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
        >
          All ({totalMovies})
        </button>
        {studios.map(s => {
          const colors = CATEGORY_COLORS[s.color] ?? CATEGORY_COLORS.blue;
          return (
            <button
              key={s.id}
              onClick={() => setStudioFilter(studioFilter === s.id ? null : s.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                studioFilter === s.id ? colors.pill : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {s.emoji} {s.label.split(' ')[0]} ({studioCounts.get(s.id) ?? 0})
            </button>
          );
        })}
      </div>

      {/* Status filter pills (auth only) */}
      {user && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setStatusFilter(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !statusFilter
                ? 'bg-disney-navy text-white dark:bg-disney-gold dark:text-disney-navy'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === 'want_to_watch' ? null : 'want_to_watch')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === 'want_to_watch'
                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Want to Watch ({wantToWatchCount})
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === 'watched' ? null : 'watched')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === 'watched'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Watched ({watchedCount})
          </button>
        </div>
      )}

      {/* Collapse/Expand All + Sort */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => {
            const allExpanded = expandedStudios.size === studios.length && comingSoonExpanded;
            if (allExpanded) {
              setExpandedStudios(new Set());
              setComingSoonExpanded(false);
            } else {
              setExpandedStudios(new Set(studios.map(s => s.id)));
              setComingSoonExpanded(true);
            }
          }}
          className="text-xs font-medium text-disney-blue dark:text-disney-gold hover:underline"
        >
          {expandedStudios.size === studios.length && comingSoonExpanded ? 'Collapse All' : 'Expand All'}
        </button>
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-400 dark:text-slate-500 mr-1">Sort:</span>
          <button
            onClick={() => setSortMode('year')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
              sortMode === 'year'
                ? 'bg-disney-navy text-white dark:bg-disney-gold dark:text-disney-navy'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Year
          </button>
          <button
            onClick={() => setSortMode('alpha')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
              sortMode === 'alpha'
                ? 'bg-disney-navy text-white dark:bg-disney-gold dark:text-disney-navy'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            A-Z
          </button>
        </div>
      </div>

      {/* Progress card (auth only) */}
      {user && !loading && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Movies Watched</span>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {watchedCount} / {totalMovies}
            </span>
          </div>
          <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-disney-gradient rounded-full transition-all duration-500"
              style={{ width: `${totalMovies > 0 ? (watchedCount / totalMovies) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 text-center">
            {totalMovies > 0 ? Math.round((watchedCount / totalMovies) * 100) : 0}% complete
          </p>
        </div>
      )}

      {user && loading && (
        <div className="text-center py-8">
          <p className="text-slate-500 dark:text-slate-400">Loading your checklist...</p>
        </div>
      )}

      {/* Coming Soon Section (collapsible) */}
      {filteredUpcoming.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden border-l-4 border-l-disney-gold mb-4">
          <button
            onClick={() => setComingSoonExpanded(!comingSoonExpanded)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
          >
            <span className="text-xl">🎬</span>
            <span className="font-semibold text-slate-900 dark:text-white flex-1 text-sm">Coming Soon</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {filteredUpcoming.length}
            </span>
            <svg
              className={`w-5 h-5 text-slate-400 transition-transform ${comingSoonExpanded ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {comingSoonExpanded && (
            <div className="border-t border-slate-100 dark:border-slate-700 px-3 py-2 space-y-2">
              {filteredUpcoming.map(movie => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  studio={studioMap.get(movie.studio)!}
                  entry={checklist.get(movie.id)}
                  isSaving={saving.has(movie.id)}
                  isAuthed={!!user}
                  onStatusClick={handleStatusClick}
                  onRatingClick={setMovieRating}
                  showDate
                  communityRating={communityRatings[movie.id]?.avg}
                  communityCount={communityRatings[movie.id]?.count}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* All Movies by Studio */}
      {filteredByStudio.length > 0 && (
        <div className="space-y-3">
          {filteredByStudio.map(({ studio, movies: studioMovies }) => {
            const isExpanded = expandedStudios.has(studio.id);
            const colors = CATEGORY_COLORS[studio.color] ?? CATEGORY_COLORS.blue;
            const studioWatched = studioWatchedCounts.get(studio.id) ?? 0;
            const studioTotal = allMovies.filter(m => m.studio === studio.id).length;

            return (
              <div key={studio.id} className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden border-l-4 ${colors.card}`}>
                <button
                  onClick={() => toggleStudio(studio.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <span className="text-xl">{studio.emoji}</span>
                  <span className="font-semibold text-slate-900 dark:text-white flex-1 text-sm">{studio.label}</span>
                  {user && (
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {studioWatched}/{studioTotal}
                    </span>
                  )}
                  <svg
                    className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-700 px-3 py-2 space-y-2">
                    {studioMovies.map(movie => (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        studio={studio}
                        entry={checklist.get(movie.id)}
                        isSaving={saving.has(movie.id)}
                        isAuthed={!!user}
                        onStatusClick={handleStatusClick}
                        onRatingClick={setMovieRating}
                        showDate={isUpcoming(movie)}
                        communityRating={communityRatings[movie.id]?.avg}
                        communityCount={communityRatings[movie.id]?.count}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty states */}
      {!hasResults && (
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400">No movies match your filters.</p>
          <button
            onClick={() => { setSearchQuery(''); setStudioFilter(null); setStatusFilter(null); }}
            className="text-sm font-medium text-disney-blue dark:text-disney-gold hover:underline mt-2"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

// --- Movie Card Component ---

function MovieCard({
  movie,
  studio,
  entry,
  isSaving,
  isAuthed,
  onStatusClick,
  onRatingClick,
  showDate,
  communityRating,
  communityCount,
}: {
  movie: Movie;
  studio: Studio;
  entry?: ChecklistEntry;
  isSaving: boolean;
  isAuthed: boolean;
  onStatusClick: (movieId: string, status: 'want_to_watch' | 'watched') => void;
  onRatingClick: (movieId: string, rating: number) => void;
  showDate?: boolean;
  communityRating?: number;
  communityCount?: number;
}) {
  const colors = CATEGORY_COLORS[studio.color] ?? CATEGORY_COLORS.blue;
  const posterUrl = getPosterUrl(movie, 'w185');

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 border-l-4 ${colors.card} ${isSaving ? 'opacity-60' : ''}`}>
      <div className="flex gap-3">
        {/* Poster thumbnail */}
        {posterUrl ? (
          <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-700">
            <Image
              src={posterUrl}
              alt={movie.title}
              width={48}
              height={64}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-12 h-16 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xl flex-shrink-0">
            {movie.posterEmoji}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/Secret-menU/movies/${movie.id}`}
                className="text-sm font-semibold text-slate-900 dark:text-white truncate block hover:text-disney-blue dark:hover:text-disney-gold transition-colors"
              >
                {movie.title}
                <span className="text-slate-400 dark:text-slate-500 font-normal ml-1.5">({movie.year})</span>
              </Link>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{movie.tagline}</p>
            </div>
            {/* Community rating badge */}
            {communityRating != null && communityCount != null && communityCount > 0 && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-disney-gold text-sm">★</span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{communityRating}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">({communityCount})</span>
              </div>
            )}
          </div>

          {/* Release date for upcoming */}
          {showDate && (
            <p className="text-xs font-medium text-disney-blue dark:text-disney-gold mt-1">
              {formatReleaseDate(movie.releaseDate)}
            </p>
          )}

          {/* Action buttons (auth only) */}
          {isAuthed && (
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => onStatusClick(movie.id, 'want_to_watch')}
                disabled={isSaving}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                  entry?.status === 'want_to_watch'
                    ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-900/20 dark:hover:text-violet-300'
                }`}
              >
                Want to Watch
              </button>
              <button
                onClick={() => onStatusClick(movie.id, 'watched')}
                disabled={isSaving}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                  entry?.status === 'watched'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-300'
                }`}
              >
                Watched
              </button>

              {/* Star rating (inline, only when watched) */}
              {entry?.status === 'watched' && (
                <div className="flex items-center gap-0.5 ml-auto">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => onRatingClick(movie.id, star)}
                      disabled={isSaving}
                      className="text-base leading-none transition-colors"
                      aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                    >
                      <span className={
                        (entry.rating ?? 0) >= star
                          ? 'text-disney-gold'
                          : 'text-slate-300 dark:text-slate-600'
                      }>
                        ★
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
