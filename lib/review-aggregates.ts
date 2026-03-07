import { getSupabase } from '@/lib/supabase';

interface AggregateRating {
  averageRating: number;
  totalReviews: number;
}

/**
 * Get aggregate rating for venue reviews (by venue_id).
 */
export async function getVenueAggregateRating(venueId: string, ship?: string): Promise<AggregateRating> {
  const supabase = getSupabase();
  if (!supabase) return { averageRating: 0, totalReviews: 0 };

  let query = supabase.from('venue_reviews').select('overall_rating').eq('venue_id', venueId);
  if (ship) query = query.eq('ship_name', ship);

  const { data } = await query;
  if (!data || data.length === 0) return { averageRating: 0, totalReviews: 0 };

  const ratings = data.map(r => r.overall_rating).filter(Boolean);
  if (ratings.length === 0) return { averageRating: 0, totalReviews: 0 };

  const avg = ratings.reduce((s, v) => s + v, 0) / ratings.length;
  return { averageRating: Math.round(avg * 10) / 10, totalReviews: ratings.length };
}

/**
 * Get aggregate rating for cruise guide item reviews (by item_type + item_id).
 */
export async function getGuideItemAggregateRating(itemType: string, itemId: string): Promise<AggregateRating> {
  const supabase = getSupabase();
  if (!supabase) return { averageRating: 0, totalReviews: 0 };

  const { data } = await supabase
    .from('planner_reviews')
    .select('overall_rating')
    .eq('item_type', itemType)
    .eq('item_id', itemId);

  if (!data || data.length === 0) return { averageRating: 0, totalReviews: 0 };

  const ratings = data.map(r => r.overall_rating).filter(Boolean);
  if (ratings.length === 0) return { averageRating: 0, totalReviews: 0 };

  const avg = ratings.reduce((s, v) => s + v, 0) / ratings.length;
  return { averageRating: Math.round(avg * 10) / 10, totalReviews: ratings.length };
}

/**
 * Get aggregate rating for movie reviews.
 */
export async function getMovieAggregateRating(movieId: string): Promise<AggregateRating> {
  const supabase = getSupabase();
  if (!supabase) return { averageRating: 0, totalReviews: 0 };

  const { data } = await supabase
    .from('movie_reviews')
    .select('overall_rating')
    .eq('movie_id', movieId);

  if (!data || data.length === 0) return { averageRating: 0, totalReviews: 0 };

  const ratings = data.map(r => r.overall_rating).filter(Boolean);
  if (ratings.length === 0) return { averageRating: 0, totalReviews: 0 };

  const avg = ratings.reduce((s, v) => s + v, 0) / ratings.length;
  return { averageRating: Math.round(avg * 10) / 10, totalReviews: ratings.length };
}
