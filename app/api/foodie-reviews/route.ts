import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { getSupabase, stripHtml, requireAuth, enrichWithProfiles, enrichWithSailingContext } from '@/lib/review-api-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venue_id');
    const ship = searchParams.get('ship');

    if (!venueId) {
      return NextResponse.json({ error: 'venue_id query parameter is required' }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ reviews: [], averageRating: null, totalReviews: 0, shipRatings: {} });
    }

    // Always fetch ALL reviews for this venue (unfiltered) so we can compute shipRatings
    const { data: allReviews, error: allError } = await supabase
      .from('foodie_reviews')
      .select('*')
      .eq('venue_id', venueId)
      .order('created_at', { ascending: false });

    if (allError) throw allError;

    const rawAll = allReviews ?? [];

    // Compute per-ship ratings from ALL reviews
    const sailingIds = [...new Set(rawAll.map(r => r.sailing_id).filter(Boolean))];
    let sailingMap: Record<string, { ship_name: string; sail_start_date: string; itinerary_name: string | null }> = {};
    if (sailingIds.length > 0) {
      const { data: sailings } = await supabase
        .from('sailing_reviews')
        .select('id, ship_name, sail_start_date, itinerary_name')
        .in('id', sailingIds);
      sailingMap = Object.fromEntries((sailings ?? []).map(s => [s.id, s]));
    }

    // Build shipRatings from all reviews
    const shipRatings: Record<string, { avg: number; count: number }> = {};
    for (const r of rawAll) {
      const shipName = sailingMap[r.sailing_id]?.ship_name;
      if (!shipName) continue;
      if (!shipRatings[shipName]) shipRatings[shipName] = { avg: 0, count: 0 };
      shipRatings[shipName].avg += r.rating;
      shipRatings[shipName].count += 1;
    }
    for (const key of Object.keys(shipRatings)) {
      shipRatings[key].avg = Math.round((shipRatings[key].avg / shipRatings[key].count) * 10) / 10;
    }

    // Filter reviews by ship if requested
    let filteredReviews = rawAll;
    if (ship) {
      const shipSailingIds = new Set(
        Object.entries(sailingMap)
          .filter(([, s]) => s.ship_name === ship)
          .map(([id]) => id)
      );
      filteredReviews = rawAll.filter(r => shipSailingIds.has(r.sailing_id));
    }

    const totalReviews = filteredReviews.length;
    const averageRating = totalReviews > 0
      ? Math.round((filteredReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
      : null;

    // Enrich with reviewer profiles and sailing context
    const withProfiles = await enrichWithProfiles(supabase, filteredReviews);
    const withSailing = await enrichWithSailingContext(supabase, withProfiles);

    // Fetch photos for these reviews
    const reviewIds = filteredReviews.map(r => r.id);
    let photoMap: Record<string, Array<{ id: string; photo_url: string; sort_order: number }>> = {};
    if (reviewIds.length > 0) {
      const { data: photos } = await supabase
        .from('foodie_review_photos')
        .select('id, review_id, photo_url, sort_order')
        .in('review_id', reviewIds)
        .order('sort_order', { ascending: true });
      for (const p of (photos ?? [])) {
        if (!photoMap[p.review_id]) photoMap[p.review_id] = [];
        photoMap[p.review_id].push({ id: p.id, photo_url: p.photo_url, sort_order: p.sort_order });
      }
    }

    // Fetch companions for these reviews
    let companionMap: Record<string, Array<{ companion_user_id: string; display_name: string; avatar_url: string | null }>> = {};
    if (reviewIds.length > 0) {
      const { data: companions } = await supabase
        .from('foodie_review_companions')
        .select('review_id, companion_user_id')
        .in('review_id', reviewIds);

      const companionUserIds = [...new Set((companions ?? []).map(c => c.companion_user_id))];
      let companionProfiles: Record<string, { display_name: string; avatar_url: string | null }> = {};
      if (companionUserIds.length > 0) {
        const { data: cProfiles } = await supabase
          .from('user_profiles')
          .select('id, display_name, avatar_url')
          .in('id', companionUserIds);
        companionProfiles = Object.fromEntries((cProfiles ?? []).map(p => [p.id, p]));
      }

      for (const c of (companions ?? [])) {
        if (!companionMap[c.review_id]) companionMap[c.review_id] = [];
        companionMap[c.review_id].push({
          companion_user_id: c.companion_user_id,
          display_name: companionProfiles[c.companion_user_id]?.display_name ?? 'Unknown',
          avatar_url: companionProfiles[c.companion_user_id]?.avatar_url ?? null,
        });
      }
    }

    const enrichedReviews = withSailing.map(r => ({
      id: r.id,
      venue_id: r.venue_id,
      rating: r.rating,
      review_text: r.review_text,
      is_anonymous: r.is_anonymous,
      created_at: r.created_at,
      reviewer_name: r.is_anonymous ? 'Anonymous Cruiser' : r.reviewer_name,
      reviewer_avatar: r.is_anonymous ? null : r.reviewer_avatar,
      reviewer_id: r.is_anonymous ? null : r.reviewer_id,
      reviewer_handle: r.is_anonymous ? null : r.reviewer_handle,
      sailing_ship: r.sailing_ship,
      sailing_start: r.sailing_start,
      sailing_itinerary: r.sailing_itinerary,
      photos: photoMap[r.id] ?? [],
      companions: companionMap[r.id] ?? [],
    }));

    return NextResponse.json({ reviews: enrichedReviews, averageRating, totalReviews, shipRatings });
  } catch (error) {
    console.error('Error fetching foodie reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const { allowed } = checkRateLimit(`foodie-review:${ip}`, 10);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const authHeader = request.headers.get('Authorization');
    const supabase = getSupabase(authHeader);
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const authResult = await requireAuth(supabase);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    const body = await request.json();
    const { venue_id, sailing_id, rating, review_text, is_anonymous, companion_ids, photos } = body;

    if (!venue_id || !sailing_id || !rating) {
      return NextResponse.json({ error: 'venue_id, sailing_id, and rating are required' }, { status: 400 });
    }

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 });
    }

    // Validate sailing exists and belongs to user
    const { data: sailing, error: sailingError } = await supabase
      .from('sailing_reviews')
      .select('id, user_id')
      .eq('id', sailing_id)
      .single();

    if (sailingError || !sailing) {
      return NextResponse.json({ error: 'Sailing not found' }, { status: 404 });
    }

    // Allow both sailing owners and guests (companions)
    if (sailing.user_id !== user.id) {
      const { data: companion } = await supabase
        .from('sailing_companions')
        .select('id')
        .eq('sailing_id', sailing_id)
        .eq('companion_id', user.id)
        .single();
      if (!companion) {
        return NextResponse.json({ error: 'You do not have access to this sailing' }, { status: 403 });
      }
    }

    // Validate review text
    const cleanText = review_text ? stripHtml(String(review_text)).slice(0, 1000) : null;

    // Validate photos (max 10)
    const photoUrls: string[] = Array.isArray(photos) ? photos.slice(0, 10) : [];

    // Validate companion IDs
    const companionList: string[] = Array.isArray(companion_ids) ? companion_ids : [];

    // Upsert review
    const { data: review, error: reviewError } = await supabase
      .from('foodie_reviews')
      .upsert({
        user_id: user.id,
        venue_id: stripHtml(String(venue_id)).slice(0, 100),
        sailing_id,
        rating: ratingNum,
        review_text: cleanText,
        is_anonymous: is_anonymous === true,
      }, { onConflict: 'user_id,sailing_id,venue_id' })
      .select()
      .single();

    if (reviewError) throw reviewError;

    // Handle photos — delete existing and re-insert
    await supabase
      .from('foodie_review_photos')
      .delete()
      .eq('review_id', review.id);

    if (photoUrls.length > 0) {
      const photoInserts = photoUrls.map((url, i) => ({
        review_id: review.id,
        photo_url: String(url).slice(0, 500),
        sort_order: i,
      }));
      await supabase.from('foodie_review_photos').insert(photoInserts);
    }

    // Handle companions — delete existing and re-insert
    await supabase
      .from('foodie_review_companions')
      .delete()
      .eq('review_id', review.id);

    if (companionList.length > 0) {
      const companionInserts = companionList.map(cid => ({
        review_id: review.id,
        companion_user_id: cid,
      }));
      await supabase.from('foodie_review_companions').insert(companionInserts);
    }

    return NextResponse.json({ success: true, message: 'Review submitted successfully!', review });
  } catch (error) {
    console.error('Error submitting foodie review:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id query parameter is required' }, { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    const supabase = getSupabase(authHeader);
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const authResult = await requireAuth(supabase);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('foodie_reviews')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own reviews' }, { status: 403 });
    }

    // Delete review (cascades to photos and companions)
    const { error } = await supabase
      .from('foodie_reviews')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting foodie review:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
