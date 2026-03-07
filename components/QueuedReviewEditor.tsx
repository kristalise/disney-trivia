'use client';

import { useState } from 'react';
import { QueuedMutation, updateMutation } from '@/lib/offline-store';
import { getReviewType } from '@/lib/review-utils';

function StarInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <svg
              className={`w-7 h-7 transition-colors ${
                star <= (hover || value) ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

interface Props {
  mutation: QueuedMutation;
  onSave: (updated: QueuedMutation) => void;
  onCancel: () => void;
}

export default function QueuedReviewEditor({ mutation, onSave, onCancel }: Props) {
  const body = mutation.body as Record<string, unknown>;
  const type = getReviewType(mutation.url);

  // Common editable fields
  const [rating, setRating] = useState((body.rating as number) || 0);
  const [reviewText, setReviewText] = useState((body.review_text as string) || '');
  const [isAnonymous, setIsAnonymous] = useState((body.is_anonymous as boolean) || false);

  // Venue-specific
  const [atmosphereRating, setAtmosphereRating] = useState((body.atmosphere_rating as number) || 0);
  const [themingRating, setThemingRating] = useState((body.theming_rating as number) || 0);

  // Stateroom-specific
  const [stateroomRating, setStateroomRating] = useState((body.stateroom_rating as number) || 0);
  const [sailingRating, setSailingRating] = useState((body.sailing_rating as number) || 0);

  // Sailing-specific
  const [overallRating, setOverallRating] = useState((body.overall_rating as number) || 0);
  const [serviceRating, setServiceRating] = useState((body.service_rating as number) || 0);
  const [entertainmentRating, setEntertainmentRating] = useState((body.entertainment_rating as number) || 0);
  const [foodRating, setFoodRating] = useState((body.food_rating as number) || 0);

  // Hack-specific
  const [verdict, setVerdict] = useState((body.verdict as string) || '');

  // Social URLs
  const [instagramUrl, setInstagramUrl] = useState((body.instagram_url as string) || '');
  const [tiktokUrl, setTiktokUrl] = useState((body.tiktok_url as string) || '');
  const [youtubeUrl, setYoutubeUrl] = useState((body.youtube_url as string) || '');
  const [facebookUrl, setFacebookUrl] = useState((body.facebook_url as string) || '');
  const [xiaohongshuUrl, setXiaohongshuUrl] = useState((body.xiaohongshu_url as string) || '');

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedBody = { ...body };

      // Update fields based on type
      if (type === 'venue') {
        updatedBody.rating = rating;
        updatedBody.atmosphere_rating = atmosphereRating || undefined;
        updatedBody.theming_rating = themingRating || undefined;
        updatedBody.review_text = reviewText || undefined;
        updatedBody.is_anonymous = isAnonymous;
        updatedBody.instagram_url = instagramUrl || undefined;
        updatedBody.tiktok_url = tiktokUrl || undefined;
        updatedBody.youtube_url = youtubeUrl || undefined;
        updatedBody.facebook_url = facebookUrl || undefined;
        updatedBody.xiaohongshu_url = xiaohongshuUrl || undefined;
      } else if (type === 'stateroom') {
        updatedBody.stateroom_rating = stateroomRating;
        updatedBody.sailing_rating = sailingRating;
        updatedBody.review_text = reviewText || undefined;
      } else if (type === 'sailing') {
        updatedBody.overall_rating = overallRating;
        updatedBody.service_rating = serviceRating || undefined;
        updatedBody.entertainment_rating = entertainmentRating || undefined;
        updatedBody.food_rating = foodRating || undefined;
        updatedBody.review_text = reviewText || undefined;
      } else if (type === 'hack') {
        updatedBody.rating = rating;
        updatedBody.review_text = reviewText || undefined;
        updatedBody.verdict = verdict || undefined;
      } else if (type === 'movie') {
        updatedBody.rating = rating;
        updatedBody.review_text = reviewText || undefined;
        updatedBody.instagram_url = instagramUrl || undefined;
        updatedBody.tiktok_url = tiktokUrl || undefined;
        updatedBody.youtube_url = youtubeUrl || undefined;
        updatedBody.facebook_url = facebookUrl || undefined;
        updatedBody.xiaohongshu_url = xiaohongshuUrl || undefined;
      } else {
        // foodie, dining, activity
        updatedBody.rating = rating;
        updatedBody.review_text = reviewText || undefined;
        updatedBody.is_anonymous = isAnonymous;
      }

      const updated = { ...mutation, body: updatedBody };
      await updateMutation(updated);
      onSave(updated);
    } finally {
      setSaving(false);
    }
  };

  // Identifier display (read-only context)
  const identifierLabel = (() => {
    if (body.ship_name) return `${body.ship_name}`;
    if (body.movie_id) return `Movie: ${body.movie_id}`;
    return '';
  })();

  const showSocialUrls = type === 'venue' || type === 'movie';
  const showAnonymous = ['venue', 'foodie', 'dining', 'activity'].includes(type);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Edit Queued Review
          </h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Read-only identifier */}
        {identifierLabel && (
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-4 px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
            {identifierLabel}
          </div>
        )}

        <div className="space-y-4">
          {/* Type-specific rating fields */}
          {type === 'stateroom' ? (
            <div className="grid grid-cols-2 gap-4">
              <StarInput value={stateroomRating} onChange={setStateroomRating} label="Stateroom Rating" />
              <StarInput value={sailingRating} onChange={setSailingRating} label="Sailing Rating" />
            </div>
          ) : type === 'sailing' ? (
            <div className="space-y-3">
              <StarInput value={overallRating} onChange={setOverallRating} label="Overall Rating" />
              <div className="grid grid-cols-3 gap-3">
                <StarInput value={serviceRating} onChange={setServiceRating} label="Service" />
                <StarInput value={entertainmentRating} onChange={setEntertainmentRating} label="Entertainment" />
                <StarInput value={foodRating} onChange={setFoodRating} label="Food" />
              </div>
            </div>
          ) : (
            <>
              <StarInput value={rating} onChange={setRating} label="Rating" />
              {type === 'venue' && (
                <div className="grid grid-cols-2 gap-4">
                  <StarInput value={atmosphereRating} onChange={setAtmosphereRating} label="Atmosphere" />
                  <StarInput value={themingRating} onChange={setThemingRating} label="Theming" />
                </div>
              )}
            </>
          )}

          {/* Verdict for hacks */}
          {type === 'hack' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Verdict</label>
              <div className="flex gap-2">
                {['Must Try', 'Worth It', 'Skip It'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVerdict(v)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      verdict === v
                        ? v === 'Must Try' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700'
                        : v === 'Worth It' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Review text */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Review</label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Your review..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent resize-none text-sm"
            />
          </div>

          {/* Anonymous toggle */}
          {showAnonymous && (
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600"
              />
              Post anonymously
            </label>
          )}

          {/* Social URLs */}
          {showSocialUrls && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Social Links</label>
              <input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="Instagram URL" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white" />
              <input value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} placeholder="TikTok URL" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white" />
              <input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="YouTube URL" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white" />
              <input value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="Facebook URL" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white" />
              <input value={xiaohongshuUrl} onChange={(e) => setXiaohongshuUrl(e.target.value)} placeholder="Xiaohongshu URL" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white" />
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm btn-disney disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl font-medium text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
