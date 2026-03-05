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

const VALID_SHIPS = [
  'Disney Magic', 'Disney Wonder', 'Disney Dream', 'Disney Fantasy',
  'Disney Wish', 'Disney Treasure', 'Disney Destiny', 'Disney Adventure',
];

const VALID_DCL_MEMBERSHIPS = ['Silver Castaway', 'Gold Castaway', 'Platinum Castaway'];

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '').trim();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'newest';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ profiles: [], total: 0 });
    }

    // Fetch profiles
    let query = supabase
      .from('user_profiles')
      .select('id, display_name, avatar_url, bio, home_port, favorite_ship, dcl_membership, handle, created_at', { count: 'exact' });

    if (search) {
      query = query.ilike('display_name', `%${search}%`);
    }

    if (sort === 'alphabetical') {
      query = query.order('display_name', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: profiles, error, count } = await query;
    if (error) throw error;

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ profiles: [], total: 0 });
    }

    const userIds = profiles.map(p => p.id);

    // Batch fetch stats for all profiles
    const [sailingCounts, reviewCounts, followerCounts, followingCounts] = await Promise.all([
      // Sailing counts
      supabase.from('sailing_reviews').select('user_id').in('user_id', userIds),
      // Total review counts across all tables
      Promise.all([
        supabase.from('sailing_reviews').select('user_id').in('user_id', userIds),
        supabase.from('stateroom_reviews').select('user_id').in('user_id', userIds),
        supabase.from('dining_reviews').select('user_id').in('user_id', userIds),
        supabase.from('activity_reviews').select('user_id').in('user_id', userIds),
        supabase.from('cruise_hack_reviews').select('user_id').in('user_id', userIds),
      ]),
      // Follower counts
      supabase.from('follows').select('following_id').in('following_id', userIds),
      // Following counts
      supabase.from('follows').select('follower_id').in('follower_id', userIds),
    ]);

    // Build count maps
    const sailingCountMap: Record<string, number> = {};
    (sailingCounts.data ?? []).forEach(r => {
      sailingCountMap[r.user_id] = (sailingCountMap[r.user_id] || 0) + 1;
    });

    const reviewCountMap: Record<string, number> = {};
    reviewCounts.forEach(result => {
      (result.data ?? []).forEach((r: { user_id: string }) => {
        reviewCountMap[r.user_id] = (reviewCountMap[r.user_id] || 0) + 1;
      });
    });

    const followerCountMap: Record<string, number> = {};
    (followerCounts.data ?? []).forEach(r => {
      followerCountMap[r.following_id] = (followerCountMap[r.following_id] || 0) + 1;
    });

    const followingCountMap: Record<string, number> = {};
    (followingCounts.data ?? []).forEach(r => {
      followingCountMap[r.follower_id] = (followingCountMap[r.follower_id] || 0) + 1;
    });

    let enrichedProfiles = profiles.map(p => ({
      ...p,
      sailing_count: sailingCountMap[p.id] || 0,
      review_count: reviewCountMap[p.id] || 0,
      follower_count: followerCountMap[p.id] || 0,
      following_count: followingCountMap[p.id] || 0,
    }));

    // Sort by stats if requested (DB sort handled newest/alphabetical)
    if (sort === 'sailings') {
      enrichedProfiles.sort((a, b) => b.sailing_count - a.sailing_count);
    } else if (sort === 'reviews') {
      enrichedProfiles.sort((a, b) => b.review_count - a.review_count);
    }

    return NextResponse.json({ profiles: enrichedProfiles, total: count ?? 0 });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const { allowed } = checkRateLimit(`profile-upsert:${ip}`, 10);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
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

    const body = await request.json();
    const { display_name, bio, home_port, favorite_ship, dcl_membership, handle } = body;

    // Validate
    const name = display_name ? stripHtml(String(display_name)).slice(0, 50) : '';
    if (!name) {
      return NextResponse.json({ error: 'Display name is required (1-50 characters)' }, { status: 400 });
    }
    if (bio && String(bio).length > 500) {
      return NextResponse.json({ error: 'Bio must be 500 characters or less' }, { status: 400 });
    }
    if (favorite_ship && !VALID_SHIPS.includes(favorite_ship)) {
      return NextResponse.json({ error: 'Invalid ship name' }, { status: 400 });
    }
    if (dcl_membership && !VALID_DCL_MEMBERSHIPS.includes(dcl_membership)) {
      return NextResponse.json({ error: 'Invalid DCL membership level' }, { status: 400 });
    }

    // Generate handle from email if not provided
    const profileHandle = handle
      ? String(handle).toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30)
      : (user.email?.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30);

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        display_name: name,
        bio: bio ? stripHtml(String(bio)).slice(0, 500) : null,
        home_port: home_port ? stripHtml(String(home_port)).slice(0, 100) : null,
        favorite_ship: favorite_ship || null,
        dcl_membership: dcl_membership || null,
        handle: profileHandle || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, profile: data });
  } catch (error) {
    console.error('Error upserting profile:', error);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }
}
