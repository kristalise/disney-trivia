import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { getSupabase, VALID_SHIPS, stripHtml, validateRating, validateSocialUrls, requireAuth, enrichWithProfiles, enrichWithSailingContext } from '@/lib/review-api-utils';

const VALID_VISITED_WITH = ['Solo', 'Partner', 'Family', 'Friends', 'Kids'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const venue = searchParams.get('venue');
    const ship = searchParams.get('ship');

    if (!venue) {
      return NextResponse.json({ error: 'venue query parameter is required' }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ reviews: [], averageRating: null, averageAtmosphere: null, averageTheming: null, visitedWithCounts: {}, totalReviews: 0 });
    }

    let query = supabase
      .from('venue_reviews')
      .select('*')
      .eq('venue_id', venue)
      .order('created_at', { ascending: false });

    if (ship) {
      query = query.eq('ship_name', ship);
    }

    const { data: reviews, error } = await query;
    if (error) throw error;

    const totalReviews = reviews?.length ?? 0;
    const averageRating = totalReviews > 0
      ? Math.round((reviews!.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
      : null;

    const atmosphereReviews = reviews?.filter(r => r.atmosphere_rating != null) ?? [];
    const averageAtmosphere = atmosphereReviews.length > 0
      ? Math.round((atmosphereReviews.reduce((sum, r) => sum + r.atmosphere_rating, 0) / atmosphereReviews.length) * 10) / 10
      : null;

    const themingReviews = reviews?.filter(r => r.theming_rating != null) ?? [];
    const averageTheming = themingReviews.length > 0
      ? Math.round((themingReviews.reduce((sum, r) => sum + r.theming_rating, 0) / themingReviews.length) * 10) / 10
      : null;

    const visitedWithCounts: Record<string, number> = {};
    reviews?.forEach((r) => {
      if (r.visited_with && Array.isArray(r.visited_with)) {
        r.visited_with.forEach((tag: string) => {
          visitedWithCounts[tag] = (visitedWithCounts[tag] || 0) + 1;
        });
      }
    });

    const rawReviews = reviews ?? [];
    const withProfiles = await enrichWithProfiles(supabase, rawReviews);
    const enrichedReviews = await enrichWithSailingContext(supabase, withProfiles);

    return NextResponse.json({ reviews: enrichedReviews, averageRating, averageAtmosphere, averageTheming, visitedWithCounts, totalReviews });
  } catch (error) {
    console.error('Error fetching venue reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const { allowed } = checkRateLimit(`venue-review:${ip}`, 10);
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

    const body = await request.json();
    const { ship_name: body_ship_name, venue_id, rating, atmosphere_rating, theming_rating, visited_with, review_text, photo_url, sailing_id, instagram_url, tiktok_url, youtube_url, facebook_url, xiaohongshu_url } = body;

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

    if (!ship_name || !venue_id || !rating) {
      return NextResponse.json({ error: 'Ship, venue, and rating are required' }, { status: 400 });
    }
    if (!VALID_SHIPS.includes(ship_name)) {
      return NextResponse.json({ error: 'Invalid ship name' }, { status: 400 });
    }

    const ratingCheck = validateRating(rating, 'Rating');
    if (!ratingCheck.valid) return ratingCheck.error;
    const atmosCheck = validateRating(atmosphere_rating, 'Atmosphere rating');
    if (!atmosCheck.valid) return atmosCheck.error;
    const themeCheck = validateRating(theming_rating, 'Theming rating');
    if (!themeCheck.valid) return themeCheck.error;

    const visitedList: string[] = Array.isArray(visited_with) ? visited_with : [];
    if (visitedList.length > 0 && !visitedList.every((v: string) => VALID_VISITED_WITH.includes(v))) {
      return NextResponse.json({ error: 'Invalid visited_with value' }, { status: 400 });
    }

    const socialCheck = validateSocialUrls({ instagram_url, tiktok_url, youtube_url, facebook_url, xiaohongshu_url });
    if (!socialCheck.valid) return socialCheck.error;

    const { data, error } = await supabase
      .from('venue_reviews')
      .insert({
        user_id: auth.user.id,
        ship_name,
        venue_id: stripHtml(String(venue_id)).slice(0, 100),
        rating: ratingCheck.value,
        atmosphere_rating: atmosphere_rating != null ? atmosCheck.value : null,
        theming_rating: theming_rating != null ? themeCheck.value : null,
        visited_with: visitedList.length > 0 ? visitedList : null,
        review_text: review_text ? stripHtml(String(review_text)).slice(0, 1000) : null,
        photo_url: photo_url ? String(photo_url).slice(0, 500) : null,
        ...(sailing_id ? { sailing_id } : {}),
        ...socialCheck.urls,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Review submitted successfully!', review: data });
  } catch (error) {
    console.error('Error submitting venue review:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const supabase = getSupabase(authHeader);
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const auth = await requireAuth(supabase);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { review_id, rating, atmosphere_rating, theming_rating, visited_with, review_text } = body;

    if (!review_id) {
      return NextResponse.json({ error: 'review_id is required' }, { status: 400 });
    }

    const { data: existing, error: fetchError } = await supabase
      .from('venue_reviews')
      .select('id, user_id')
      .eq('id', review_id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    if (existing.user_id !== auth.user.id) {
      return NextResponse.json({ error: 'You can only edit your own reviews' }, { status: 403 });
    }

    const updates: Record<string, unknown> = {};
    if (rating != null) {
      const check = validateRating(rating, 'Rating');
      if (!check.valid) return check.error;
      updates.rating = check.value;
    }
    if (atmosphere_rating !== undefined) {
      if (atmosphere_rating != null) {
        const check = validateRating(atmosphere_rating, 'Atmosphere rating');
        if (!check.valid) return check.error;
        updates.atmosphere_rating = check.value;
      } else {
        updates.atmosphere_rating = null;
      }
    }
    if (theming_rating !== undefined) {
      if (theming_rating != null) {
        const check = validateRating(theming_rating, 'Theming rating');
        if (!check.valid) return check.error;
        updates.theming_rating = check.value;
      } else {
        updates.theming_rating = null;
      }
    }
    if (visited_with !== undefined) {
      if (Array.isArray(visited_with)) {
        if (!visited_with.every((v: string) => VALID_VISITED_WITH.includes(v))) {
          return NextResponse.json({ error: 'Invalid visited_with value' }, { status: 400 });
        }
        updates.visited_with = visited_with.length > 0 ? visited_with : null;
      } else {
        updates.visited_with = null;
      }
    }
    if (review_text !== undefined) {
      updates.review_text = review_text ? stripHtml(String(review_text)).slice(0, 1000) : null;
    }
    const socialCheck = validateSocialUrls(body);
    if (!socialCheck.valid) return socialCheck.error;
    for (const [key, val] of Object.entries(socialCheck.urls)) {
      updates[key] = val;
    }
    for (const field of ['instagram_url', 'tiktok_url', 'youtube_url', 'facebook_url', 'xiaohongshu_url'] as const) {
      if (body[field] !== undefined && !socialCheck.urls[field]) {
        updates[field] = body[field] ? stripHtml(String(body[field])).slice(0, 500) : null;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('venue_reviews')
      .update(updates)
      .eq('id', review_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Review updated successfully!', review: data });
  } catch (error) {
    console.error('Error updating venue review:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}
