'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';
import { getMovieById, getStudios, isUpcoming, getPosterUrl, type Movie, type Studio } from '@/lib/movie-data';

const studios = getStudios();
const studioMap = new Map<string, Studio>();
for (const s of studios) studioMap.set(s.id, s);

interface ChecklistEntry {
  id: string;
  movie_id: string;
  status: 'want_to_watch' | 'watched';
  rating: number | null;
}

interface MovieReview {
  id: string;
  user_id: string;
  movie_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  reviewer_name: string;
  reviewer_avatar: string | null;
  reviewer_id: string;
  reviewer_handle: string | null;
}

function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-6 h-6' : 'w-4 h-4';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <svg key={star} className={`${cls} ${star <= rating ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function StarInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <svg className={`w-8 h-8 transition-colors ${star <= (hover || value) ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

function formatReleaseDate(dateStr: string): string {
  if (dateStr === '2029-12-31') return 'TBD';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatReviewDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MovieDetailPage() {
  const params = useParams();
  const movieId = params.movieId as string;
  const movie = getMovieById(movieId);
  const studio = movie ? studioMap.get(movie.studio) : undefined;

  const { user, session } = useAuth();
  const [checklist, setChecklist] = useState<ChecklistEntry | null>(null);
  const [reviews, setReviews] = useState<MovieReview[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState(0);
  const [myReview, setMyReview] = useState<MovieReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Review form state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fetch community reviews (skip for upcoming movies)
  const fetchReviews = useCallback(async () => {
    if (!movie || isUpcoming(movie)) return;
    try {
      const res = await fetch(`/api/movie-reviews?movieId=${movie.id}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews ?? []);
        setAverageRating(data.averageRating);
        setTotalReviews(data.totalReviews ?? 0);
        // Find current user's review
        if (user) {
          const mine = (data.reviews ?? []).find((r: MovieReview) => r.reviewer_id === user.id);
          if (mine) {
            setMyReview(mine);
            setReviewRating(mine.rating);
            setReviewText(mine.review_text ?? '');
          }
        }
      }
    } catch { /* ignore */ }
  }, [movie, user]);

  // Fetch user's checklist entry
  const fetchChecklist = useCallback(async () => {
    if (!session?.access_token || !movie) return;
    try {
      const res = await fetch('/api/movie-checklist', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const entry = (data.items ?? []).find((item: ChecklistEntry) => item.movie_id === movie.id);
        setChecklist(entry ?? null);
      }
    } catch { /* ignore */ }
  }, [session?.access_token, movie]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchReviews(), user ? fetchChecklist() : Promise.resolve()])
      .finally(() => setLoading(false));
  }, [fetchReviews, fetchChecklist, user]);

  // Status toggle
  const handleStatusClick = useCallback(async (targetStatus: 'want_to_watch' | 'watched') => {
    if (!session?.access_token || !movie) return;
    setSaving(true);
    try {
      if (checklist?.status === targetStatus) {
        // Remove
        const res = await fetch(`/api/movie-checklist?id=${checklist.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) setChecklist(null);
      } else {
        // Upsert
        const res = await fetch('/api/movie-checklist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ movie_id: movie.id, status: targetStatus }),
        });
        if (res.ok) {
          const data = await res.json();
          setChecklist(data.item);
        }
      }
    } catch { /* ignore */ } finally { setSaving(false); }
  }, [session?.access_token, movie, checklist]);

  // Set personal rating
  const handleRatingClick = useCallback(async (rating: number) => {
    if (!session?.access_token || !movie) return;
    setSaving(true);
    try {
      if (checklist) {
        const res = await fetch('/api/movie-checklist', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ id: checklist.id, rating }),
        });
        if (res.ok) {
          const data = await res.json();
          setChecklist(data.item);
        }
      } else {
        const res = await fetch('/api/movie-checklist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ movie_id: movie.id, status: 'watched', rating }),
        });
        if (res.ok) {
          const data = await res.json();
          setChecklist(data.item);
        }
      }
    } catch { /* ignore */ } finally { setSaving(false); }
  }, [session?.access_token, movie, checklist]);

  // Submit/update review
  const handleSubmitReview = useCallback(async () => {
    if (!session?.access_token || !movie || reviewRating === 0) return;
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/movie-reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          movie_id: movie.id,
          rating: reviewRating,
          review_text: reviewText.trim() || null,
        }),
      });
      if (res.ok) {
        setShowReviewForm(false);
        await fetchReviews();
      }
    } catch { /* ignore */ } finally { setSubmittingReview(false); }
  }, [session?.access_token, movie, reviewRating, reviewText, fetchReviews]);

  // Delete review
  const handleDeleteReview = useCallback(async () => {
    if (!session?.access_token || !myReview) return;
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/movie-reviews?id=${myReview.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        setMyReview(null);
        setReviewRating(0);
        setReviewText('');
        setShowReviewForm(false);
        await fetchReviews();
      }
    } catch { /* ignore */ } finally { setSubmittingReview(false); }
  }, [session?.access_token, myReview, fetchReviews]);

  if (!movie || !studio) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <p className="text-slate-500 dark:text-slate-400 mb-4">Movie not found.</p>
        <Link href="/Secret-menU/movies" className="text-sm font-medium text-disney-blue dark:text-disney-gold hover:underline">
          Back to Movie Checklist
        </Link>
      </div>
    );
  }

  const upcoming = isUpcoming(movie);
  const posterUrl = getPosterUrl(movie);
  const otherReviews = reviews.filter(r => r.reviewer_id !== user?.id);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        href="/Secret-menU/movies"
        className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Movie Checklist
      </Link>

      {/* Movie Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 mb-4">
        <div className="flex gap-4 items-start">
          {posterUrl ? (
            <div className="w-24 h-36 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-700">
              <Image
                src={posterUrl}
                alt={movie.title}
                width={96}
                height={144}
                className="w-full h-full object-cover"
                priority
              />
            </div>
          ) : (
            <div className="w-24 h-36 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-4xl flex-shrink-0">
              {movie.posterEmoji}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {movie.title}
              <span className="text-slate-400 dark:text-slate-500 font-normal ml-2 text-base">({movie.year})</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 italic">{movie.tagline}</p>
            {movie.description && (
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{movie.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {studio.emoji} {studio.label}
              </span>
              {upcoming ? (
                <span className="text-xs font-medium text-disney-blue dark:text-disney-gold">
                  {formatReleaseDate(movie.releaseDate)}
                </span>
              ) : (
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Released {formatReleaseDate(movie.releaseDate)}
                </span>
              )}
            </div>
            {/* Community rating summary */}
            {averageRating != null && totalReviews > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <StarDisplay rating={Math.round(averageRating)} />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{averageRating}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">({totalReviews} review{totalReviews !== 1 ? 's' : ''})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews & status — hidden for upcoming movies */}
      {!upcoming && (
        <>
          {/* Your Status (auth only) */}
          {user && !loading && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 mb-4">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Your Status</h2>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => handleStatusClick('want_to_watch')}
                  disabled={saving}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    checklist?.status === 'want_to_watch'
                      ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-900/20 dark:hover:text-violet-300'
                  }`}
                >
                  Want to Watch
                </button>
                <button
                  onClick={() => handleStatusClick('watched')}
                  disabled={saving}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    checklist?.status === 'watched'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-300'
                  }`}
                >
                  Watched
                </button>

                {/* Personal star rating (when watched) */}
                {checklist?.status === 'watched' && (
                  <div className="flex items-center gap-0.5 ml-auto">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => handleRatingClick(star)}
                        disabled={saving}
                        className="text-lg leading-none transition-colors"
                        aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                      >
                        <span className={
                          (checklist.rating ?? 0) >= star
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
            </div>
          )}

          {/* Your Review (auth only) */}
          {user && !loading && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Your Review</h2>
                {myReview && !showReviewForm && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="text-xs font-medium text-disney-blue dark:text-disney-gold hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>

              {!myReview && !showReviewForm && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-disney-blue dark:hover:text-disney-gold transition-colors"
                >
                  Write a review...
                </button>
              )}

              {myReview && !showReviewForm && (
                <div>
                  <StarDisplay rating={myReview.rating} />
                  {myReview.review_text && (
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">{myReview.review_text}</p>
                  )}
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{formatReviewDate(myReview.created_at)}</p>
                </div>
              )}

              {showReviewForm && (
                <div className="space-y-4">
                  <StarInput value={reviewRating} onChange={setReviewRating} label="Rating" />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Review (optional)</label>
                    <textarea
                      value={reviewText}
                      onChange={e => setReviewText(e.target.value)}
                      placeholder="What did you think of this movie?"
                      maxLength={1000}
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-right">{reviewText.length}/1000</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSubmitReview}
                      disabled={submittingReview || reviewRating === 0}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-disney-navy text-white dark:bg-disney-gold dark:text-disney-navy hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {submittingReview ? 'Saving...' : myReview ? 'Update Review' : 'Submit Review'}
                    </button>
                    <button
                      onClick={() => {
                        setShowReviewForm(false);
                        if (myReview) {
                          setReviewRating(myReview.rating);
                          setReviewText(myReview.review_text ?? '');
                        }
                      }}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                    {myReview && (
                      <button
                        onClick={handleDeleteReview}
                        disabled={submittingReview}
                        className="ml-auto text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Community Reviews */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 mb-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Community Reviews
              {totalReviews > 0 && (
                <span className="text-slate-400 dark:text-slate-500 font-normal ml-1.5">({totalReviews})</span>
              )}
            </h2>

            {loading && (
              <p className="text-sm text-slate-400 dark:text-slate-500">Loading reviews...</p>
            )}

            {!loading && otherReviews.length === 0 && !myReview && (
              <p className="text-sm text-slate-400 dark:text-slate-500">No reviews yet. Be the first!</p>
            )}

            {!loading && otherReviews.length === 0 && myReview && (
              <p className="text-sm text-slate-400 dark:text-slate-500">No other reviews yet.</p>
            )}

            {!loading && otherReviews.length > 0 && (
              <div className="space-y-4">
                {otherReviews.map(review => (
                  <div key={review.id} className="border-t border-slate-100 dark:border-slate-700 pt-3 first:border-0 first:pt-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      {review.reviewer_avatar ? (
                        <img src={review.reviewer_avatar} alt="" className="w-6 h-6 rounded-full" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                          {review.reviewer_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{review.reviewer_name}</span>
                      {review.reviewer_handle && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">@{review.reviewer_handle}</span>
                      )}
                      <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">{formatReviewDate(review.created_at)}</span>
                    </div>
                    <StarDisplay rating={review.rating} />
                    {review.review_text && (
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-1.5">{review.review_text}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sign in prompt */}
          {!user && !loading && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Sign in to track your watchlist and write reviews.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
