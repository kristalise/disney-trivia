import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { getSupabase, VALID_SHIPS, stripHtml, requireAuth, enrichWithProfiles } from '@/lib/review-api-utils';

const VALID_CATEGORIES = [
  'Embarkation', 'Dining', 'Packing', 'Saving Money', 'Kids', 'First-Time',
];

const VALID_VERDICTS = ['Must Try', 'Worth It', 'Skip It'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ship = searchParams.get('ship');
    const category = searchParams.get('category');

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ reviews: [], totalReviews: 0, verdictBreakdown: {} });
    }

    let query = supabase
      .from('cruise_hack_reviews')
      .select('id, ship_name, category, title, hack_text, verdict, rating, review_text, user_id, created_at')
      .order('rating', { ascending: false });

    if (ship) {
      query = query.or(`ship_name.eq.${ship},ship_name.is.null`);
    }
    if (category) {
      query = query.eq('category', category);
    }

    const { data: reviews, error } = await query;
    if (error) throw error;

    const totalReviews = reviews?.length ?? 0;

    // Verdict breakdown
    const verdictBreakdown: Record<string, number> = { 'Must Try': 0, 'Worth It': 0, 'Skip It': 0 };
    reviews?.forEach((r) => {
      if (r.verdict in verdictBreakdown) {
        verdictBreakdown[r.verdict]++;
      }
    });

    // Enrich with reviewer profiles
    const enrichedReviews = await enrichWithProfiles(supabase, reviews ?? []);

    return NextResponse.json({ reviews: enrichedReviews, totalReviews, verdictBreakdown });
  } catch (error) {
    console.error('Error fetching cruise hacks:', error);
    return NextResponse.json({ error: 'Failed to fetch hacks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const { allowed } = checkRateLimit(`cruise-hack:${ip}`, 10);
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
    const { ship_name, category, title, hack_text, verdict, rating, review_text } = body;

    if (!category || !title || !hack_text || !verdict || !rating) {
      return NextResponse.json({ error: 'Category, title, hack text, verdict, and rating are required' }, { status: 400 });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }
    if (!VALID_VERDICTS.includes(verdict)) {
      return NextResponse.json({ error: 'Invalid verdict' }, { status: 400 });
    }

    if (ship_name && !VALID_SHIPS.includes(ship_name)) {
      return NextResponse.json({ error: 'Invalid ship name' }, { status: 400 });
    }

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('cruise_hack_reviews')
      .insert({
        user_id: user.id,
        ship_name: ship_name || null,
        category,
        title: stripHtml(String(title)).slice(0, 200),
        hack_text: stripHtml(String(hack_text)).slice(0, 2000),
        verdict,
        rating: ratingNum,
        review_text: review_text ? stripHtml(String(review_text)).slice(0, 1000) : null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Hack submitted successfully!', review: data });
  } catch (error) {
    console.error('Error submitting cruise hack:', error);
    return NextResponse.json({ error: 'Failed to submit hack' }, { status: 500 });
  }
}
