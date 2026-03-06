import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabase(authHeader?: string | null) {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
  });
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HANDLE_REGEX = /^[a-z0-9_]{3,30}$/;

const VALID_SHIPS = [
  'Disney Magic', 'Disney Wonder', 'Disney Dream', 'Disney Fantasy',
  'Disney Wish', 'Disney Treasure', 'Disney Destiny', 'Disney Adventure',
];

const VALID_DCL_MEMBERSHIPS = ['Silver Castaway', 'Gold Castaway', 'Platinum Castaway', 'Pearl Castaway'];

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '').trim();
}

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

    // Fetch profile — detect UUID vs handle
    const isUUID = UUID_REGEX.test(id);
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq(isUUID ? 'id' : 'handle', id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profileId = profile.id;

    // Fetch stats in parallel
    const [
      sailingReviews,
      stateroomCount,
      diningCount,
      activityCount,
      hacksCount,
      followerData,
      followingData,
    ] = await Promise.all([
      supabase.from('sailing_reviews')
        .select('id, ship_name, embarkation_port, overall_rating, service_rating, entertainment_rating, food_rating, sail_start_date, sail_end_date, itinerary_name, ports_of_call, stateroom_numbers, num_pax, cost_per_pax, review_text, created_at')
        .eq('user_id', profileId)
        .order('sail_start_date', { ascending: false }),
      supabase.from('stateroom_reviews').select('id', { count: 'exact' }).eq('user_id', profileId),
      supabase.from('dining_reviews').select('id', { count: 'exact' }).eq('user_id', profileId),
      supabase.from('activity_reviews').select('id', { count: 'exact' }).eq('user_id', profileId),
      supabase.from('cruise_hack_reviews').select('id', { count: 'exact' }).eq('user_id', profileId),
      supabase.from('follows').select('follower_id').eq('following_id', profileId),
      supabase.from('follows').select('following_id').eq('follower_id', profileId),
    ]);

    const sailings = sailingReviews.data ?? [];
    const uniqueShips = [...new Set(sailings.map(s => s.ship_name))];
    const uniquePorts = [...new Set(sailings.flatMap(s => {
      const ports: string[] = [];
      if (s.embarkation_port) ports.push(s.embarkation_port);
      if (s.ports_of_call) ports.push(...s.ports_of_call.split(', '));
      return ports;
    }))];

    const ratedSailings = sailings.filter(s => s.overall_rating != null);
    const avgRating = ratedSailings.length > 0
      ? Math.round((ratedSailings.reduce((sum, s) => sum + s.overall_rating, 0) / ratedSailings.length) * 10) / 10
      : null;

    const reviewCounts = {
      sailing: ratedSailings.length,
      stateroom: stateroomCount.count ?? 0,
      dining: diningCount.count ?? 0,
      activity: activityCount.count ?? 0,
      hacks: hacksCount.count ?? 0,
    };
    const totalReviews = Object.values(reviewCounts).reduce((s, v) => s + v, 0);

    // Get follower/following profiles
    const followerIds = (followerData.data ?? []).map(f => f.follower_id);
    const followingIds = (followingData.data ?? []).map(f => f.following_id);

    let followers: { id: string; display_name: string; avatar_url: string | null; handle: string | null }[] = [];
    let following: { id: string; display_name: string; avatar_url: string | null; handle: string | null }[] = [];

    if (followerIds.length > 0) {
      const { data } = await supabase
        .from('user_profiles')
        .select('id, display_name, avatar_url, handle')
        .in('id', followerIds);
      followers = data ?? [];
    }
    if (followingIds.length > 0) {
      const { data } = await supabase
        .from('user_profiles')
        .select('id, display_name, avatar_url, handle')
        .in('id', followingIds);
      following = data ?? [];
    }

    // Get recent reviews (last 10 across all types)
    const [recentDining, recentActivity, recentHacks, recentStateroom] = await Promise.all([
      supabase.from('dining_reviews')
        .select('id, restaurant_id, ship_name, rating, created_at')
        .eq('user_id', profileId).order('created_at', { ascending: false }).limit(10),
      supabase.from('activity_reviews')
        .select('id, activity_id, ship_name, rating, created_at')
        .eq('user_id', profileId).order('created_at', { ascending: false }).limit(10),
      supabase.from('cruise_hack_reviews')
        .select('id, title, ship_name, rating, verdict, category, created_at')
        .eq('user_id', profileId).order('created_at', { ascending: false }).limit(10),
      supabase.from('stateroom_reviews')
        .select('id, ship_name, stateroom_number, stateroom_rating, created_at')
        .eq('user_id', profileId).order('created_at', { ascending: false }).limit(10),
    ]);

    const recentReviews = [
      ...(recentDining.data ?? []).map(r => ({ ...r, type: 'dining' as const })),
      ...(recentActivity.data ?? []).map(r => ({ ...r, type: 'activity' as const })),
      ...(recentHacks.data ?? []).map(r => ({ ...r, type: 'hack' as const })),
      ...(recentStateroom.data ?? []).map(r => ({ ...r, type: 'stateroom' as const })),
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    return NextResponse.json({
      profile,
      stats: {
        total_sailings: sailings.length,
        unique_ships: uniqueShips.length,
        unique_ports: uniquePorts.length,
        avg_rating: avgRating,
        total_reviews: totalReviews,
        review_counts: reviewCounts,
      },
      sailings,
      followers,
      following,
      follower_count: followerIds.length,
      following_count: followingIds.length,
      recent_reviews: recentReviews,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const { allowed } = checkRateLimit(`profile-update:${ip}`, 10);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
    }

    const authHeader = request.headers.get('Authorization');
    const supabase = getSupabase(authHeader);
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    // Resolve profile ID if handle was used
    const isUUID = UUID_REGEX.test(id);
    const profileId = isUUID ? id : (await supabase.from('user_profiles').select('id').eq('handle', id).single()).data?.id;

    if (!profileId || user.id !== profileId) {
      return NextResponse.json({ error: 'You can only update your own profile.' }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.display_name !== undefined) {
      const name = stripHtml(String(body.display_name)).slice(0, 50);
      if (!name) {
        return NextResponse.json({ error: 'Display name is required (1-50 characters)' }, { status: 400 });
      }
      updates.display_name = name;
    }
    if (body.bio !== undefined) {
      if (body.bio && String(body.bio).length > 500) {
        return NextResponse.json({ error: 'Bio must be 500 characters or less' }, { status: 400 });
      }
      updates.bio = body.bio ? stripHtml(String(body.bio)).slice(0, 500) : null;
    }
    if (body.home_port !== undefined) {
      updates.home_port = body.home_port ? stripHtml(String(body.home_port)).slice(0, 100) : null;
    }
    if (body.favorite_ship !== undefined) {
      if (body.favorite_ship && !VALID_SHIPS.includes(body.favorite_ship)) {
        return NextResponse.json({ error: 'Invalid ship name' }, { status: 400 });
      }
      updates.favorite_ship = body.favorite_ship || null;
    }
    if (body.dcl_membership !== undefined) {
      if (body.dcl_membership && !VALID_DCL_MEMBERSHIPS.includes(body.dcl_membership)) {
        return NextResponse.json({ error: 'Invalid DCL membership level' }, { status: 400 });
      }
      updates.dcl_membership = body.dcl_membership || null;
    }
    if (body.avatar_url !== undefined) {
      updates.avatar_url = body.avatar_url ? String(body.avatar_url).slice(0, 500) : null;
    }
    if (body.show_trivia_stats !== undefined) {
      updates.show_trivia_stats = Boolean(body.show_trivia_stats);
    }
    if (body.handle !== undefined) {
      const handle = String(body.handle).toLowerCase().trim();
      if (!HANDLE_REGEX.test(handle)) {
        return NextResponse.json({ error: 'Handle must be 3-30 characters, lowercase letters, numbers, and underscores only.' }, { status: 400 });
      }
      updates.handle = handle;
    }
    for (const field of ['instagram_url', 'tiktok_url', 'youtube_url', 'facebook_url'] as const) {
      if (body[field] !== undefined) {
        if (body[field] && !String(body[field]).startsWith('https://')) {
          return NextResponse.json({ error: `${field} must start with https://` }, { status: 400 });
        }
        updates[field] = body[field] ? stripHtml(String(body[field])).slice(0, 500) : null;
      }
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      if (error.code === '23505' && error.message?.includes('handle')) {
        return NextResponse.json({ error: 'This handle is already taken.' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, profile: data });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
