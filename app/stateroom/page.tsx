'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import stateroomData from '@/data/stateroom-data.json';
import { getDeckFromRoomNumber } from '@/lib/deck-plan-utils';
import { useAuth } from '@/components/AuthProvider';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { submitOrQueueReview } from '@/lib/offline-store';

const SHIPS = [
  'Disney Magic',
  'Disney Wonder',
  'Disney Dream',
  'Disney Fantasy',
  'Disney Wish',
  'Disney Treasure',
  'Disney Destiny',
  'Disney Adventure',
] as const;

type ShipName = (typeof SHIPS)[number];

interface Stateroom {
  stateroom: number;
  category: string | null;
  occupancy: number | null;
  connecting: string | null;
  accessible: string | null;
  verandahPartitions: string | null;
  bedding: string | null;
  assemblyStation: string | null;
  assemblyLocation: string | null;
  assemblySide: string | null;
  assemblySection: string | null;
  wishExtender?: string | null;
  theme?: string | null;
  notes: string | null;
}

interface Review {
  id: string;
  ship_name: string;
  stateroom_number: number;
  sail_start_date: string;
  sail_end_date: string | null;
  stateroom_rating: number;
  sailing_rating: number | null;
  num_passengers: number | null;
  adults: number | null;
  children: number | null;
  infants: number | null;
  occasions: string | null;
  boarding_port: string | null;
  ports_of_call: string | null;
  departure_port: string | null;
  purchased_from: string | null;
  price_paid: number | null;
  review_text: string | null;
  created_at: string;
}

const data = stateroomData as Record<ShipName, Stateroom[]>;

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value || value === 'NO' && label === 'Connecting') {
    // Show "None" for connecting = NO
  }
  return (
    <div className="flex justify-between items-start py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm text-slate-900 dark:text-white text-right ml-4 max-w-[60%]">
        {value || '—'}
      </span>
    </div>
  );
}

function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-6 h-6' : 'w-5 h-5';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${cls} ${star <= rating ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
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
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        {label}
      </label>
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
              className={`w-8 h-8 transition-colors ${
                star <= (hover || value)
                  ? 'text-yellow-400'
                  : 'text-slate-300 dark:text-slate-600'
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

const OCCASIONS = [
  'Birthday',
  'Anniversary',
  'Honeymoon',
  'Family Vacation',
  'Holiday',
  'Graduation',
  'Just for Fun',
  'Babymoon',
  'Reunion',
  'Other',
];

function Stepper({ label, sublabel, value, onChange, min = 0, max = 20 }: {
  label: string;
  sublabel: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <span className="text-sm font-medium text-slate-900 dark:text-white">{label}</span>
        <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">({sublabel})</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          -
        </button>
        <span className="w-6 text-center text-sm font-medium text-slate-900 dark:text-white">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function StateroomPage() {
  const { user, session } = useAuth();
  const isOnline = useOnlineStatus();
  const [selectedShip, setSelectedShip] = useState<ShipName | ''>('');
  const [stateroomInput, setStateroomInput] = useState('');
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Review state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageStateroomRating, setAverageStateroomRating] = useState<number | null>(null);
  const [averageSailingRating, setAverageSailingRating] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Form state
  const [sailStartDate, setSailStartDate] = useState('');
  const [sailEndDate, setSailEndDate] = useState('');
  const [adults, setAdults] = useState(0);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [occasions, setOccasions] = useState<string[]>([]);
  const [boardingPort, setBoardingPort] = useState('');
  const [portsOfCall, setPortsOfCall] = useState('');
  const [departurePort, setDeparturePort] = useState('');
  const [purchasedFrom, setPurchasedFrom] = useState('');
  const [pricePaid, setPricePaid] = useState('');
  const [stateroomRating, setStateroomRating] = useState(0);
  const [sailingRating, setSailingRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const result = useMemo<Stateroom | null>(() => {
    if (!selectedShip || !stateroomInput) return null;
    const num = parseInt(stateroomInput, 10);
    if (isNaN(num)) return null;
    const rooms = data[selectedShip];
    return rooms?.find((r) => r.stateroom === num) ?? null;
  }, [selectedShip, stateroomInput, searched]);

  const fetchReviews = useCallback(async () => {
    if (!selectedShip || !stateroomInput) return;
    setReviewsLoading(true);
    try {
      const res = await fetch(
        `/api/stateroom-reviews?ship=${encodeURIComponent(selectedShip)}&room=${encodeURIComponent(stateroomInput)}`
      );
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
        setAverageStateroomRating(data.averageStateroomRating);
        setAverageSailingRating(data.averageSailingRating);
        setTotalReviews(data.totalReviews);
      }
    } catch {
      // Silently fail — reviews are supplemental
    } finally {
      setReviewsLoading(false);
    }
  }, [selectedShip, stateroomInput]);

  useEffect(() => {
    if (searched && selectedShip && stateroomInput) {
      fetchReviews();
    }
  }, [searched, selectedShip, stateroomInput, fetchReviews]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    if (!selectedShip) {
      setSearchError('Please select a ship first.');
      return;
    }
    if (!stateroomInput) {
      setSearchError('Please enter a stateroom number.');
      return;
    }
    const num = parseInt(stateroomInput, 10);
    const rooms = data[selectedShip];
    const found = rooms?.find((r) => r.stateroom === num);
    if (!found) {
      setSearchError(`Stateroom ${stateroomInput} does not exist on ${selectedShip}. Double-check the number and try again.`);
      setSearched(false);
      return;
    }
    setSearched((s) => !s);
    setSubmitSuccess(false);
    setSubmitError('');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess(false);

    if (!stateroomRating) {
      setSubmitError('Please select a stateroom rating.');
      return;
    }
    if (!sailingRating) {
      setSubmitError('Please select a sailing rating.');
      return;
    }
    if (!sailStartDate || !sailEndDate) {
      setSubmitError('Please enter your sailing date range.');
      return;
    }
    if (adults + children + infants === 0) {
      setSubmitError('Please add at least one passenger.');
      return;
    }
    if (!boardingPort) {
      setSubmitError('Please enter the boarding port.');
      return;
    }
    if (!departurePort) {
      setSubmitError('Please enter the departure port.');
      return;
    }

    setSubmitting(true);
    try {
      const reviewBody = {
        ship_name: selectedShip,
        stateroom_number: parseInt(stateroomInput, 10),
        sail_start_date: sailStartDate,
        sail_end_date: sailEndDate,
        stateroom_rating: stateroomRating,
        sailing_rating: sailingRating,
        num_passengers: adults + children + infants,
        adults,
        children,
        infants,
        occasions: occasions.length > 0 ? occasions : undefined,
        boarding_port: boardingPort,
        ports_of_call: portsOfCall || undefined,
        departure_port: departurePort,
        purchased_from: purchasedFrom || undefined,
        price_paid: pricePaid ? parseFloat(pricePaid) : undefined,
        review_text: reviewText || undefined,
      };
      const reviewHeaders = {
        'Content-Type': 'application/json',
        ...(session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {}),
      };
      const result = await submitOrQueueReview('/api/stateroom-reviews', reviewBody, reviewHeaders, isOnline);

      if (result.error) {
        setSubmitError(result.error);
        return;
      }

      if (result.queued) {
        setSubmitSuccess(true);
        setSailStartDate('');
        setSailEndDate('');
        setAdults(0);
        setChildren(0);
        setInfants(0);
        setOccasions([]);
        setBoardingPort('');
        setPortsOfCall('');
        setDeparturePort('');
        setPurchasedFrom('');
        setPricePaid('');
        setStateroomRating(0);
        setSailingRating(0);
        setReviewText('');
      } else {
        setSubmitSuccess(true);
        setSailStartDate('');
        setSailEndDate('');
        setAdults(0);
        setChildren(0);
        setInfants(0);
        setOccasions([]);
        setBoardingPort('');
        setPortsOfCall('');
        setDeparturePort('');
        setPurchasedFrom('');
        setPricePaid('');
        setStateroomRating(0);
        setSailingRating(0);
        setReviewText('');
        fetchReviews();
      }
    } catch {
      setSubmitError('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const hasThemeFields = selectedShip && ['Disney Wish', 'Disney Treasure', 'Disney Destiny', 'Disney Adventure'].includes(selectedShip);
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Home
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Stateroom Lookup
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Look up details about any Disney Cruise Line stateroom and read community reviews.
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Ship
            </label>
            <select
              value={selectedShip}
              onChange={(e) => { setSelectedShip(e.target.value as ShipName | ''); setSearchError(''); }}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
            >
              <option value="">Select a ship...</option>
              {SHIPS.map((ship) => (
                <option key={ship} value={ship}>
                  {ship}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Stateroom Number
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={stateroomInput}
              onChange={(e) => { setStateroomInput(e.target.value.replace(/\D/g, '')); setSearchError(''); }}
              placeholder="e.g. 2050"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 rounded-xl font-medium btn-disney"
          >
            Look Up Stateroom
          </button>

          {searchError && (
            <div className="mt-3 flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3 border border-amber-200 dark:border-amber-800">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {searchError}
            </div>
          )}
        </div>
      </form>

      {/* Explore Deck Plans link */}
      <Link
        href={`/stateroom/deck-plan${selectedShip ? `?ship=${encodeURIComponent(selectedShip)}` : ''}`}
        className="mb-8 flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        Explore Deck Plans
      </Link>

      {/* Results */}
      {searched && selectedShip && stateroomInput && (
        <>
          {result ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                <div className="text-3xl">🚢</div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {selectedShip} — Stateroom {result.stateroom}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Category {result.category}
                  </p>
                </div>
              </div>

              <div className="space-y-0">
                <DetailRow label="Category" value={result.category} />
                <DetailRow label="Max Occupancy" value={result.occupancy?.toString()} />
                <DetailRow label="Bedding" value={result.bedding} />
                <DetailRow label="Connecting" value={result.connecting === 'NO' ? 'None' : result.connecting} />
                <DetailRow label="Accessible" value={result.accessible === 'NO' ? 'No' : result.accessible || 'No'} />
                <DetailRow label="Verandah Partitions" value={result.verandahPartitions} />
                <DetailRow label="Assembly Station" value={result.assemblyStation} />
                <DetailRow label="Assembly Location" value={result.assemblyLocation} />
                <DetailRow label="Assembly Side" value={result.assemblySide} />
                <DetailRow label="Assembly Section" value={result.assemblySection} />
                {hasThemeFields && (
                  <>
                    <DetailRow label="Theme" value={result.theme} />
                    <DetailRow label="Wish Extender" value={result.wishExtender} />
                  </>
                )}
                {result.notes && <DetailRow label="Notes" value={result.notes} />}
              </div>

              <Link
                href={`/stateroom/deck-plan?ship=${encodeURIComponent(selectedShip)}`}
                className="mt-4 flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                View on Deck Plan
              </Link>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Stateroom Not Found
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                No stateroom {stateroomInput} found on {selectedShip}. Double-check the number and try again.
              </p>
            </div>
          )}

          {/* Community Reviews Section — always shown after search */}
          <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Community Reviews for {selectedShip} #{stateroomInput}
            </h3>

            {reviewsLoading ? (
              <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">
                Loading reviews...
              </div>
            ) : totalReviews > 0 ? (
              <>
                <div className="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Stateroom</p>
                    <div className="flex items-center gap-2">
                      <StarDisplay rating={Math.round(averageStateroomRating!)} />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{averageStateroomRating}</span>
                    </div>
                  </div>
                  {averageSailingRating && (
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Sailing</p>
                      <div className="flex items-center gap-2">
                        <StarDisplay rating={Math.round(averageSailingRating)} />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{averageSailingRating}</span>
                      </div>
                    </div>
                  )}
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                  </span>
                </div>

                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="pb-4 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-xs text-slate-400 dark:text-slate-500">Room</p>
                            <StarDisplay rating={review.stateroom_rating} />
                          </div>
                          {review.sailing_rating && (
                            <div>
                              <p className="text-xs text-slate-400 dark:text-slate-500">Sailing</p>
                              <StarDisplay rating={review.sailing_rating} />
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {new Date(review.sail_start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                        {review.num_passengers && (
                          <span>
                            {review.adults || review.children || review.infants
                              ? [
                                  review.adults ? `${review.adults} adult${review.adults !== 1 ? 's' : ''}` : null,
                                  review.children ? `${review.children} child${review.children !== 1 ? 'ren' : ''}` : null,
                                  review.infants ? `${review.infants} infant${review.infants !== 1 ? 's' : ''}` : null,
                                ].filter(Boolean).join(', ')
                              : `${review.num_passengers} pax`}
                          </span>
                        )}
                        {review.occasions && (
                          <span>{review.occasions.split(',').join(', ')}</span>
                        )}
                        {review.boarding_port && (
                          <span>From {review.boarding_port}</span>
                        )}
                        {review.ports_of_call && (
                          <span>via {review.ports_of_call}</span>
                        )}
                        {review.departure_port && review.departure_port !== review.boarding_port && (
                          <span>to {review.departure_port}</span>
                        )}
                        {review.purchased_from && (
                          <span>via {review.purchased_from}</span>
                        )}
                        {review.price_paid != null && (
                          <span>${Number(review.price_paid).toLocaleString()}</span>
                        )}
                      </div>
                      {review.review_text && (
                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                          {review.review_text}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">💬</div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No reviews yet for this stateroom. Be the first!
                </p>
              </div>
            )}
          </div>

          {/* Log Your Stay Form */}
          <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Log Your Stay
            </h3>

            {user ? (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Passengers by Age Group */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Passengers
                  </label>
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-1 border border-slate-200 dark:border-slate-600">
                    <Stepper label="Adults" sublabel="18+" value={adults} onChange={setAdults} />
                    <Stepper label="Children" sublabel="3-17" value={children} onChange={setChildren} />
                    <Stepper label="Infants" sublabel="0-2" value={infants} onChange={setInfants} />
                  </div>
                  {(adults + children + infants) > 0 && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {adults + children + infants} total passenger{adults + children + infants !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                {/* Occasion */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Occasion (optional, select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {OCCASIONS.map((occasion) => {
                      const selected = occasions.includes(occasion);
                      return (
                        <button
                          key={occasion}
                          type="button"
                          onClick={() =>
                            setOccasions((prev) =>
                              selected ? prev.filter((o) => o !== occasion) : [...prev, occasion]
                            )
                          }
                          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                            selected
                              ? 'bg-disney-blue text-white border-disney-blue dark:bg-disney-gold dark:text-slate-900 dark:border-disney-gold'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                          }`}
                        >
                          {occasion}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Sail Start Date
                    </label>
                    <input
                      type="date"
                      value={sailStartDate}
                      onChange={(e) => setSailStartDate(e.target.value)}
                      max={todayStr}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Sail End Date
                    </label>
                    <input
                      type="date"
                      value={sailEndDate}
                      onChange={(e) => setSailEndDate(e.target.value)}
                      min={sailStartDate || undefined}
                      max={todayStr}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Ports */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Boarding Port
                    </label>
                    <input
                      type="text"
                      value={boardingPort}
                      onChange={(e) => setBoardingPort(e.target.value)}
                      placeholder="e.g. Port Canaveral"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Departure Port
                    </label>
                    <input
                      type="text"
                      value={departurePort}
                      onChange={(e) => setDeparturePort(e.target.value)}
                      placeholder="e.g. Port Canaveral"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Ports of Call (optional)
                  </label>
                  <input
                    type="text"
                    value={portsOfCall}
                    onChange={(e) => setPortsOfCall(e.target.value)}
                    placeholder="e.g. Nassau, Castaway Cay"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
                  />
                </div>

                {/* Purchase Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Purchased From (optional)
                    </label>
                    <input
                      type="text"
                      value={purchasedFrom}
                      onChange={(e) => setPurchasedFrom(e.target.value)}
                      placeholder="e.g. Disney, travel agent"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Price Paid (optional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={pricePaid}
                        onChange={(e) => setPricePaid(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Ratings */}
                <div className="grid grid-cols-2 gap-4">
                  <StarInput value={stateroomRating} onChange={setStateroomRating} label="Stateroom Rating" />
                  <StarInput value={sailingRating} onChange={setSailingRating} label="Sailing Rating" />
                </div>

                {/* Review Text */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Review (optional)
                  </label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    maxLength={1000}
                    rows={3}
                    placeholder="How was your stay?"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-right">
                    {reviewText.length}/1000
                  </p>
                </div>

                {submitError && (
                  <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">
                    {submitError}
                  </div>
                )}

                {submitSuccess && (
                  <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-3">
                    {isOnline ? 'Review submitted successfully!' : 'Review saved! It will sync when you\'re back online.'}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-3 rounded-xl font-medium btn-disney disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">🔒</div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                  Sign in to log your stay and leave a review.
                </p>
                <Link
                  href="/auth"
                  className="inline-block px-6 py-2.5 rounded-xl font-medium btn-disney"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Find Value Rooms — Coming Soon */}
          <div className="mt-6 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-disney-blue/10 via-purple-500/10 to-disney-gold/10 dark:from-disney-blue/20 dark:via-purple-500/20 dark:to-disney-gold/20">
            <div className="text-center">
              <div className="text-3xl mb-2">✨</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Find Value Rooms — Coming Soon
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                We&apos;re building a tool to help you discover the best-reviewed staterooms across the fleet.
                Keep logging your stays to help make this possible!
              </p>
            </div>
          </div>
        </>
      )}

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-400">
        <div className="flex items-start gap-2">
          <span className="text-lg">ℹ️</span>
          <div>
            <p className="font-medium mb-1">About This Data</p>
            <p>
              Stateroom information is sourced from community-maintained spreadsheets and may not reflect recent changes.
              Always verify critical details with Disney Cruise Line directly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
