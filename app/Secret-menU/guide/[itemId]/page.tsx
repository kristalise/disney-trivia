'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { getCruiseGuideItem, getCruiseGuideCategories, type CruiseGuideItem } from '@/lib/cruise-guide-data';
import SocialIcons from '@/components/SocialIcons';
import SailingPicker from '@/components/SailingPicker';

const CATEGORY_COLORS: Record<string, string> = {
  orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
  indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
  amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  violet: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
  sky: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400',
  emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  rose: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
  fuchsia: 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-400',
};

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  reviewer_name: string;
  reviewer_avatar: string | null;
  reviewer_id: string;
  reviewer_handle: string | null;
  sailing_ship?: string | null;
  sailing_start?: string | null;
  sailing_itinerary?: string | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
  youtube_url?: string | null;
  facebook_url?: string | null;
  xiaohongshu_url?: string | null;
}

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

function StarInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button" onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)} onClick={() => onChange(star)} className="focus:outline-none">
            <svg className={`w-8 h-8 transition-colors ${star <= (hover || value) ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function GuideItemDetailPage() {
  const params = useParams();
  const itemId = decodeURIComponent(params.itemId as string);
  const item = getCruiseGuideItem(itemId);
  const categories = getCruiseGuideCategories();
  const catMap = useMemo(() => new Map(categories.map(c => [c.key, c])), [categories]);

  const { user, session } = useAuth();

  // Determine which review table/API to use
  // entertainment + activity items -> activity_reviews
  // shopping items -> venue_reviews
  const reviewApiPath = item?.source === 'shopping' ? '/api/venue-reviews' : '/api/activity-reviews';
  const reviewIdField = item?.source === 'shopping' ? 'venue' : 'activity';

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Form state
  const [formRating, setFormRating] = useState(0);
  const [formReviewText, setFormReviewText] = useState('');
  const [formInstagramUrl, setFormInstagramUrl] = useState('');
  const [formTiktokUrl, setFormTiktokUrl] = useState('');
  const [formYoutubeUrl, setFormYoutubeUrl] = useState('');
  const [formFacebookUrl, setFormFacebookUrl] = useState('');
  const [formXiaohongshuUrl, setFormXiaohongshuUrl] = useState('');
  const [socialOpen, setSocialOpen] = useState(false);
  const [selectedShip, setSelectedShip] = useState('');
  const [selectedSailing, setSelectedSailing] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fetchReviews = useCallback(async () => {
    if (!item) return;
    setReviewsLoading(true);
    try {
      const shipParam = selectedShip || item.ships[0];
      const idValue = item.source === 'shopping' ? item.sourceId : item.sourceId;
      const params = new URLSearchParams({ ship: shipParam, [reviewIdField]: idValue });
      const res = await fetch(`${reviewApiPath}?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews ?? []);
        setAverageRating(data.averageRating ?? null);
        setTotalReviews(data.totalReviews ?? 0);
      }
    } catch { /* ignore */ }
    setReviewsLoading(false);
  }, [item, reviewApiPath, reviewIdField, selectedShip]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess(false);
    if (!formRating || !item) { setSubmitError('Please select a rating.'); return; }

    const shipName = selectedShip || item.ships[0];
    if (!shipName) { setSubmitError('Please select a ship.'); return; }

    setSubmitting(true);
    try {
      const bodyObj: Record<string, unknown> = {
        ship_name: shipName,
        rating: formRating,
        review_text: formReviewText || undefined,
        instagram_url: formInstagramUrl || undefined,
        tiktok_url: formTiktokUrl || undefined,
        youtube_url: formYoutubeUrl || undefined,
        facebook_url: formFacebookUrl || undefined,
        xiaohongshu_url: formXiaohongshuUrl || undefined,
      };

      if (selectedSailing) bodyObj.sailing_id = selectedSailing;

      if (item.source === 'shopping') {
        bodyObj.venue_id = item.sourceId;
      } else {
        bodyObj.activity_id = item.sourceId;
      }

      const res = await fetch(reviewApiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(bodyObj),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error || 'Failed to submit'); return; }
      setSubmitSuccess(true);
      setFormRating(0);
      setFormReviewText('');
      setFormInstagramUrl(''); setFormTiktokUrl(''); setFormYoutubeUrl(''); setFormFacebookUrl(''); setFormXiaohongshuUrl('');
      setSelectedSailing('');
      fetchReviews();
    } catch { setSubmitError('Failed to submit.'); }
    setSubmitting(false);
  };

  if (!item) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link href="/Secret-menU/cruise-guide" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Cruise Guide
        </Link>
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🔍</div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Item Not Found</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">We couldn&apos;t find this guide item.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back link */}
      <Link href="/Secret-menU/cruise-guide" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Cruise Guide
      </Link>

      {/* Item Detail Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{item.name}</h1>

        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {item.categories.map(catKey => {
            const cat = catMap.get(catKey);
            if (!cat) return null;
            return (
              <span key={catKey} className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[cat.color] ?? CATEGORY_COLORS.emerald}`}>
                {cat.emoji} {cat.label}
              </span>
            );
          })}
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{item.description}</p>

        {/* Ship pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {item.ships.map(ship => (
            <span key={ship} className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
              {ship}
            </span>
          ))}
        </div>

        {/* Extra info */}
        <div className="flex flex-wrap gap-2">
          {item.ip && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
              {item.ip}
            </span>
          )}
          {item.seasonal && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
              Seasonal: {item.seasonal}
            </span>
          )}
          {item.ageGroup && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
              {item.ageGroup}
            </span>
          )}
          {item.exclusive && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
              Exclusive
            </span>
          )}
          {item.status === 'historical' && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
              Historical
            </span>
          )}
        </div>

        {/* Deck/section info */}
        {item.deckByShip && Object.keys(item.deckByShip).length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Location</h3>
            <div className="space-y-1">
              {Object.entries(item.deckByShip).map(([ship, loc]) => (
                <div key={ship} className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500 dark:text-slate-400 w-24 flex-shrink-0">{ship.replace('Disney ', '')}</span>
                  {loc.deck && <span className="text-slate-700 dark:text-slate-300">Deck {loc.deck}</span>}
                  {loc.section && <span className="text-slate-400 dark:text-slate-500">({loc.section})</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Average Rating */}
        {averageRating && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <StarDisplay rating={Math.round(averageRating)} />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{averageRating}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})</span>
            </div>
          </div>
        )}
      </div>

      {/* Ship filter for reviews */}
      {item.ships.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {item.ships.map(ship => (
            <button
              key={ship}
              type="button"
              onClick={() => setSelectedShip(selectedShip === ship ? '' : ship)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedShip === ship
                  ? 'bg-disney-blue text-white dark:bg-disney-gold dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {ship.replace('Disney ', '')}
            </button>
          ))}
        </div>
      )}

      {/* Reviews */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Reviews</h3>
        {reviewsLoading ? (
          <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">Loading reviews...</div>
        ) : reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review.id} className="pb-4 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0">
                <Link href={`/profile/${review.reviewer_handle || review.reviewer_id}`} className="flex items-center gap-2 hover:underline mb-2">
                  {review.reviewer_avatar ? (
                    <img src={review.reviewer_avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-disney-gold flex items-center justify-center text-xs font-bold text-disney-blue">
                      {review.reviewer_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{review.reviewer_name}</span>
                </Link>
                <div className="flex items-center justify-between mb-2">
                  <StarDisplay rating={review.rating} />
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {review.sailing_start
                      ? `${review.sailing_ship?.replace('Disney ', '') || ''} ${new Date(review.sailing_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                      : new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
                {review.review_text && <p className="text-sm text-slate-700 dark:text-slate-300">{review.review_text}</p>}
                <SocialIcons instagramUrl={review.instagram_url} tiktokUrl={review.tiktok_url} youtubeUrl={review.youtube_url} facebookUrl={review.facebook_url} xiaohongshuUrl={review.xiaohongshu_url} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">💬</div>
            <p className="text-sm text-slate-500 dark:text-slate-400">No reviews yet. Be the first!</p>
          </div>
        )}
      </div>

      {/* Review Form */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Leave a Review</h3>
        {!user ? (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">🔒</div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Sign in to leave a review.</p>
            <Link href="/auth" className="inline-block px-6 py-2.5 rounded-xl font-medium btn-disney">Sign In</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Ship selector */}
            {item.ships.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Ship</label>
                <select
                  value={selectedShip || item.ships[0]}
                  onChange={(e) => setSelectedShip(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
                >
                  {item.ships.map(ship => (
                    <option key={ship} value={ship}>{ship}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Sailing picker */}
            <SailingPicker
              onSelect={(sailing) => setSelectedSailing(sailing?.id ?? '')}
              selectedSailingId={selectedSailing || null}
            />

            <StarInput value={formRating} onChange={setFormRating} label="Rating" />

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Review (optional)</label>
              <textarea value={formReviewText} onChange={(e) => setFormReviewText(e.target.value)} maxLength={1000} rows={3} placeholder="How was this experience?"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent resize-none" />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-right">{formReviewText.length}/1000</p>
            </div>

            {/* Social Media Links */}
            <div>
              <button type="button" onClick={() => setSocialOpen(p => !p)} className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <svg className={`w-4 h-4 transition-transform ${socialOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                Link your social media posts (optional)
              </button>
              {socialOpen && (
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="#E1306C" strokeWidth="2" /><circle cx="12" cy="12" r="4.5" stroke="#E1306C" strokeWidth="2" /><circle cx="17.5" cy="6.5" r="1.25" fill="#E1306C" /></svg>
                    <input type="url" value={formInstagramUrl} onChange={e => setFormInstagramUrl(e.target.value)} placeholder="https://instagram.com/p/..." className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="#010101"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.72a8.18 8.18 0 004.77 1.52V6.79a4.84 4.84 0 01-1-.1z" /></svg>
                    <input type="url" value={formTiktokUrl} onChange={e => setFormTiktokUrl(e.target.value)} placeholder="https://tiktok.com/@user/video/..." className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                    <input type="url" value={formYoutubeUrl} onChange={e => setFormYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                    <input type="url" value={formFacebookUrl} onChange={e => setFormFacebookUrl(e.target.value)} placeholder="https://facebook.com/..." className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="#FE2C55"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 14.5h-2V9h2v7.5zm1.5-4h2v4h-2v-4zm0-3.5h2V11h-2V9zm3.5 3.5h2v4h-2v-4zm0-3.5h2V11h-2V9zM7 13h2v3.5H7V13z" /></svg>
                    <input type="url" value={formXiaohongshuUrl} onChange={e => setFormXiaohongshuUrl(e.target.value)} placeholder="https://xiaohongshu.com/..." className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm" />
                  </div>
                </div>
              )}
            </div>

            {submitError && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">{submitError}</div>}
            {submitSuccess && <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-3">Review submitted!</div>}

            <button type="submit" disabled={submitting}
              className="w-full px-6 py-3 rounded-xl font-medium btn-disney disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
