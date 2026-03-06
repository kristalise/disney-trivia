import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  getSupabase,
  VALID_SHIPS,
  stripHtml,
  validateRating,
  validateSocialUrls,
  requireAuth,
  enrichWithProfiles,
  enrichWithSailingContext,
} from '@/lib/review-api-utils';

const VALID_DIETARY = [
  'Nut-Free', 'Dairy-Free', 'Gluten-Free', 'Shellfish-Free', 'Egg-Free',
  'Soy-Free', 'Fish-Free', 'Vegan', 'Vegetarian', 'Halal', 'Kosher',
  'Low-Sodium', 'Diabetic-Friendly', 'Child-Friendly Menu',
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ship = searchParams.get('ship');
    const restaurant = searchParams.get('restaurant');

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ reviews: [], averageRating: null, dietaryTagCounts: {}, totalReviews: 0 });
    }

    let query = supabase
      .from('dining_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (ship) {
      query = query.eq('ship_name', ship);
    }

    if (restaurant) {
      query = query.eq('restaurant_id', restaurant);
    }

    const { data: reviews, error } = await query;
    if (error) throw error;

    const totalReviews = reviews?.length ?? 0;
    const averageRating = totalReviews > 0
      ? Math.round((reviews!.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
      : null;

    // Count dietary tags across all reviews
    const dietaryTagCounts: Record<string, number> = {};
    reviews?.forEach((r) => {
      if (r.dietary_restrictions && Array.isArray(r.dietary_restrictions)) {
        r.dietary_restrictions.forEach((tag: string) => {
          dietaryTagCounts[tag] = (dietaryTagCounts[tag] || 0) + 1;
        });
      }
    });

    // Enrich with reviewer profiles
    const rawReviews = reviews ?? [];
    let enrichedReviews = await enrichWithProfiles(supabase, rawReviews);

    // Enrich with sailing context
    enrichedReviews = await enrichWithSailingContext(supabase, enrichedReviews);

    return NextResponse.json({ reviews: enrichedReviews, averageRating, dietaryTagCounts, totalReviews });
  } catch (error) {
    console.error('Error fetching dining reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const { allowed } = checkRateLimit(`dining-review:${ip}`, 10);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const authHeader = request.headers.get('Authorization');
    const supabase = getSupabase(authHeader);
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const auth = await requireAuth(supabase);
    if (auth.error) return auth.error;
    const { user } = auth;

    const body = await request.json();
    const { ship_name: body_ship_name, restaurant_id, rating, dietary_restrictions, dietary_accommodation_rating, review_text, photo_url, sailing_id, is_anonymous } = body;

    // If sailing_id provided, look up the sailing and auto-populate ship_name
    let ship_name = body_ship_name;
    if (sailing_id) {
      const { data: sailing, error: sailingError } = await supabase
        .from('sailing_reviews')
        .select('ship_name')
        .eq('id', sailing_id)
        .single();
      if (sailingError || !sailing) {
        return NextResponse.json({ error: 'Sailing not found' }, { status: 404 });
      }
      ship_name = ship_name || sailing.ship_name;
    }

    if (!ship_name || !restaurant_id || !rating) {
      return NextResponse.json({ error: 'Ship, restaurant, and rating are required' }, { status: 400 });
    }
    if (!VALID_SHIPS.includes(ship_name)) {
      return NextResponse.json({ error: 'Invalid ship name' }, { status: 400 });
    }

    const ratingResult = validateRating(rating, 'Rating');
    if (!ratingResult.valid) return ratingResult.error;
    const ratingNum = ratingResult.value;

    const dietaryList: string[] = Array.isArray(dietary_restrictions) ? dietary_restrictions : [];
    if (dietaryList.length > 0 && !dietaryList.every((d: string) => VALID_DIETARY.includes(d))) {
      return NextResponse.json({ error: 'Invalid dietary restriction' }, { status: 400 });
    }

    if (dietary_accommodation_rating != null) {
      const accomResult = validateRating(dietary_accommodation_rating, 'Dietary accommodation rating');
      if (!accomResult.valid) return accomResult.error;
    }

    // Validate social URLs
    const socialResult = validateSocialUrls(body);
    if (!socialResult.valid) return socialResult.error;

    const { data, error } = await supabase
      .from('dining_reviews')
      .insert({
        user_id: user.id,
        ship_name,
        restaurant_id: stripHtml(String(restaurant_id)).slice(0, 100),
        rating: ratingNum,
        dietary_restrictions: dietaryList.length > 0 ? dietaryList : null,
        dietary_accommodation_rating: dietary_accommodation_rating != null ? Number(dietary_accommodation_rating) : null,
        review_text: review_text ? stripHtml(String(review_text)).slice(0, 1000) : null,
        photo_url: photo_url ? String(photo_url).slice(0, 500) : null,
        is_anonymous: !!is_anonymous,
        ...(sailing_id ? { sailing_id } : {}),
        ...socialResult.urls,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Review submitted successfully!', review: data });
  } catch (error) {
    console.error('Error submitting dining review:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
