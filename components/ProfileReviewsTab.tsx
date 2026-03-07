'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPendingMutations, removeMutation, type QueuedMutation } from '@/lib/offline-store';
import { getReviewType, REVIEW_TYPE_LABELS, REVIEW_TYPE_EMOJI } from '@/lib/review-utils';
import { getVenueById } from '@/lib/unified-data';
import { getFoodieVenueById } from '@/lib/foodie-data';
import { getMovieById } from '@/lib/movie-data';
import { getActivityById } from '@/lib/things-to-do-data';
import QueuedReviewEditor from './QueuedReviewEditor';

const FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'venue', label: 'Venues' },
  { key: 'foodie', label: 'Foodies' },
  { key: 'dining', label: 'Dining' },
  { key: 'activity', label: 'Activities' },
  { key: 'stateroom', label: 'Staterooms' },
  { key: 'movie', label: 'Movies' },
  { key: 'sailing', label: 'Sailings' },
  { key: 'hack', label: 'Hacks' },
];

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function resolveReviewName(review: Record<string, unknown>, reviewType: string): string {
  if (reviewType === 'venue' && review.venue_id) {
    const venue = getVenueById(review.venue_id as string);
    return venue?.name || (review.venue_id as string);
  }
  if (reviewType === 'foodie' && review.venue_id) {
    const venue = getFoodieVenueById(review.venue_id as string);
    return venue?.name || (review.venue_id as string);
  }
  if (reviewType === 'dining' && review.restaurant_id) {
    return review.restaurant_id as string;
  }
  if (reviewType === 'activity' && review.activity_id) {
    const activity = getActivityById(review.activity_id as string);
    return activity?.name || (review.activity_id as string);
  }
  if (reviewType === 'stateroom' && review.stateroom_number) {
    return `Stateroom #${review.stateroom_number}`;
  }
  if (reviewType === 'movie' && review.movie_id) {
    const movie = getMovieById(review.movie_id as string);
    return movie?.title || (review.movie_id as string);
  }
  if (reviewType === 'sailing') {
    const start = review.sail_start_date as string;
    const end = review.sail_end_date as string;
    if (start && end) {
      return `${new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return 'Sailing';
  }
  if (reviewType === 'hack' && review.title) {
    return review.title as string;
  }
  return '';
}

function getRating(review: Record<string, unknown>, reviewType: string): number {
  if (reviewType === 'stateroom') return (review.stateroom_rating as number) || 0;
  if (reviewType === 'sailing') return (review.overall_rating as number) || 0;
  return (review.rating as number) || 0;
}

interface Props {
  userId: string;
}

export default function ProfileReviewsTab({ userId }: Props) {
  // Outbox state
  const [pendingMutations, setPendingMutations] = useState<QueuedMutation[]>([]);
  const [editingMutation, setEditingMutation] = useState<QueuedMutation | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Published state
  const [publishedReviews, setPublishedReviews] = useState<Record<string, unknown>[]>([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingPublished, setLoadingPublished] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Load pending mutations from IndexedDB
  useEffect(() => {
    getPendingMutations()
      .then((mutations) => {
        // Only show review-type mutations
        setPendingMutations(mutations.filter((m) => m.type === 'review'));
      })
      .catch(() => {});
  }, []);

  // Fetch published reviews
  const fetchPublished = useCallback(
    async (cursor?: string | null) => {
      const isLoadMore = !!cursor;
      if (isLoadMore) setLoadingMore(true);
      else setLoadingPublished(true);

      try {
        const params = new URLSearchParams({ type: typeFilter, limit: '20' });
        if (cursor) params.set('cursor', cursor);

        const res = await fetch(`/api/profiles/${userId}/reviews?${params}`);
        if (res.ok) {
          const data = await res.json();
          if (isLoadMore) {
            setPublishedReviews((prev) => [...prev, ...(data.reviews ?? [])]);
          } else {
            setPublishedReviews(data.reviews ?? []);
          }
          setNextCursor(data.next_cursor ?? null);
        }
      } catch {
        // Silently fail
      } finally {
        setLoadingPublished(false);
        setLoadingMore(false);
      }
    },
    [userId, typeFilter]
  );

  useEffect(() => {
    fetchPublished();
  }, [fetchPublished]);

  const handleDeleteQueued = async (id: number) => {
    setDeletingId(id);
    try {
      await removeMutation(id);
      setPendingMutations((prev) => prev.filter((m) => m.id !== id));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditSave = (updated: QueuedMutation) => {
    setPendingMutations((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setEditingMutation(null);
  };

  const reviewMutations = pendingMutations;

  return (
    <div className="space-y-6">
      {/* Outbox Section */}
      {reviewMutations.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            Outbox
            <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
              ({reviewMutations.length} pending)
            </span>
          </h2>
          <div className="space-y-3">
            {reviewMutations.map((mutation) => {
              const type = getReviewType(mutation.url);
              const body = mutation.body as Record<string, unknown>;
              const retryCount = mutation.retry_count ?? 0;
              const isFailed = retryCount >= 5;
              const ratingVal = getRating(body, type);

              return (
                <div
                  key={mutation.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{REVIEW_TYPE_EMOJI[type] || '📝'}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {REVIEW_TYPE_LABELS[type] || type}
                        </span>
                        {isFailed ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                            Failed
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                            Pending
                          </span>
                        )}
                      </div>

                      {/* Key info */}
                      {typeof body.ship_name === 'string' && (
                        <div className="text-sm text-slate-600 dark:text-slate-400">{body.ship_name}</div>
                      )}
                      {ratingVal > 0 && <StarDisplay rating={ratingVal} />}
                      {typeof body.review_text === 'string' && body.review_text && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                          {body.review_text}
                        </p>
                      )}

                      {isFailed && mutation.last_error && (
                        <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                          Error: {mutation.last_error}
                        </p>
                      )}

                      <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {new Date(mutation.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => setEditingMutation(mutation)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-disney-blue/10 text-disney-blue dark:bg-disney-gold/10 dark:text-disney-gold hover:bg-disney-blue/20 dark:hover:bg-disney-gold/20 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this queued review?')) handleDeleteQueued(mutation.id!);
                        }}
                        disabled={deletingId === mutation.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                      >
                        {deletingId === mutation.id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Published Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Published Reviews</h2>

        {/* Type filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setTypeFilter(opt.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                typeFilter === opt.key
                  ? 'bg-disney-blue text-white dark:bg-disney-gold dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {loadingPublished ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
            Loading reviews...
          </div>
        ) : publishedReviews.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">💬</div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No published reviews yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {publishedReviews.map((review) => {
              const reviewType = String(review.review_type || 'unknown');
              const name = resolveReviewName(review, reviewType);
              const ratingVal = getRating(review, reviewType);
              const shipName = typeof review.ship_name === 'string' ? review.ship_name : undefined;

              return (
                <div
                  key={`${reviewType}-${review.id}`}
                  className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0"
                >
                  <span className="text-lg flex-shrink-0">{REVIEW_TYPE_EMOJI[reviewType] || '📝'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {name}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      {shipName && <span>{shipName}</span>}
                      <span>
                        {new Date(String(review.created_at)).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      {typeof review.verdict === 'string' && review.verdict && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            review.verdict === 'Must Try'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : review.verdict === 'Worth It'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}
                        >
                          {review.verdict}
                        </span>
                      )}
                    </div>
                    {typeof review.review_text === 'string' && review.review_text && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                        {review.review_text}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {ratingVal > 0 && <StarDisplay rating={ratingVal} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {nextCursor && (
          <div className="mt-4 text-center">
            <button
              onClick={() => fetchPublished(nextCursor)}
              disabled={loadingMore}
              className="px-6 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>

      {/* Queued Review Editor Modal */}
      {editingMutation && (
        <QueuedReviewEditor
          mutation={editingMutation}
          onSave={handleEditSave}
          onCancel={() => setEditingMutation(null)}
        />
      )}
    </div>
  );
}
