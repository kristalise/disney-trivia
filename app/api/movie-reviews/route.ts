import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { getSupabase, stripHtml, validateRating, requireAuth, enrichWithProfiles } from '@/lib/review-api-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const movieId = searchParams.get('movieId');
    const aggregate = searchParams.get('aggregate');

    const supabase = getSupabase();
    if (!supabase) {
      if (aggregate) return NextResponse.json({ ratings: {} });
      return NextResponse.json({ reviews: [], averageRating: null, totalReviews: 0 });
    }

    // Aggregate mode: return avg + count for all movies (or a set of movieIds)
    if (aggregate) {
      const { data: reviews, error } = await supabase
        .from('movie_reviews')
        .select('movie_id, rating');

      if (error) throw error;

      const ratings: Record<string, { avg: number; count: number }> = {};
      const buckets: Record<string, number[]> = {};
      for (const r of reviews ?? []) {
        if (!buckets[r.movie_id]) buckets[r.movie_id] = [];
        buckets[r.movie_id].push(r.rating);
      }
      for (const [mid, vals] of Object.entries(buckets)) {
        const sum = vals.reduce((a, b) => a + b, 0);
        ratings[mid] = {
          avg: Math.round((sum / vals.length) * 10) / 10,
          count: vals.length,
        };
      }

      return NextResponse.json({ ratings });
    }

    // Single movie mode
    if (!movieId) {
      return NextResponse.json({ error: 'movieId query parameter is required' }, { status: 400 });
    }

    const { data: reviews, error } = await supabase
      .from('movie_reviews')
      .select('*')
      .eq('movie_id', movieId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const totalReviews = reviews?.length ?? 0;
    const averageRating = totalReviews > 0
      ? Math.round((reviews!.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
      : null;

    const enrichedReviews = await enrichWithProfiles(supabase, reviews ?? []);

    return NextResponse.json({ reviews: enrichedReviews, averageRating, totalReviews });
  } catch (error) {
    console.error('Error fetching movie reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const { allowed } = checkRateLimit(`movie-review:${ip}`, 10);
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
    const { movie_id, rating, review_text } = body;

    if (!movie_id || !rating) {
      return NextResponse.json({ error: 'movie_id and rating are required' }, { status: 400 });
    }

    const ratingCheck = validateRating(rating, 'Rating');
    if (!ratingCheck.valid) return ratingCheck.error;

    const { data, error } = await supabase
      .from('movie_reviews')
      .upsert({
        user_id: auth.user.id,
        movie_id: stripHtml(String(movie_id)).slice(0, 200),
        rating: ratingCheck.value,
        review_text: review_text ? stripHtml(String(review_text)).slice(0, 1000) : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,movie_id' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, review: data });
  } catch (error) {
    console.error('Error submitting movie review:', error);
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
    const { review_id, rating, review_text } = body;

    if (!review_id) {
      return NextResponse.json({ error: 'review_id is required' }, { status: 400 });
    }

    const { data: existing, error: fetchError } = await supabase
      .from('movie_reviews')
      .select('id, user_id')
      .eq('id', review_id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    if (existing.user_id !== auth.user.id) {
      return NextResponse.json({ error: 'You can only edit your own reviews' }, { status: 403 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (rating != null) {
      const check = validateRating(rating, 'Rating');
      if (!check.valid) return check.error;
      updates.rating = check.value;
    }
    if (review_text !== undefined) {
      updates.review_text = review_text ? stripHtml(String(review_text)).slice(0, 1000) : null;
    }

    if (Object.keys(updates).length <= 1) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('movie_reviews')
      .update(updates)
      .eq('id', review_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, review: data });
  } catch (error) {
    console.error('Error updating movie review:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const supabase = getSupabase(authHeader);
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const auth = await requireAuth(supabase);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { data: existing, error: fetchError } = await supabase
      .from('movie_reviews')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    if (existing.user_id !== auth.user.id) {
      return NextResponse.json({ error: 'You can only delete your own reviews' }, { status: 403 });
    }

    const { error } = await supabase
      .from('movie_reviews')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting movie review:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
