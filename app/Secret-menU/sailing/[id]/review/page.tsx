'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import ImageCropUpload from '@/components/ImageCropUpload';
import diningData from '@/data/dining-data.json';
import activityData from '@/data/activity-data.json';
import { getVenueData, getVenueById } from '@/lib/unified-data';
import { lookupStateroomInfo } from '@/lib/stateroom-utils';

const venueData = getVenueData();

/** Convert a slug ID to a readable name (e.g. "senses-spa-and-salon" → "Senses Spa and Salon") */
function idToName(id: string): string {
  return id.split('-').map((w, i) => {
    if (['and', 'of', 'the', 'at', 'in', 'on', 'for'].includes(w) && i > 0) return w;
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ');
}

interface Sailing {
  id: string;
  ship_name: string;
  sail_start_date: string;
  sail_end_date: string;
  itinerary_name: string | null;
  embarkation_port: string;
  disembarkation_port?: string | null;
  ports_of_call: string | null;
  stateroom_numbers: number[] | null;
  num_pax: number | null;
  cost_per_pax: number | null;
  overall_rating: number | null;
  service_rating: number | null;
  entertainment_rating: number | null;
  food_rating: number | null;
  review_text?: string | null;
}

interface ExistingReviews {
  dining: Array<{ id: string; restaurant_id: string; rating: number; review_text: string | null }>;
  stateroom: Array<{ id: string; stateroom_number: number; stateroom_rating: number; review_text: string | null }>;
  activity: Array<{ id: string; activity_id: string; rating: number; review_text: string | null }>;
  venue: Array<{ id: string; venue_id: string; rating: number; review_text: string | null }>;
  planner: Array<{ id: string; item_type: string; item_id: string; checked: boolean; notes: string | null }>;
}

interface Restaurant { id: string; name: string; type: string; description: string; ships: string[] }
interface Activity { id: string; name: string; type: string; description: string; ships: string[] }
interface Venue { id: string; name: string; category: string; description: string; ships: string[] }

const selectCls = "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent";

function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
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

function ReviewedBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
      Reviewed
    </span>
  );
}

export default function SailingReviewHub() {
  const params = useParams();
  const router = useRouter();
  const sailingId = params.id as string;
  const { user, session } = useAuth();

  const [sailing, setSailing] = useState<Sailing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [existingReviews, setExistingReviews] = useState<ExistingReviews>({ dining: [], stateroom: [], activity: [], venue: [], planner: [] });

  // Sailing rating form
  const [ratingOverall, setRatingOverall] = useState(0);
  const [ratingService, setRatingService] = useState(0);
  const [ratingEntertainment, setRatingEntertainment] = useState(0);
  const [ratingFood, setRatingFood] = useState(0);
  const [ratingText, setRatingText] = useState('');
  const [ratingSaving, setRatingSaving] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState('');
  const [ratingError, setRatingError] = useState('');

  // Inline review form state
  const [expandedForm, setExpandedForm] = useState<{ type: string; itemId: string } | null>(null);
  const [formRating, setFormRating] = useState(0);
  const [formRating2, setFormRating2] = useState(0);
  const [formText, setFormText] = useState('');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [formAnonymous, setFormAnonymous] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [formInstagramUrl, setFormInstagramUrl] = useState('');
  const [formTiktokUrl, setFormTiktokUrl] = useState('');
  const [formYoutubeUrl, setFormYoutubeUrl] = useState('');
  const [formFacebookUrl, setFormFacebookUrl] = useState('');
  const [formXiaohongshuUrl, setFormXiaohongshuUrl] = useState('');
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Add More Reviews section
  const [addMoreExpanded, setAddMoreExpanded] = useState(false);

  // Delete sailing
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  }), [session?.access_token]);

  const handleDeleteSailing = async () => {
    if (!session?.access_token) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/sailing-reviews?id=${sailingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        router.push(`/profile/${user?.id}`);
      }
    } catch { /* ignore */ } finally { setDeleteLoading(false); }
  };

  // Fetch sailing details
  const fetchSailing = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch('/api/sailing-reviews/mine', { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (!res.ok) { setError('Failed to load sailing data.'); setLoading(false); return; }
      const data = await res.json();
      const match = (data.sailings ?? []).find((s: Sailing) => s.id === sailingId);
      if (!match) { setError('Sailing not found or does not belong to you.'); setLoading(false); return; }
      setSailing(match);
      // Pre-fill sailing rating form if already rated
      if (match.overall_rating) setRatingOverall(match.overall_rating);
      if (match.service_rating) setRatingService(match.service_rating);
      if (match.entertainment_rating) setRatingEntertainment(match.entertainment_rating);
      if (match.food_rating) setRatingFood(match.food_rating);
      if (match.review_text) setRatingText(match.review_text);
    } catch { setError('Failed to load sailing data.'); } finally { setLoading(false); }
  }, [sailingId, session?.access_token]);

  // Fetch existing reviews for this sailing
  const fetchExistingReviews = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`/api/sailing-reviews/${sailingId}/reviews`, { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (res.ok) {
        const data = await res.json();
        setExistingReviews(data);
      }
    } catch { /* ignore */ }
  }, [sailingId, session?.access_token]);

  useEffect(() => {
    fetchSailing();
    fetchExistingReviews();
  }, [fetchSailing, fetchExistingReviews]);

  // Filter data for this ship
  const shipName = sailing?.ship_name ?? '';
  const rotationalDining = (diningData.restaurants as Restaurant[]).filter(r => r.ships.includes(shipName) && r.type === 'rotational');
  const otherDining = (diningData.restaurants as Restaurant[]).filter(r => r.ships.includes(shipName) && r.type !== 'rotational');
  const activities = (activityData.activities as Activity[]).filter(a => a.ships.includes(shipName));
  const venues = (venueData.venues as Venue[]).filter(v => v.ships.includes(shipName));

  // Build lookup maps
  const diningReviewMap = new Map(existingReviews.dining.map(r => [r.restaurant_id, r]));
  const stateroomReviewMap = new Map(existingReviews.stateroom.map(r => [r.stateroom_number, r]));
  const activityReviewMap = new Map(existingReviews.activity.map(r => [r.activity_id, r]));
  const venueReviewMap = new Map(existingReviews.venue.map(r => [r.venue_id, r]));

  // Planner items set (for "Planned" badges)
  const plannerItemSet = useMemo(() => new Set(
    (existingReviews.planner ?? []).map(i => `${i.item_type}:${i.item_id}`)
  ), [existingReviews.planner]);

  // Checked planner items that haven't been reviewed yet
  const plannerCheckedUnreviewed = useMemo(() => {
    return (existingReviews.planner ?? []).filter(item => {
      if (!item.checked) return false;
      if (item.item_type === 'venue') return !venueReviewMap.has(item.item_id);
      if (item.item_type === 'activity') return !activityReviewMap.has(item.item_id);
      if (item.item_type === 'dining') return !diningReviewMap.has(item.item_id);
      return false;
    });
  }, [existingReviews.planner, venueReviewMap, activityReviewMap, diningReviewMap]);

  // Save sailing rating
  const handleSaveSailingRating = async () => {
    if (!ratingOverall) { setRatingError('Overall rating is required.'); return; }
    setRatingError('');
    setRatingSuccess('');
    setRatingSaving(true);
    try {
      const res = await fetch('/api/sailing-reviews', {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({
          id: sailingId,
          overall_rating: ratingOverall,
          service_rating: ratingService || null,
          entertainment_rating: ratingEntertainment || null,
          food_rating: ratingFood || null,
          review_text: ratingText || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setRatingError(data.error || 'Failed to save.'); return; }
      setRatingSuccess('Saved!');
      // Update local sailing data
      setSailing(prev => prev ? { ...prev, overall_rating: ratingOverall, service_rating: ratingService || null, entertainment_rating: ratingEntertainment || null, food_rating: ratingFood || null, review_text: ratingText || null } : null);
      setTimeout(() => setRatingSuccess(''), 3000);
    } catch { setRatingError('Failed to save.'); } finally { setRatingSaving(false); }
  };

  // Open inline review form
  const openForm = (type: string, itemId: string) => {
    setExpandedForm({ type, itemId });
    setFormRating(0);
    setFormRating2(0);
    setFormText('');
    setFormPhotoUrl('');
    setFormAnonymous(false);
    setSocialOpen(false);
    setFormInstagramUrl('');
    setFormTiktokUrl('');
    setFormYoutubeUrl('');
    setFormFacebookUrl('');
    setFormXiaohongshuUrl('');
    setFormError('');
  };

  // Submit inline review
  const handleSubmitReview = async () => {
    if (!formRating) { setFormError('Rating is required.'); return; }
    if (!expandedForm || !sailing) return;
    setFormError('');
    setFormSaving(true);

    const { type, itemId } = expandedForm;
    const socialFields: Record<string, unknown> = {};
    if (formInstagramUrl) socialFields.instagram_url = formInstagramUrl;
    if (formTiktokUrl) socialFields.tiktok_url = formTiktokUrl;
    if (formYoutubeUrl) socialFields.youtube_url = formYoutubeUrl;
    if (formFacebookUrl) socialFields.facebook_url = formFacebookUrl;
    if (formXiaohongshuUrl) socialFields.xiaohongshu_url = formXiaohongshuUrl;
    const commonFields = {
      ...(formPhotoUrl ? { photo_url: formPhotoUrl } : {}),
      ...socialFields,
      is_anonymous: formAnonymous,
    };

    try {
      let endpoint = '';
      let body: Record<string, unknown> = {};

      if (type === 'stateroom') {
        if (!formRating2) { setFormError('Sailing rating is required.'); setFormSaving(false); return; }
        endpoint = '/api/stateroom-reviews';
        body = {
          sailing_id: sailingId,
          ship_name: sailing.ship_name,
          stateroom_number: Number(itemId),
          stateroom_rating: formRating,
          sailing_rating: formRating2,
          num_passengers: sailing.num_pax || 1,
          boarding_port: sailing.embarkation_port,
          departure_port: sailing.disembarkation_port || sailing.embarkation_port,
          sail_start_date: sailing.sail_start_date,
          sail_end_date: sailing.sail_end_date,
          review_text: formText || null,
          ...commonFields,
        };
      } else if (type === 'dining') {
        endpoint = '/api/dining-reviews';
        body = {
          sailing_id: sailingId,
          ship_name: sailing.ship_name,
          restaurant_id: itemId,
          rating: formRating,
          review_text: formText || null,
          ...commonFields,
        };
      } else if (type === 'activity') {
        endpoint = '/api/activity-reviews';
        body = {
          sailing_id: sailingId,
          ship_name: sailing.ship_name,
          activity_id: itemId,
          rating: formRating,
          review_text: formText || null,
          ...commonFields,
        };
      } else if (type === 'venue') {
        endpoint = '/api/venue-reviews';
        body = {
          sailing_id: sailingId,
          ship_name: sailing.ship_name,
          venue_id: itemId,
          rating: formRating,
          review_text: formText || null,
          ...commonFields,
        };
      }

      const res = await fetch(endpoint, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'Failed to submit.'); return; }
      setExpandedForm(null);
      fetchExistingReviews();
    } catch { setFormError('Failed to submit.'); } finally { setFormSaving(false); }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="text-4xl mb-4 animate-pulse">🚢</div>
        <p className="text-slate-500 dark:text-slate-400">Loading sailing...</p>
      </div>
    );
  }

  if (error || !sailing) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Sailing Not Found</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-4">{error || 'Could not load this sailing.'}</p>
        <Link href="/Secret-menU/sailing" className="inline-block px-6 py-2.5 rounded-xl font-medium btn-disney">Back to Sailings</Link>
      </div>
    );
  }

  const stateroomNumbers = sailing.stateroom_numbers ?? [];

  function InlineForm({ type, itemId, showRating2 }: { type: string; itemId: string; showRating2?: boolean }) {
    const isExpanded = expandedForm?.type === type && expandedForm?.itemId === itemId;
    if (!isExpanded) return null;
    return (
      <div className="mt-3 bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-600 space-y-3">
        <div className={showRating2 ? 'grid grid-cols-2 gap-3' : ''}>
          <StarInput value={formRating} onChange={setFormRating} label={type === 'stateroom' ? 'Stateroom Rating *' : 'Rating *'} />
          {showRating2 && <StarInput value={formRating2} onChange={setFormRating2} label="Sailing Rating *" />}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Review (optional)</label>
          <textarea value={formText} onChange={(e) => setFormText(e.target.value)} maxLength={1000} rows={3}
            placeholder="Share your experience..."
            className={`${selectCls} text-sm resize-none`} />
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-right">{formText.length}/1000</p>
        </div>

        {/* Photo upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Photo (optional)</label>
          {formPhotoUrl ? (
            <div className="relative w-20 h-20">
              <img src={formPhotoUrl} alt="Upload" className="w-20 h-20 rounded-lg object-cover" />
              <button type="button" onClick={() => setFormPhotoUrl('')} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs leading-none">×</button>
            </div>
          ) : (
            <ImageCropUpload
              bucket="foodie-photos"
              path={`${user?.id}/${sailingId}/${type}-${itemId}`}
              aspect={4/3}
              onUpload={(url) => setFormPhotoUrl(url)}
            >
              <div className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-pointer hover:border-disney-blue dark:hover:border-disney-gold transition-colors text-slate-400 text-2xl">
                +
              </div>
            </ImageCropUpload>
          )}
        </div>

        {/* Social Media Links */}
        <div>
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
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formAnonymous}
            onChange={e => setFormAnonymous(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-600 text-disney-blue dark:text-disney-gold"
          />
          <span className="text-xs text-slate-600 dark:text-slate-400">Post anonymously</span>
        </label>

        {formError && <div className="text-xs text-red-600 dark:text-red-400">{formError}</div>}
        <div className="flex gap-2">
          <button type="button" onClick={handleSubmitReview} disabled={formSaving}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-medium btn-disney disabled:opacity-50">
            {formSaving ? 'Saving...' : 'Submit Review'}
          </button>
          <button type="button" onClick={() => setExpandedForm(null)}
            className="px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex-shrink-0">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  function ItemCard({ type, itemId, name, description, reviewed, planned }: { type: string; itemId: string; name: string; description?: string; reviewed: boolean; planned?: boolean }) {
    const isExpanded = expandedForm?.type === type && expandedForm?.itemId === itemId;
    return (
      <div className="pb-4 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{name}</h4>
              {reviewed && <ReviewedBadge />}
              {planned && !reviewed && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-disney-blue/10 text-disney-blue dark:bg-disney-gold/10 dark:text-disney-gold">
                  Planned
                </span>
              )}
            </div>
            {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{description}</p>}
          </div>
          {!isExpanded && (
            <button
              type="button"
              onClick={() => openForm(type, itemId)}
              className="ml-3 flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              {reviewed ? 'Review Again' : 'Review'}
            </button>
          )}
        </div>
        <InlineForm type={type} itemId={itemId} showRating2={type === 'stateroom'} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/profile/${user?.id}`} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          My Profile
        </Link>
      </div>

      {/* Sailing Summary Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{sailing.ship_name}</h1>
        <span className="text-sm text-slate-400 dark:text-slate-500">
          {new Date(sailing.sail_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          {' - '}
          {new Date(sailing.sail_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        {sailing.itinerary_name && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{sailing.itinerary_name}</p>
        )}
        <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
          <span>From {sailing.embarkation_port}</span>
          {sailing.ports_of_call && <span>via {sailing.ports_of_call}</span>}
          {stateroomNumbers.length > 0 && (
            <span>Room{stateroomNumbers.length > 1 ? 's' : ''} {stateroomNumbers.join(', ')}</span>
          )}
          {sailing.num_pax && <span>{sailing.num_pax} pax</span>}
        </div>
      </div>

      {/* Section 1: Rate Your Sailing */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Rate Your Sailing</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StarInput value={ratingOverall} onChange={setRatingOverall} label="Overall *" />
            <StarInput value={ratingService} onChange={setRatingService} label="Service" />
            <StarInput value={ratingEntertainment} onChange={setRatingEntertainment} label="Entertainment" />
            <StarInput value={ratingFood} onChange={setRatingFood} label="Food" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Review (optional)</label>
            <textarea value={ratingText} onChange={(e) => setRatingText(e.target.value)} maxLength={1000} rows={3}
              placeholder="Tell us about your sailing..."
              className={`${selectCls} text-sm resize-none`} />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-right">{ratingText.length}/1000</p>
          </div>
          {ratingError && <div className="text-sm text-red-600 dark:text-red-400">{ratingError}</div>}
          {ratingSuccess && <div className="text-sm text-green-600 dark:text-green-400">{ratingSuccess}</div>}
          <button type="button" onClick={handleSaveSailingRating} disabled={ratingSaving}
            className="px-6 py-2.5 rounded-xl font-medium btn-disney disabled:opacity-50">
            {ratingSaving ? 'Saving...' : sailing.overall_rating ? 'Update Rating' : 'Save Rating'}
          </button>
        </div>
      </div>

      {/* Section 2: Your Stateroom */}
      {stateroomNumbers.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Your Stateroom</h2>
          <div className="space-y-4">
            {stateroomNumbers.map((num) => {
              const info = lookupStateroomInfo(num, shipName);
              const desc = info
                ? [
                    `Deck ${info.deck}`,
                    `${info.typeEmoji} ${info.type}`,
                    info.section,
                    info.bedding ? `🛏 ${info.bedding}` : null,
                  ].filter(Boolean).join(' · ')
                : undefined;
              return (
                <ItemCard
                  key={num}
                  type="stateroom"
                  itemId={String(num)}
                  name={`Stateroom #${num}`}
                  description={desc}
                  reviewed={stateroomReviewMap.has(num)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Section 3: Rotational Dining */}
      {rotationalDining.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Rotational Dining</h2>
          <div className="space-y-4">
            {rotationalDining.map((rest) => (
              <ItemCard
                key={rest.id}
                type="dining"
                itemId={rest.id}
                name={rest.name}
                description={rest.description}
                reviewed={diningReviewMap.has(rest.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Section 3.5: From Your Planner */}
      {plannerCheckedUnreviewed.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-disney-blue/20 dark:border-disney-gold/20 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">From Your Planner</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-disney-blue/10 text-disney-blue dark:bg-disney-gold/10 dark:text-disney-gold">
              {plannerCheckedUnreviewed.length} to review
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Items you checked off — ready to review!</p>
          <div className="space-y-6">
            {/* Planner venues */}
            {(() => {
              const pVenues = plannerCheckedUnreviewed.filter(i => i.item_type === 'venue');
              if (pVenues.length === 0) return null;
              return (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Venues ({pVenues.length})</h3>
                  <div className="space-y-4">
                    {pVenues.map(item => {
                      const ven = venues.find(v => v.id === item.item_id);
                      const unifiedVen = !ven ? getVenueById(item.item_id) : undefined;
                      return (
                        <ItemCard
                          key={item.id}
                          type="venue"
                          itemId={item.item_id}
                          name={ven?.name ?? unifiedVen?.name ?? idToName(item.item_id)}
                          description={ven?.description ?? unifiedVen?.description}
                          reviewed={venueReviewMap.has(item.item_id)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            {/* Planner activities */}
            {(() => {
              const pActivities = plannerCheckedUnreviewed.filter(i => i.item_type === 'activity');
              if (pActivities.length === 0) return null;
              return (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Activities ({pActivities.length})</h3>
                  <div className="space-y-4">
                    {pActivities.map(item => {
                      const act = activities.find(a => a.id === item.item_id);
                      return (
                        <ItemCard
                          key={item.id}
                          type="activity"
                          itemId={item.item_id}
                          name={act?.name ?? idToName(item.item_id)}
                          description={act?.description}
                          reviewed={activityReviewMap.has(item.item_id)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            {/* Planner dining */}
            {(() => {
              const pDining = plannerCheckedUnreviewed.filter(i => i.item_type === 'dining');
              if (pDining.length === 0) return null;
              return (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Dining ({pDining.length})</h3>
                  <div className="space-y-4">
                    {pDining.map(item => {
                      const rest = [...rotationalDining, ...otherDining].find(r => r.id === item.item_id);
                      return (
                        <ItemCard
                          key={item.id}
                          type="dining"
                          itemId={item.item_id}
                          name={rest?.name ?? idToName(item.item_id)}
                          description={rest?.description}
                          reviewed={diningReviewMap.has(item.item_id)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Section 4: Add More Reviews */}
      {(otherDining.length > 0 || activities.length > 0 || venues.length > 0) && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
          <button
            type="button"
            onClick={() => setAddMoreExpanded(!addMoreExpanded)}
            className="w-full flex items-center justify-between"
          >
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add More Reviews</h2>
            <svg className={`w-5 h-5 text-slate-400 transition-transform ${addMoreExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {addMoreExpanded && (
            <div className="mt-6 space-y-6">
              {/* Other Restaurants */}
              {otherDining.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                    Other Restaurants ({otherDining.length})
                  </h3>
                  <div className="space-y-4">
                    {otherDining.map((rest) => (
                      <ItemCard
                        key={rest.id}
                        type="dining"
                        itemId={rest.id}
                        name={rest.name}
                        description={rest.description}
                        reviewed={diningReviewMap.has(rest.id)}
                        planned={plannerItemSet.has(`dining:${rest.id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Activities */}
              {activities.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                    Activities ({activities.length})
                  </h3>
                  <div className="space-y-4">
                    {activities.map((act) => (
                      <ItemCard
                        key={act.id}
                        type="activity"
                        itemId={act.id}
                        name={act.name}
                        description={act.description}
                        reviewed={activityReviewMap.has(act.id)}
                        planned={plannerItemSet.has(`activity:${act.id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Venues */}
              {venues.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                    Venues ({venues.length})
                  </h3>
                  <div className="space-y-4">
                    {venues.map((ven) => (
                      <ItemCard
                        key={ven.id}
                        type="venue"
                        itemId={ven.id}
                        name={ven.name}
                        description={ven.description}
                        reviewed={venueReviewMap.has(ven.id)}
                        planned={plannerItemSet.has(`venue:${ven.id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Delete Sailing — at bottom of page */}
      <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-700">
        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full text-center text-sm text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors py-3"
          >
            Delete this sailing
          </button>
        ) : (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-5 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-400 mb-1 font-medium">Delete this sailing?</p>
            <p className="text-xs text-red-600 dark:text-red-400 mb-3">This is irreversible. All associated reviews, planner items, and companion data will be permanently lost.</p>
            <label className="block text-xs text-red-600 dark:text-red-400 mb-1">
              Type <span className="font-bold">confirm</span> to proceed:
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="confirm"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-red-300 dark:border-red-700 text-slate-900 dark:text-white text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500"
              autoComplete="off"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDeleteSailing}
                disabled={deleteLoading || deleteConfirmText.toLowerCase() !== 'confirm'}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
              </button>
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
