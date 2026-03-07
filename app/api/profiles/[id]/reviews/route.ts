import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const REVIEW_TABLES = [
  'venue_reviews',
  'foodie_reviews',
  'dining_reviews',
  'activity_reviews',
  'stateroom_reviews',
  'movie_reviews',
  'sailing_reviews',
  'cruise_hack_reviews',
] as const;

type ReviewTable = (typeof REVIEW_TABLES)[number];

const TABLE_TO_TYPE: Record<ReviewTable, string> = {
  venue_reviews: 'venue',
  foodie_reviews: 'foodie',
  dining_reviews: 'dining',
  activity_reviews: 'activity',
  stateroom_reviews: 'stateroom',
  movie_reviews: 'movie',
  sailing_reviews: 'sailing',
  cruise_hack_reviews: 'hack',
};

const TYPE_TO_TABLE: Record<string, ReviewTable> = Object.fromEntries(
  Object.entries(TABLE_TO_TYPE).map(([k, v]) => [v, k as ReviewTable])
) as Record<string, ReviewTable>;

const TABLE_FIELDS: Record<ReviewTable, string> = {
  venue_reviews: 'id, venue_id, ship_name, rating, atmosphere_rating, theming_rating, review_text, created_at',
  foodie_reviews: 'id, venue_id, sailing_id, rating, review_text, created_at',
  dining_reviews: 'id, restaurant_id, ship_name, rating, review_text, created_at',
  activity_reviews: 'id, activity_id, ship_name, rating, review_text, created_at',
  stateroom_reviews: 'id, ship_name, stateroom_number, stateroom_rating, sailing_rating, review_text, created_at',
  movie_reviews: 'id, movie_id, rating, review_text, created_at',  // no ship_name column
  sailing_reviews: 'id, ship_name, overall_rating, service_rating, entertainment_rating, food_rating, review_text, sail_start_date, sail_end_date, created_at',
  cruise_hack_reviews: 'id, title, ship_name, rating, verdict, category, review_text, created_at',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    // Resolve user ID from handle or UUID
    const isUUID = UUID_REGEX.test(id);
    let userId = id;
    if (!isUUID) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('handle', id)
        .single();
      if (!profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }
      userId = profile.id;
    }

    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type') || 'all';
    const cursor = searchParams.get('cursor');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 50);

    // Determine which tables to query
    const tablesToQuery: ReviewTable[] = typeFilter === 'all'
      ? [...REVIEW_TABLES]
      : TYPE_TO_TABLE[typeFilter]
        ? [TYPE_TO_TABLE[typeFilter]]
        : [];

    if (tablesToQuery.length === 0) {
      return NextResponse.json({ reviews: [], next_cursor: null, total_count: 0 });
    }

    // Query all tables in parallel
    const results = await Promise.all(
      tablesToQuery.map(async (table) => {
        let query = supabase
          .from(table)
          .select(TABLE_FIELDS[table])
          .eq('user_id', userId);

        // For sailing_reviews, only include those with an overall_rating
        if (table === 'sailing_reviews') {
          query = query.not('overall_rating', 'is', null);
        }

        if (cursor) {
          query = query.lt('created_at', cursor);
        }

        query = query.order('created_at', { ascending: false }).limit(limit + 1);

        const { data, error } = await query;
        if (error) return [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data ?? []).map((row: any) => ({
          ...row,
          review_type: TABLE_TO_TYPE[table],
        }));
      })
    );

    // Resolve ship_name for foodie reviews via sailing_id join
    const foodieResults = results.flat().filter(
      (r) => r.review_type === 'foodie' && r.sailing_id
    );
    if (foodieResults.length > 0) {
      const sailingIds = [...new Set(foodieResults.map((r) => r.sailing_id as string))];
      const { data: sailings } = await supabase
        .from('sailing_reviews')
        .select('id, ship_name')
        .in('id', sailingIds);
      const sailingMap = new Map((sailings ?? []).map((s: { id: string; ship_name: string }) => [s.id, s.ship_name]));
      for (const r of foodieResults) {
        r.ship_name = sailingMap.get(r.sailing_id as string) ?? null;
      }
    }

    // Check if any table may have more rows beyond what we fetched
    const anyTableHasMore = results.some(r => r.length > limit);

    // Merge all results, sort by created_at DESC, trim each table to limit
    const allReviews = results
      .flatMap(r => r.slice(0, limit))
      .sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime());

    // Take limit items + check for more
    const page = allReviews.slice(0, limit);
    const hasMore = anyTableHasMore || allReviews.length > limit;
    const nextCursor = hasMore && page.length > 0
      ? (page[page.length - 1].created_at as string)
      : null;

    return NextResponse.json({
      reviews: page,
      next_cursor: nextCursor,
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
