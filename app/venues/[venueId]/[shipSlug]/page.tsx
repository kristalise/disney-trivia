'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getVenueById, getSubVenues, getCategories, shipToSlug, slugToShip, getActivitiesByVenueId, getDiningByVenueId, getActivityTypes, getDiningTypes } from '@/lib/unified-data';
import { useAuth } from '@/components/AuthProvider';
import SailingPicker from '@/components/SailingPicker';
import SocialIcons from '@/components/SocialIcons';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { submitOrQueueReview } from '@/lib/offline-store';

const SHORT_SHIP_NAMES: Record<string, string> = {
  'Disney Magic': 'Magic',
  'Disney Wonder': 'Wonder',
  'Disney Dream': 'Dream',
  'Disney Fantasy': 'Fantasy',
  'Disney Wish': 'Wish',
  'Disney Treasure': 'Treasure',
  'Disney Destiny': 'Destiny',
  'Disney Adventure': 'Adventure',
};

const VISITED_WITH_OPTIONS = ['Solo', 'Partner', 'Family', 'Friends', 'Kids'];

interface Review {
  id: string;
  ship_name: string;
  venue_id: string;
  rating: number;
  atmosphere_rating: number | null;
  theming_rating: number | null;
  visited_with: string[] | null;
  review_text: string | null;
  photo_url: string | null;
  created_at: string;
  reviewer_name?: string;
  reviewer_avatar?: string | null;
  reviewer_id?: string;
  reviewer_handle?: string | null;
  sailing_id?: string | null;
  sailing_ship?: string | null;
  sailing_start?: string | null;
  sailing_itinerary?: string | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
  youtube_url?: string | null;
  facebook_url?: string | null;
  xiaohongshu_url?: string | null;
}

interface ReviewGroup {
  reviewer_id: string | undefined;
  reviewer_name: string;
  reviewer_avatar: string | null | undefined;
  reviewer_handle: string | null | undefined;
  reviews: Review[];
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

export default function VenueShipPage() {
  const params = useParams();
  const venueId = params.venueId as string;
  const shipSlug = params.shipSlug as string;

  const venue = getVenueById(venueId);
  const ship = slugToShip(shipSlug);
  const categories = getCategories();
  const instance = venue && ship ? venue.shipInstances.find(si => si.ship === ship) : undefined;
  const subVenues = venue ? getSubVenues(venueId) : [];
  const venueActivities = venue && ship ? getActivitiesByVenueId(venueId, ship) : [];
  const venueDining = venue && ship ? getDiningByVenueId(venueId, ship) : [];
  const activityTypes = getActivityTypes();
  const diningTypes = getDiningTypes();

  const { user, session } = useAuth();
  const isOnline = useOnlineStatus();

  // Review state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [averageAtmosphere, setAverageAtmosphere] = useState<number | null>(null);
  const [averageTheming, setAverageTheming] = useState<number | null>(null);
  const [visitedWithCounts, setVisitedWithCounts] = useState<Record<string, number>>({});
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Form state
  const [formRating, setFormRating] = useState(0);
  const [formAtmosphere, setFormAtmosphere] = useState(0);
  const [formTheming, setFormTheming] = useState(0);
  const [formVisitedWith, setFormVisitedWith] = useState<string[]>([]);
  const [formReviewText, setFormReviewText] = useState('');
  const [formInstagramUrl, setFormInstagramUrl] = useState('');
  const [formTiktokUrl, setFormTiktokUrl] = useState('');
  const [formYoutubeUrl, setFormYoutubeUrl] = useState('');
  const [formFacebookUrl, setFormFacebookUrl] = useState('');
  const [formXiaohongshuUrl, setFormXiaohongshuUrl] = useState('');
  const [socialOpen, setSocialOpen] = useState(false);
  const [eligibleSailings, setEligibleSailings] = useState<{ id: string; ship_name: string; sail_start_date: string; itinerary_name: string | null; already_reviewed: boolean }[]>([]);
  const [selectedReviewSailing, setSelectedReviewSailing] = useState<string>('');
  const [eligibleLoading, setEligibleLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Planner state
  const [linkedSailingId, setLinkedSailingId] = useState<string | null>(null);
  const [plannerItems, setPlannerItems] = useState<Set<string>>(new Set());
  const [plannerAdding, setPlannerAdding] = useState(false);

  const groupedReviews = useMemo((): ReviewGroup[] => {
    const groups: ReviewGroup[] = [];
    const seen = new Map<string, number>();
    for (const r of reviews) {
      const key = r.reviewer_id || `anon-${r.id}`;
      if (r.reviewer_id && seen.has(key)) {
        groups[seen.get(key)!].reviews.push(r);
      } else {
        seen.set(key, groups.length);
        groups.push({
          reviewer_id: r.reviewer_id,
          reviewer_name: r.reviewer_name || 'Anonymous',
          reviewer_avatar: r.reviewer_avatar,
          reviewer_handle: r.reviewer_handle,
          reviews: [r],
        });
      }
    }
    return groups;
  }, [reviews]);

  const fetchReviews = useCallback(async () => {
    if (!venue || !ship) return;
    setReviewsLoading(true);
    try {
      const params = new URLSearchParams({ venue: venue.id, ship });
      const res = await fetch(`/api/venue-reviews?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
        setAverageRating(data.averageRating);
        setAverageAtmosphere(data.averageAtmosphere);
        setAverageTheming(data.averageTheming);
        setVisitedWithCounts(data.visitedWithCounts);
        setTotalReviews(data.totalReviews);
      }
    } catch { /* supplemental */ } finally { setReviewsLoading(false); }
  }, [venue, ship]);

  const fetchEligibleSailings = useCallback(async () => {
    if (!user || !session?.access_token || !venue) { setEligibleSailings([]); return; }
    setEligibleLoading(true);
    try {
      const res = await fetch(`/api/venue-reviews/eligible-sailings?venue_id=${encodeURIComponent(venue.id)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEligibleSailings(data.sailings ?? []);
      }
    } catch { /* ignore */ } finally { setEligibleLoading(false); }
  }, [user, session, venue]);

  useEffect(() => {
    fetchReviews();
    fetchEligibleSailings();
  }, [fetchReviews, fetchEligibleSailings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess(false);
    if (!formRating) { setSubmitError('Please select a rating.'); return; }
    const sailingId = selectedReviewSailing || linkedSailingId || undefined;
    if (!ship) { setSubmitError('Invalid ship.'); return; }

    setSubmitting(true);
    try {
      const reviewBody = {
        ship_name: ship,
        venue_id: venue!.id,
        rating: formRating,
        atmosphere_rating: formAtmosphere || undefined,
        theming_rating: formTheming || undefined,
        visited_with: formVisitedWith.length > 0 ? formVisitedWith : undefined,
        review_text: formReviewText || undefined,
        sailing_id: sailingId,
        instagram_url: formInstagramUrl || undefined,
        tiktok_url: formTiktokUrl || undefined,
        youtube_url: formYoutubeUrl || undefined,
        facebook_url: formFacebookUrl || undefined,
        xiaohongshu_url: formXiaohongshuUrl || undefined,
      };
      const reviewHeaders = {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      };
      const result = await submitOrQueueReview('/api/venue-reviews', reviewBody, reviewHeaders, isOnline);
      if (result.error) { setSubmitError(result.error); return; }
      if (result.queued) {
        setSubmitSuccess(true);
        setSubmitError('');
        setFormRating(0); setFormAtmosphere(0); setFormTheming(0); setFormVisitedWith([]); setFormReviewText('');
        setFormInstagramUrl(''); setFormTiktokUrl(''); setFormYoutubeUrl(''); setFormFacebookUrl(''); setFormXiaohongshuUrl('');
        setSelectedReviewSailing('');
      } else {
        setSubmitSuccess(true);
        setFormRating(0); setFormAtmosphere(0); setFormTheming(0); setFormVisitedWith([]); setFormReviewText('');
        setFormInstagramUrl(''); setFormTiktokUrl(''); setFormYoutubeUrl(''); setFormFacebookUrl(''); setFormXiaohongshuUrl('');
        setSelectedReviewSailing('');
        fetchReviews();
        fetchEligibleSailings();
      }
    } catch { setSubmitError('Failed to submit.'); } finally { setSubmitting(false); }
  };

  const positionLabels: Record<string, string> = { fwd: 'Forward', mid: 'Midship', aft: 'Aft' };

  if (!venue || !ship || !instance) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link href="/Secret-menU/venues" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Venues
        </Link>
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🔍</div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Venue Not Found</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">We couldn&apos;t find this venue on this ship.</p>
        </div>
      </div>
    );
  }

  const otherInstances = venue.shipInstances.filter(si => si.ship !== ship);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm mb-4 flex-wrap">
        <Link href="/Secret-menU/venues" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Venues
        </Link>
        {venue.shipInstances.length > 1 && (
          <>
            <span className="text-slate-400 dark:text-slate-500">/</span>
            <Link href={`/venues/${venue.id}`} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
              {venue.name}
            </Link>
          </>
        )}
      </div>

      {/* Venue Detail Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{categories[venue.category]?.emoji}</span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{instance.name}</h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
          {categories[venue.category]?.label} — {ship}
        </p>
        {venue.ip && (
          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 mb-2">
            {venue.ip}
          </span>
        )}
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{instance.description}</p>

        {/* Location info */}
        <div className="flex flex-wrap gap-3 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">Deck{instance.decks.length > 1 ? 's' : ''}:</span>
            <span className="text-xs font-medium text-slate-900 dark:text-white">{instance.decks.join(', ')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">Position:</span>
            <span className="text-xs font-medium text-slate-900 dark:text-white">
              {instance.position.map(p => positionLabels[p] || p).join(', ')}
            </span>
          </div>
        </div>

        {!instance.current && (
          <div className="px-3 py-2 rounded-xl text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 mb-3">
            This venue is no longer available on this ship.
          </div>
        )}

        {/* Parent venue link */}
        {venue.parentId && (() => {
          const parent = getVenueById(venue.parentId);
          if (!parent) return null;
          return (
            <div className="mt-1 mb-3">
              <span className="text-xs text-slate-500 dark:text-slate-400">Part of </span>
              <Link href={`/venues/${parent.id}/${shipSlug}`} className="text-xs font-medium text-disney-blue dark:text-disney-gold hover:underline">
                {parent.name}
              </Link>
            </div>
          );
        })()}

        {/* Planner button */}
        {user && linkedSailingId && (
          <div className="mt-3">
            {plannerItems.has(venue.id) ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                In Planner
              </span>
            ) : (
              <button
                type="button"
                disabled={plannerAdding}
                onClick={async () => {
                  setPlannerAdding(true);
                  try {
                    const res = await fetch('/api/planner-items', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
                      },
                      body: JSON.stringify({ sailing_id: linkedSailingId, item_type: 'venue', item_id: venue.id }),
                    });
                    if (res.ok) {
                      setPlannerItems(prev => new Set(prev).add(venue.id));
                    }
                  } catch { /* ignore */ } finally { setPlannerAdding(false); }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-disney-blue/10 text-disney-blue dark:bg-disney-gold/10 dark:text-disney-gold hover:bg-disney-blue/20 dark:hover:bg-disney-gold/20 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                {plannerAdding ? 'Adding...' : 'Add to Planner'}
              </button>
            )}
          </div>
        )}

        {/* Average Ratings */}
        {averageRating && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <StarDisplay rating={Math.round(averageRating)} />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{averageRating}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})</span>
            </div>
            {averageAtmosphere && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <span>Atmosphere:</span>
                <StarDisplay rating={Math.round(averageAtmosphere)} />
                <span>{averageAtmosphere}</span>
              </div>
            )}
            {averageTheming && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <span>Theming:</span>
                <StarDisplay rating={Math.round(averageTheming)} />
                <span>{averageTheming}</span>
              </div>
            )}
          </div>
        )}

        {/* Visited With Counts */}
        {Object.keys(visitedWithCounts).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(visitedWithCounts).sort((a, b) => b[1] - a[1]).map(([tag, count]) => (
              <span key={tag} className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                {tag} ({count})
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Sub-venues on this ship */}
      {subVenues.filter(sv => sv.shipInstances.some(si => si.ship === ship)).length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Includes</h2>
          <div className="space-y-2">
            {subVenues.filter(sv => sv.shipInstances.some(si => si.ship === ship)).map(sv => (
              <Link
                key={sv.id}
                href={`/venues/${sv.id}/${shipSlug}`}
                className="block bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-disney-blue dark:hover:border-disney-gold transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm text-slate-900 dark:text-white">{categories[sv.category]?.emoji} {sv.name}</span>
                    {sv.ip && (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                        {sv.ip}
                      </span>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Activities & Experiences at this venue */}
      {venueActivities.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Activities & Experiences</h2>
          <div className="space-y-2">
            {venueActivities.map(activity => (
              <Link
                key={activity.id}
                href={`/Secret-menU/activity?activity=${activity.id}&ship=${encodeURIComponent(ship!)}`}
                className="block bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-disney-blue dark:hover:border-disney-gold transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm text-slate-900 dark:text-white">{activityTypes[activity.type]?.emoji} {activity.name}</span>
                    <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">{activityTypes[activity.type]?.label}</span>
                  </div>
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Dining at this venue */}
      {venueDining.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Dining</h2>
          <div className="space-y-2">
            {venueDining.map(dining => (
              <Link
                key={dining.id}
                href={`/Secret-menU/dining`}
                className="block bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-disney-blue dark:hover:border-disney-gold transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm text-slate-900 dark:text-white">{diningTypes[dining.type]?.emoji} {dining.name}</span>
                    <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">{diningTypes[dining.type]?.label}</span>
                  </div>
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Other ships */}
      {otherInstances.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Also on</h2>
          <div className="flex flex-wrap gap-2">
            {otherInstances.map(si => (
              <Link
                key={si.ship}
                href={`/venues/${venue.id}/${shipToSlug(si.ship)}`}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-disney-blue/10 hover:text-disney-blue dark:hover:bg-disney-gold/10 dark:hover:text-disney-gold transition-colors"
              >
                {SHORT_SHIP_NAMES[si.ship] || si.ship}
                {si.name !== instance.name && ` (${si.name})`}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Sailing Picker for planner context */}
      {user && (
        <div className="mb-6">
          <SailingPicker
            onSelect={async (sailing) => {
              if (sailing) {
                setLinkedSailingId(sailing.id);
                try {
                  const res = await fetch(`/api/planner-items?sailing_id=${sailing.id}`, {
                    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
                  });
                  if (res.ok) {
                    const data = await res.json();
                    const venueIds = new Set<string>(
                      (data.items ?? []).filter((i: { item_type: string }) => i.item_type === 'venue').map((i: { item_id: string }) => i.item_id)
                    );
                    setPlannerItems(venueIds);
                  }
                } catch { /* ignore */ }
              } else {
                setLinkedSailingId(null);
                setPlannerItems(new Set());
              }
            }}
            selectedSailingId={linkedSailingId}
          />
        </div>
      )}

      {/* Reviews */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Reviews</h3>
        {reviewsLoading ? (
          <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">Loading reviews...</div>
        ) : groupedReviews.length > 0 ? (
          <div className="space-y-4">
            {groupedReviews.map((group) => (
              <div key={group.reviewer_id || group.reviews[0].id} className="pb-4 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0">
                {group.reviewer_id && (
                  <Link href={`/profile/${group.reviewer_handle || group.reviewer_id}`} className="flex items-center gap-2 hover:underline mb-2">
                    {group.reviewer_avatar ? (
                      <img src={group.reviewer_avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-disney-gold flex items-center justify-center text-xs font-bold text-disney-blue">
                        {group.reviewer_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{group.reviewer_name}</span>
                  </Link>
                )}
                {group.reviews.length === 1 ? (
                  (() => { const review = group.reviews[0]; return (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <StarDisplay rating={review.rating} />
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {review.sailing_start
                            ? `${review.sailing_ship?.replace('Disney ', '') || ''} ${new Date(review.sailing_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                            : new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      {review.atmosphere_rating && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                          <span>Atmosphere: {'★'.repeat(review.atmosphere_rating)}{'☆'.repeat(5 - review.atmosphere_rating)}</span>
                        </div>
                      )}
                      {review.theming_rating && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                          <span>Theming: {'★'.repeat(review.theming_rating)}{'☆'.repeat(5 - review.theming_rating)}</span>
                        </div>
                      )}
                      {review.visited_with && review.visited_with.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {review.visited_with.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">{tag}</span>
                          ))}
                        </div>
                      )}
                      {review.review_text && <p className="text-sm text-slate-700 dark:text-slate-300">{review.review_text}</p>}
                      <SocialIcons instagramUrl={review.instagram_url} tiktokUrl={review.tiktok_url} youtubeUrl={review.youtube_url} facebookUrl={review.facebook_url} xiaohongshuUrl={review.xiaohongshu_url} size="sm" />
                    </div>
                  ); })()
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {group.reviews.map((review) => (
                      <div key={review.id} className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <StarDisplay rating={review.rating} />
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                            {review.sailing_start
                              ? `${review.sailing_ship?.replace('Disney ', '') || ''} ${new Date(review.sailing_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                              : new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        {review.atmosphere_rating && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Atmosphere: {'★'.repeat(review.atmosphere_rating)}{'☆'.repeat(5 - review.atmosphere_rating)}</div>
                        )}
                        {review.theming_rating && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Theming: {'★'.repeat(review.theming_rating)}{'☆'.repeat(5 - review.theming_rating)}</div>
                        )}
                        {review.review_text && <p className="text-sm text-slate-700 dark:text-slate-300">{review.review_text}</p>}
                        <SocialIcons instagramUrl={review.instagram_url} tiktokUrl={review.tiktok_url} youtubeUrl={review.youtube_url} facebookUrl={review.facebook_url} xiaohongshuUrl={review.xiaohongshu_url} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
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
        ) : eligibleLoading ? (
          <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">Checking your sailings...</div>
        ) : eligibleSailings.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">🚢</div>
            <p className="text-sm text-slate-500 dark:text-slate-400">You need a sailing on {ship} to leave a review.</p>
          </div>
        ) : eligibleSailings.every(s => s.already_reviewed) ? (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">You&apos;ve reviewed this venue for all your sailings</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Review for which sailing?</label>
              <select
                value={selectedReviewSailing}
                onChange={(e) => setSelectedReviewSailing(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
              >
                <option value="">Select a sailing...</option>
                {eligibleSailings.filter(s => !s.already_reviewed).map(s => (
                  <option key={s.id} value={s.id}>
                    {s.ship_name} — {new Date(s.sail_start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}{s.itinerary_name ? ` (${s.itinerary_name})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <StarInput value={formRating} onChange={setFormRating} label="Overall Rating" />
              <StarInput value={formAtmosphere} onChange={setFormAtmosphere} label="Atmosphere (optional)" />
              <StarInput value={formTheming} onChange={setFormTheming} label="Theming (optional)" />

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Visited With (optional)</label>
                <div className="flex flex-wrap gap-2">
                  {VISITED_WITH_OPTIONS.map((opt) => {
                    const selected = formVisitedWith.includes(opt);
                    return (
                      <button key={opt} type="button"
                        onClick={() => setFormVisitedWith((prev) => selected ? prev.filter(x => x !== opt) : [...prev, opt])}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          selected
                            ? 'bg-disney-blue text-white border-disney-blue dark:bg-disney-gold dark:text-slate-900 dark:border-disney-gold'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                        }`}>{opt}</button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Review (optional)</label>
                <textarea value={formReviewText} onChange={(e) => setFormReviewText(e.target.value)} maxLength={1000} rows={3} placeholder="How was this venue?"
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
              {submitSuccess && <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-3">{isOnline ? 'Review submitted!' : 'Review saved! It will sync when you\'re back online.'}</div>}

              <button type="submit" disabled={submitting}
                className="w-full px-6 py-3 rounded-xl font-medium btn-disney disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
