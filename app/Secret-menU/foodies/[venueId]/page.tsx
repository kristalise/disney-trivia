'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { getFoodieVenueById, getFoodieCategories, getAdventureRotation, type FoodieVenue, type FoodieCategory } from '@/lib/foodie-data';
import ImageCropUpload from '@/components/ImageCropUpload';
import ShareButton from '@/components/ShareButton';
import SocialIcons from '@/components/SocialIcons';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { submitOrQueueReview } from '@/lib/offline-store';

const categories = getFoodieCategories();
const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]));

const gradientMap: Record<string, string> = {
  blue:   'from-blue-500 to-indigo-600 dark:from-blue-800 dark:to-indigo-900',
  amber:  'from-amber-500 to-orange-600 dark:from-amber-800 dark:to-orange-900',
  violet: 'from-violet-500 to-purple-600 dark:from-violet-800 dark:to-purple-900',
  pink:   'from-pink-500 to-rose-600 dark:from-pink-800 dark:to-rose-900',
  rose:   'from-rose-500 to-pink-600 dark:from-rose-800 dark:to-pink-900',
};

interface Sailing {
  id: string;
  ship_name: string;
  sail_start_date: string;
  sail_end_date: string;
  itinerary_name: string | null;
}

interface ReviewData {
  id: string;
  venue_id: string;
  rating: number;
  review_text: string | null;
  is_anonymous: boolean;
  created_at: string;
  reviewer_name: string;
  reviewer_avatar: string | null;
  reviewer_id: string | null;
  reviewer_handle: string | null;
  sailing_ship: string | null;
  sailing_start: string | null;
  sailing_itinerary: string | null;
  photos: Array<{ id: string; photo_url: string; sort_order: number }>;
  companions: Array<{ companion_user_id: string; display_name: string; avatar_url: string | null }>;
  instagram_url?: string | null;
  tiktok_url?: string | null;
  youtube_url?: string | null;
  facebook_url?: string | null;
  xiaohongshu_url?: string | null;
}

interface Companion {
  companion_id: string;
  display_name?: string;
  avatar_url?: string | null;
}

export default function FoodieVenueDetailPage() {
  const params = useParams();
  const venueId = params.venueId as string;
  const venue = getFoodieVenueById(venueId);
  const cat = venue ? categoryMap[venue.category] : null;

  if (!venue || !cat) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="text-4xl mb-3">🍽️</div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Venue Not Found</h1>
        <Link href="/Secret-menU/foodies" className="text-disney-blue dark:text-disney-gold hover:underline text-sm">
          Back to Foodie Guide
        </Link>
      </div>
    );
  }

  return <VenueDetail venue={venue} cat={cat} />;
}

const PALO_IDS = ['palo', 'palo-steakhouse', 'palo-trattoria'];

function getCastawayLevel(pastCount: number): 'none' | 'silver' | 'gold' | 'platinum' | 'pearl' {
  if (pastCount >= 25) return 'pearl';
  if (pastCount >= 10) return 'platinum';
  if (pastCount >= 5) return 'gold';
  if (pastCount >= 1) return 'silver';
  return 'none';
}

function VenueDetail({ venue, cat }: { venue: FoodieVenue; cat: FoodieCategory }) {
  const { user, session } = useAuth();
  const isOnline = useOnlineStatus();
  const gradient = gradientMap[cat.color] ?? gradientMap.blue;

  // --- Sailing detection ---
  const [sailings, setSailings] = useState<Sailing[]>([]);
  const [sailingsLoading, setSailingsLoading] = useState(false);

  // --- Adventure rotation ---
  const [rotations, setRotations] = useState<Record<string, number | null>>({});
  const isAdventure = venue.ships.includes('Disney Adventure');
  const isRotational = venue.category === 'rotational';

  // --- Reviews ---
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState(0);
  const [shipRatings, setShipRatings] = useState<Record<string, { avg: number; count: number }>>({});
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [shipFilter, setShipFilter] = useState<string>('');

  // --- Review form ---
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [formSailingId, setFormSailingId] = useState('');
  const [formRating, setFormRating] = useState(0);
  const [formText, setFormText] = useState('');
  const [formAnonymous, setFormAnonymous] = useState(false);
  const [formCompanions, setFormCompanions] = useState<Set<string>>(new Set());
  const [formPhotos, setFormPhotos] = useState<string[]>([]);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [socialOpen, setSocialOpen] = useState(false);
  const [formInstagramUrl, setFormInstagramUrl] = useState('');
  const [formTiktokUrl, setFormTiktokUrl] = useState('');
  const [formYoutubeUrl, setFormYoutubeUrl] = useState('');
  const [formFacebookUrl, setFormFacebookUrl] = useState('');
  const [formXiaohongshuUrl, setFormXiaohongshuUrl] = useState('');

  // --- Companions for review form ---
  const [sailingCompanions, setSailingCompanions] = useState<Companion[]>([]);

  // --- Planner ---
  const [addingToPlanner, setAddingToPlanner] = useState<string | null>(null);
  const [plannerAdded, setPlannerAdded] = useState<Set<string>>(new Set());

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  }), [session?.access_token]);

  // Fetch user's sailings
  useEffect(() => {
    if (!user || !session?.access_token) return;
    setSailingsLoading(true);
    fetch('/api/sailing-reviews/mine', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.sailings) setSailings(data.sailings); })
      .catch(() => {})
      .finally(() => setSailingsLoading(false));
  }, [user, session?.access_token]);

  // Fetch adventure rotations for each qualifying sailing
  useEffect(() => {
    if (!user || !session?.access_token || !isAdventure || !isRotational) return;
    const adventureSailings = sailings.filter(s => s.ship_name === 'Disney Adventure');
    for (const s of adventureSailings) {
      fetch(`/api/adventure-rotation?sailing_id=${s.id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          setRotations(prev => ({ ...prev, [s.id]: data?.rotation ?? null }));
        })
        .catch(() => {});
    }
  }, [user, session?.access_token, sailings, isAdventure, isRotational]);

  // Fetch reviews
  const fetchReviews = useCallback((shipParam?: string) => {
    setReviewsLoading(true);
    const params = new URLSearchParams({ venue_id: venue.id });
    if (shipParam) params.set('ship', shipParam);
    fetch(`/api/foodie-reviews?${params}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setReviews(data.reviews ?? []);
          setAverageRating(data.averageRating);
          setTotalReviews(data.totalReviews);
          setShipRatings(data.shipRatings ?? {});
        }
      })
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
  }, [venue.id]);

  useEffect(() => {
    fetchReviews(shipFilter || undefined);
  }, [fetchReviews, shipFilter]);

  // Fetch companions when form sailing changes
  useEffect(() => {
    if (!formSailingId) { setSailingCompanions([]); return; }
    fetch(`/api/sailing-companions?sailing_id=${formSailingId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => setSailingCompanions(data?.companions ?? []))
      .catch(() => {});
  }, [formSailingId]);

  // Castaway level for comp Palo pill
  const isPaloVenue = PALO_IDS.includes(venue.id);
  const castawayLevel = useMemo(() => {
    if (!isPaloVenue) return 'none';
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const pastCount = sailings.filter(s => new Date(s.sail_end_date + 'T23:59:59') < now).length;
    return getCastawayLevel(pastCount);
  }, [sailings, isPaloVenue]);
  const showPaloComp = isPaloVenue && (castawayLevel === 'platinum' || castawayLevel === 'pearl');

  // Sailings that match this venue's ships
  const matchingSailings = useMemo(() => {
    return sailings.filter(s => venue.ships.includes(s.ship_name));
  }, [sailings, venue.ships]);

  // Split matching sailings into upcoming vs past
  const { upcomingSailings, pastSailings } = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return {
      upcomingSailings: matchingSailings.filter(s => new Date(s.sail_end_date) >= today),
      pastSailings: matchingSailings.filter(s => new Date(s.sail_end_date) < today),
    };
  }, [matchingSailings]);

  // Map sailing IDs to user's reviews for that sailing
  const userReviewBySailing = useMemo(() => {
    const map = new Map<string, ReviewData>();
    for (const r of reviews) {
      if (r.reviewer_id !== user?.id) continue;
      const s = sailings.find(s => s.ship_name === r.sailing_ship && s.sail_start_date === r.sailing_start);
      if (s) map.set(s.id, r);
    }
    return map;
  }, [reviews, sailings, user?.id]);

  // Sailings eligible for review (not already reviewed)
  const reviewedSailingIds = useMemo(() => {
    return new Set(Array.from(userReviewBySailing.keys()));
  }, [userReviewBySailing]);

  const eligibleSailings = useMemo(() => {
    return matchingSailings.filter(s => !reviewedSailingIds.has(s.id));
  }, [matchingSailings, reviewedSailingIds]);

  // Past sailings eligible for review (future sailings can't be reviewed)
  const pastEligibleSailings = useMemo(() => {
    return pastSailings.filter(s => !reviewedSailingIds.has(s.id));
  }, [pastSailings, reviewedSailingIds]);

  // Adventure rotation check
  const isVenueInRotation = useCallback((sailingId: string) => {
    const rotation = rotations[sailingId];
    if (rotation == null) return null; // unknown
    const rotationVenueIds = getAdventureRotation(rotation);
    return rotationVenueIds.includes(venue.id);
  }, [rotations, venue.id]);

  // Set adventure rotation
  const handleSetRotation = async (sailingId: string, rotation: number) => {
    try {
      const res = await fetch('/api/adventure-rotation', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ sailing_id: sailingId, rotation }),
      });
      if (res.ok) {
        setRotations(prev => ({ ...prev, [sailingId]: rotation }));
      }
    } catch { /* ignore */ }
  };

  // Add to planner
  const handleAddToPlanner = async (sailingId: string) => {
    setAddingToPlanner(sailingId);
    try {
      const res = await fetch('/api/planner-items', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ sailing_id: sailingId, item_type: 'dining', item_id: venue.id }),
      });
      if (res.ok) {
        setPlannerAdded(prev => new Set(prev).add(sailingId));
      }
    } catch { /* ignore */ }
    setAddingToPlanner(null);
  };

  // Submit review
  const handleSubmitReview = async () => {
    if (!formSailingId || formRating === 0) {
      setFormError('Please select a sailing and rating.');
      return;
    }
    setFormSubmitting(true);
    setFormError('');
    setFormSuccess('');
    try {
      const reviewBody = {
        venue_id: venue.id,
        sailing_id: formSailingId,
        rating: formRating,
        review_text: formText || undefined,
        is_anonymous: formAnonymous,
        companion_ids: Array.from(formCompanions),
        photos: formPhotos.length > 0 ? formPhotos : undefined,
        instagram_url: formInstagramUrl || undefined,
        tiktok_url: formTiktokUrl || undefined,
        youtube_url: formYoutubeUrl || undefined,
        facebook_url: formFacebookUrl || undefined,
        xiaohongshu_url: formXiaohongshuUrl || undefined,
      };
      const result = await submitOrQueueReview('/api/foodie-reviews', reviewBody, headers(), isOnline);
      if (result.error) { setFormError(result.error); return; }
      if (result.queued) {
        setFormSuccess('Review saved! It will sync when you\'re back online.');
        setShowReviewForm(false);
        setFormSailingId('');
        setFormRating(0);
        setFormText('');
        setFormAnonymous(false);
        setFormCompanions(new Set());
        setFormPhotos([]);
        setFormInstagramUrl(''); setFormTiktokUrl(''); setFormYoutubeUrl(''); setFormFacebookUrl(''); setFormXiaohongshuUrl('');
      } else {
        setFormSuccess('Review submitted!');
        setShowReviewForm(false);
        setFormSailingId('');
        setFormRating(0);
        setFormText('');
        setFormAnonymous(false);
        setFormCompanions(new Set());
        setFormPhotos([]);
        setFormInstagramUrl(''); setFormTiktokUrl(''); setFormYoutubeUrl(''); setFormFacebookUrl(''); setFormXiaohongshuUrl('');
        fetchReviews(shipFilter || undefined);
      }
    } catch {
      setFormError('Network error. Please try again.');
    }
    setFormSubmitting(false);
  };

  const renderStars = (rating: number, interactive = false, onSet?: (r: number) => void) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onSet?.(star)}
          className={`text-lg ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
        >
          {star <= rating ? '⭐' : '☆'}
        </button>
      ))}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Hero */}
      <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 mb-6 relative overflow-hidden`}>
        <Link
          href="/Secret-menU/foodies"
          className="text-white/70 hover:text-white flex items-center gap-1 text-sm mb-4 relative z-10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Foodie Guide
        </Link>
        <div className="absolute top-1/2 right-4 -translate-y-1/2 text-[6rem] opacity-20 select-none leading-none">
          {cat.emoji}
        </div>
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-2xl font-bold text-white mb-1">{venue.name}</h1>
            <ShareButton
              title={venue.name}
              text={`Check out ${venue.name} on Disney Cruise Line!`}
              className="text-white/60 hover:text-white dark:text-white/60 dark:hover:text-white flex-shrink-0 mt-1"
            />
          </div>
          <p className="text-white/80 text-sm">{venue.theme}</p>
          {venue.status === 'historical' && (
            <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium bg-white/20 text-white">
              RETIRED — {venue.years}
            </span>
          )}
        </div>
      </div>

      {/* Details section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
          {venue.description}
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {venue.ships.map(ship => (
            <span key={ship} className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
              {ship}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {venue.status === 'current' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
              {venue.years}
            </span>
          )}
          {venue.price && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
              💰 {venue.price}
            </span>
          )}
          {venue.access && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
              🔒 {venue.access}
            </span>
          )}
          {venue.exclusive && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
              Exclusive
            </span>
          )}
          {showPaloComp && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-disney-gold/20 text-disney-gold dark:bg-disney-gold/30 dark:text-disney-gold">
              {castawayLevel === 'pearl' ? '🤍' : '💎'} Comp Dinner ({castawayLevel === 'pearl' ? 'Pearl' : 'Platinum'})
            </span>
          )}
        </div>

        {/* Sub-venues */}
        {venue.subVenues && venue.subVenues.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              Stations
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {venue.subVenues.map(sub => (
                <span key={sub} className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {sub}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Sailings */}
      {user && upcomingSailings.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
          <h2 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wide mb-2">Upcoming Sailings</h2>
          <div className="space-y-1.5">
            {upcomingSailings.map(s => {
              const needsRotation = isAdventure && isRotational && s.ship_name === 'Disney Adventure';
              const rotationStatus = needsRotation ? isVenueInRotation(s.id) : null;
              const currentRotation = rotations[s.id];
              const included = needsRotation ? rotationStatus === true : true;
              const pending = needsRotation && rotationStatus === null;

              return (
                <div key={s.id}>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {s.ship_name} — {new Date(s.sail_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {included && !pending && (
                      plannerAdded.has(s.id) ? (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">Added</span>
                      ) : (
                        <button
                          type="button"
                          disabled={addingToPlanner === s.id}
                          onClick={() => handleAddToPlanner(s.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-disney-blue/10 text-disney-blue dark:bg-disney-gold/10 dark:text-disney-gold hover:bg-disney-blue/20 dark:hover:bg-disney-gold/20 transition-colors disabled:opacity-50"
                        >
                          {addingToPlanner === s.id ? 'Adding...' : 'Add to Planner'}
                        </button>
                      )
                    )}
                  </div>
                  {/* Adventure rotation picker */}
                  {pending && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 mb-1">
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-2">
                        Which dining rotation were you assigned?
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSetRotation(s.id, 1)}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                            currentRotation === 1
                              ? 'bg-disney-blue text-white border-disney-blue dark:bg-disney-gold dark:text-slate-900 dark:border-disney-gold'
                              : 'border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          Rotation 1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetRotation(s.id, 2)}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                            currentRotation === 2
                              ? 'bg-disney-blue text-white border-disney-blue dark:bg-disney-gold dark:text-slate-900 dark:border-disney-gold'
                              : 'border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          Rotation 2
                        </button>
                      </div>
                    </div>
                  )}
                  {needsRotation && rotationStatus === false && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Not in your Rotation {currentRotation} assignment.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Reviews</h2>
            {averageRating !== null && (
              <div className="flex items-center gap-2 mt-1">
                {renderStars(Math.round(averageRating))}
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{averageRating}</span>
                <span className="text-xs text-slate-400">({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})</span>
              </div>
            )}
          </div>
          {!user && (
            <Link
              href="/auth"
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-disney-blue/10 text-disney-blue dark:bg-disney-gold/10 dark:text-disney-gold"
            >
              Sign in to review
            </Link>
          )}
        </div>

        {/* Ship filter tabs (multi-ship venues only) */}
        {venue.ships.length > 1 && Object.keys(shipRatings).length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
            <button
              type="button"
              onClick={() => setShipFilter('')}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                shipFilter === ''
                  ? 'bg-disney-blue text-white dark:bg-disney-gold dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              All Ships
            </button>
            {venue.ships.map(ship => {
              const sr = shipRatings[ship];
              return (
                <button
                  key={ship}
                  type="button"
                  onClick={() => setShipFilter(shipFilter === ship ? '' : ship)}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap ${
                    shipFilter === ship
                      ? 'bg-disney-blue text-white dark:bg-disney-gold dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {ship.replace('Disney ', '')}
                  {sr && ` (${sr.avg}★ · ${sr.count})`}
                </button>
              );
            })}
          </div>
        )}

        {/* Per-sailing review status */}
        {user && pastSailings.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wide">Your Reviews</h3>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                ({pastSailings.filter(s => reviewedSailingIds.has(s.id)).length} of {pastSailings.length} past {pastSailings.length === 1 ? 'sailing' : 'sailings'} reviewed)
              </span>
            </div>
            <div className="space-y-1.5">
              {pastSailings.map(s => {
                const review = userReviewBySailing.get(s.id);
                const dateStr = new Date(s.sail_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                if (review) {
                  return (
                    <div key={s.id} className="flex items-center gap-2 py-1.5">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <span key={star} className="text-xs">{star <= review.rating ? '⭐' : '☆'}</span>
                        ))}
                      </div>
                      <span className="text-sm text-slate-700 dark:text-slate-300 truncate flex-1 min-w-0">
                        {s.ship_name.replace('Disney ', '')} ({dateStr})
                        {review.review_text && (
                          <span className="text-slate-400 dark:text-slate-500"> — {review.review_text.slice(0, 50)}{review.review_text.length > 50 ? '...' : ''}</span>
                        )}
                      </span>
                    </div>
                  );
                }
                return (
                  <div key={s.id} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {s.ship_name.replace('Disney ', '')} ({dateStr})
                    </span>
                    <button
                      type="button"
                      onClick={() => { setFormSailingId(s.id); setShowReviewForm(true); }}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-disney-blue/10 text-disney-blue dark:bg-disney-gold/10 dark:text-disney-gold hover:bg-disney-blue/20 dark:hover:bg-disney-gold/20 transition-colors"
                    >
                      Write Review
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Review form */}
        {showReviewForm && (
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-4 bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Write a Review</h3>
              <button
                type="button"
                onClick={() => { setShowReviewForm(false); setFormSailingId(''); }}
                className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              >
                Cancel
              </button>
            </div>

            {/* Sailing picker */}
            <div className="mb-3">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Sailing</label>
              {pastEligibleSailings.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {pastSailings.length === 0
                    ? 'You have no past sailings on ships with this venue.'
                    : 'You have already reviewed this venue for all your past sailings.'}
                </p>
              ) : (
                <select
                  value={formSailingId}
                  onChange={e => setFormSailingId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                >
                  <option value="">Select a sailing...</option>
                  {pastEligibleSailings.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.ship_name} — {new Date(s.sail_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Star rating */}
            <div className="mb-3">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Rating</label>
              {renderStars(formRating, true, setFormRating)}
            </div>

            {/* Review text */}
            <div className="mb-3">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                Review <span className="font-normal">(optional, max 1000 chars)</span>
              </label>
              <textarea
                value={formText}
                onChange={e => setFormText(e.target.value.slice(0, 1000))}
                rows={3}
                placeholder="Share your experience..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white resize-none"
              />
              <p className="text-[10px] text-slate-400 dark:text-slate-500 text-right">{formText.length}/1000</p>
            </div>

            {/* Photos */}
            {user && formSailingId && (
              <div className="mb-3">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                  Photos <span className="font-normal">(optional, max 10)</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {formPhotos.map((url, i) => (
                    <div key={i} className="relative w-20 h-20">
                      <img src={url} className="w-20 h-20 rounded-lg object-cover" alt={`Photo ${i + 1}`} />
                      <button
                        type="button"
                        onClick={() => setFormPhotos(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-1.5 -right-1.5 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  {formPhotos.length < 10 && (
                    <ImageCropUpload
                      bucket="foodie-photos"
                      path={`${user.id}/${formSailingId}/${venue.id}-${formPhotos.length}`}
                      aspect={4/3}
                      onUpload={(url) => setFormPhotos(prev => [...prev, url])}
                    >
                      <div className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-pointer hover:border-disney-blue dark:hover:border-disney-gold transition-colors text-slate-400 text-2xl">
                        +
                      </div>
                    </ImageCropUpload>
                  )}
                </div>
              </div>
            )}

            {/* Visited-with companions */}
            {sailingCompanions.length > 0 && (
              <div className="mb-3">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Visited With</label>
                <div className="flex flex-wrap gap-2">
                  {sailingCompanions.map(c => {
                    const isSelected = formCompanions.has(c.companion_id);
                    return (
                      <button
                        key={c.companion_id}
                        type="button"
                        onClick={() => {
                          setFormCompanions(prev => {
                            const next = new Set(prev);
                            if (isSelected) next.delete(c.companion_id);
                            else next.add(c.companion_id);
                            return next;
                          });
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-disney-blue text-white dark:bg-disney-gold dark:text-slate-900'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {c.avatar_url ? (
                          <img src={c.avatar_url} className="w-4 h-4 rounded-full object-cover" alt="" />
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-disney-gold text-disney-blue text-[8px] font-bold flex items-center justify-center">
                            {(c.display_name || '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                        {c.display_name || 'Unknown'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Social Media Links */}
            <div className="mb-3">
              <button type="button" onClick={() => setSocialOpen(p => !p)} className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <svg className={`w-3 h-3 transition-transform ${socialOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                Link your social media posts (optional)
              </button>
              {socialOpen && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="#E1306C" strokeWidth="2" /><circle cx="12" cy="12" r="4.5" stroke="#E1306C" strokeWidth="2" /><circle cx="17.5" cy="6.5" r="1.25" fill="#E1306C" /></svg>
                    <input type="url" value={formInstagramUrl} onChange={e => setFormInstagramUrl(e.target.value)} placeholder="https://instagram.com/p/..." className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="#010101"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.72a8.18 8.18 0 004.77 1.52V6.79a4.84 4.84 0 01-1-.1z" /></svg>
                    <input type="url" value={formTiktokUrl} onChange={e => setFormTiktokUrl(e.target.value)} placeholder="https://tiktok.com/@user/video/..." className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                    <input type="url" value={formYoutubeUrl} onChange={e => setFormYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                    <input type="url" value={formFacebookUrl} onChange={e => setFormFacebookUrl(e.target.value)} placeholder="https://facebook.com/..." className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="#FE2C55"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 14.5h-2V9h2v7.5zm1.5-4h2v4h-2v-4zm0-3.5h2V11h-2V9zm3.5 3.5h2v4h-2v-4zm0-3.5h2V11h-2V9zM7 13h2v3.5H7V13z" /></svg>
                    <input type="url" value={formXiaohongshuUrl} onChange={e => setFormXiaohongshuUrl(e.target.value)} placeholder="https://xiaohongshu.com/..." className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm" />
                  </div>
                </div>
              )}
            </div>

            {/* Anonymous toggle */}
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={formAnonymous}
                onChange={e => setFormAnonymous(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-disney-blue dark:text-disney-gold"
              />
              <span className="text-xs text-slate-600 dark:text-slate-400">Post anonymously</span>
            </label>

            {/* Submit */}
            {formError && <p className="text-xs text-red-500 mb-2">{formError}</p>}
            {formSuccess && <p className="text-xs text-green-500 mb-2">{formSuccess}</p>}
            <button
              type="button"
              disabled={formSubmitting || formRating === 0 || !formSailingId}
              onClick={handleSubmitReview}
              className="w-full px-4 py-2.5 rounded-xl font-medium text-sm btn-disney disabled:opacity-50"
            >
              {formSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        )}

        {/* Reviews list */}
        {reviewsLoading ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">📝</div>
            <p className="text-sm text-slate-500 dark:text-slate-400">No reviews yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: ReviewData }) {
  return (
    <div className="border-b border-slate-100 dark:border-slate-700 pb-4 last:border-0 last:pb-0">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        {review.reviewer_avatar ? (
          <img src={review.reviewer_avatar} className="w-7 h-7 rounded-full object-cover" alt="" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-disney-gold flex items-center justify-center text-xs font-bold text-disney-blue">
            {review.reviewer_name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {review.reviewer_handle && !review.is_anonymous ? (
                <Link href={`/profile/${review.reviewer_handle}`} className="hover:underline">
                  {review.reviewer_name}
                </Link>
              ) : (
                review.reviewer_name
              )}
            </span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(s => (
                <span key={s} className="text-xs">{s <= review.rating ? '⭐' : '☆'}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
            <span>{new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            {review.sailing_ship && (
              <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                {review.sailing_ship}
                {review.sailing_start && ` · ${new Date(review.sailing_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Text */}
      {review.review_text && (
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-2 leading-relaxed">
          {review.review_text}
        </p>
      )}

      {/* Photos */}
      {review.photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mb-2 scrollbar-none">
          {review.photos.map(photo => (
            <img
              key={photo.id}
              src={photo.photo_url}
              className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
              alt="Review photo"
            />
          ))}
        </div>
      )}

      {/* Social links */}
      <SocialIcons instagramUrl={review.instagram_url} tiktokUrl={review.tiktok_url} youtubeUrl={review.youtube_url} facebookUrl={review.facebook_url} xiaohongshuUrl={review.xiaohongshu_url} />

      {/* Companions */}
      {review.companions.length > 0 && (
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[10px] text-slate-400 dark:text-slate-500">with</span>
          <div className="flex -space-x-1.5">
            {review.companions.map(c => (
              c.avatar_url ? (
                <img key={c.companion_user_id} src={c.avatar_url} className="w-5 h-5 rounded-full object-cover border border-white dark:border-slate-800" alt={c.display_name} title={c.display_name} />
              ) : (
                <div key={c.companion_user_id} className="w-5 h-5 rounded-full bg-disney-gold flex items-center justify-center text-[8px] font-bold text-disney-blue border border-white dark:border-slate-800" title={c.display_name}>
                  {c.display_name.charAt(0).toUpperCase()}
                </div>
              )
            ))}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">
            {review.companions.map(c => c.display_name).join(', ')}
          </span>
        </div>
      )}
    </div>
  );
}
