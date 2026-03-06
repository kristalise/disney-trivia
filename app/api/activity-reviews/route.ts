import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  getSupabase,
  VALID_SHIPS,
  stripHtml,
  validateSocialUrls,
  requireAuth,
  enrichWithProfiles,
  enrichWithSailingContext,
} from '@/lib/review-api-utils';

const VALID_AGE_GROUPS = ['Adults', 'Teens', 'Kids', 'All Ages'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ship = searchParams.get('ship');
    const activity = searchParams.get('activity');

    if (!ship) {
      return NextResponse.json({ error: 'ship query parameter is required' }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ reviews: [], averageRating: null, ageGroupCounts: {}, totalReviews: 0 });
    }

    let query = supabase
      .from('activity_reviews')
      .select('*')
      .eq('ship_name', ship)
      .order('created_at', { ascending: false });

    if (activity) {
      query = query.eq('activity_id', activity);
    }

    const { data: reviews, error } = await query;
    if (error) throw error;

    const totalReviews = reviews?.length ?? 0;
    const averageRating = totalReviews > 0
      ? Math.round((reviews!.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
      : null;

    const ageGroupCounts: Record<string, number> = {};
    reviews?.forEach((r) => {
      if (r.age_group_recommended && Array.isArray(r.age_group_recommended)) {
        r.age_group_recommended.forEach((ag: string) => {
          ageGroupCounts[ag] = (ageGroupCounts[ag] || 0) + 1;
        });
      }
    });

    // Enrich with reviewer profiles
    const rawReviews = reviews ?? [];
    let enrichedReviews = await enrichWithProfiles(supabase, rawReviews);

    // Enrich with sailing context
    enrichedReviews = await enrichWithSailingContext(supabase, enrichedReviews);

    return NextResponse.json({ reviews: enrichedReviews, averageRating, ageGroupCounts, totalReviews });
  } catch (error) {
    console.error('Error fetching activity reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const { allowed } = checkRateLimit(`activity-review:${ip}`, 10);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const authHeader = request.headers.get('Authorization');
    const supabase = getSupabase(authHeader);
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const authResult = await requireAuth(supabase);
    if (authResult.error) return authResult.error;
    const { user } = authResult;

    const body = await request.json();
    const { ship_name: body_ship_name, activity_id, rating, age_group_recommended, review_text, photo_url, sailing_id, is_anonymous } = body;

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

    if (!ship_name || !activity_id || !rating) {
      return NextResponse.json({ error: 'Ship, activity, and rating are required' }, { status: 400 });
    }
    if (!VALID_SHIPS.includes(ship_name)) {
      return NextResponse.json({ error: 'Invalid ship name' }, { status: 400 });
    }

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 });
    }

    const ageList: string[] = Array.isArray(age_group_recommended) ? age_group_recommended : [];
    if (ageList.length > 0 && !ageList.every((a: string) => VALID_AGE_GROUPS.includes(a))) {
      return NextResponse.json({ error: 'Invalid age group' }, { status: 400 });
    }

    // Validate social URLs
    const socialResult = validateSocialUrls(body);
    if (!socialResult.valid) return socialResult.error;

    const { data, error } = await supabase
      .from('activity_reviews')
      .insert({
        user_id: user.id,
        ship_name,
        activity_id: stripHtml(String(activity_id)).slice(0, 100),
        rating: ratingNum,
        age_group_recommended: ageList.length > 0 ? ageList : null,
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
    console.error('Error submitting activity review:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
