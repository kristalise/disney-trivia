import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limit';
import { findOverlappingSailings, canonicalUserOrder } from '@/lib/friendship-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabase(authHeader?: string | null) {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
  });
}

function getSupabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;
  return createClient(supabaseUrl, serviceKey);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const type = searchParams.get('type') || 'followers';

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ profiles: [], count: 0 });
    }

    let userIds: string[] = [];

    if (type === 'friends') {
      // Friends = mutual follows (intersection of followers and following)
      const [followerRes, followingRes] = await Promise.all([
        supabase.from('follows').select('follower_id').eq('following_id', userId),
        supabase.from('follows').select('following_id').eq('follower_id', userId),
      ]);
      const followerIds = new Set((followerRes.data ?? []).map(f => f.follower_id));
      const followingIds = (followingRes.data ?? []).map(f => f.following_id);
      userIds = followingIds.filter(id => followerIds.has(id));
    } else if (type === 'followers') {
      const { data } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', userId);
      userIds = (data ?? []).map(f => f.follower_id);
    } else {
      const { data } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);
      userIds = (data ?? []).map(f => f.following_id);
    }

    if (userIds.length === 0) {
      return NextResponse.json({ profiles: [], count: 0 });
    }

    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name, avatar_url, bio, home_port, favorite_ship, dcl_membership, handle')
      .in('id', userIds);

    return NextResponse.json({ profiles: profiles ?? [], count: userIds.length });
  } catch (error) {
    console.error('Error fetching follows:', error);
    return NextResponse.json({ error: 'Failed to fetch follows' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const { allowed } = checkRateLimit(`follow:${ip}`, 30);
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

    const body = await request.json();
    const { following_id, mutual } = body;

    if (!following_id) {
      return NextResponse.json({ error: 'following_id is required' }, { status: 400 });
    }
    if (following_id === user.id) {
      return NextResponse.json({ error: 'You cannot follow yourself' }, { status: 400 });
    }

    if (mutual) {
      // Insert both directions for instant friendship
      // Use admin client to bypass RLS (policy only allows follower_id = auth.uid())
      const admin = getSupabaseAdmin();
      if (!admin) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 503 });
      }
      const rows = [
        { follower_id: user.id, following_id },
        { follower_id: following_id, following_id: user.id },
      ];
      for (const row of rows) {
        const { error: insertErr } = await admin.from('follows').insert(row);
        if (insertErr && insertErr.code !== '23505') throw insertErr;
      }
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id });

      if (error) {
        if (error.code === '23505') {
          return NextResponse.json({ error: 'Already following this user' }, { status: 409 });
        }
        throw error;
      }
    }

    // Auto-link met_on_ship for mutual follows
    try {
      const { data: reverseFollow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', following_id)
        .eq('following_id', user.id)
        .maybeSingle();

      if (reverseFollow) {
        // Mutual follow detected — check for overlapping sailings
        const [sailingsA, sailingsB] = await Promise.all([
          supabase.from('sailing_reviews').select('id, user_id, ship_name, sail_start_date, sail_end_date').eq('user_id', user.id),
          supabase.from('sailing_reviews').select('id, user_id, ship_name, sail_start_date, sail_end_date').eq('user_id', following_id),
        ]);

        const overlaps = findOverlappingSailings(sailingsA.data ?? [], sailingsB.data ?? []);
        for (const overlap of overlaps) {
          const { user_a, user_b } = canonicalUserOrder(user.id, following_id);
          const sailing_id_a = user_a === user.id ? overlap.sailing_a.id : overlap.sailing_b.id;
          const sailing_id_b = user_a === user.id ? overlap.sailing_b.id : overlap.sailing_a.id;

          await supabase.from('met_on_ship').upsert({
            user_a,
            user_b,
            sailing_id_a,
            sailing_id_b,
            ship_name: overlap.ship_name,
            sail_date_overlap_start: overlap.overlap_start,
            sail_date_overlap_end: overlap.overlap_end,
          }, { onConflict: 'user_a,user_b' }).then(() => {});
        }
      }
    } catch (e) {
      console.error('Met-on-ship auto-link error (non-fatal):', e);
    }

    // Return updated counts
    const [followerCount, followingCount] = await Promise.all([
      supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', following_id),
      supabase.from('follows').select('id', { count: 'exact' }).eq('follower_id', user.id),
    ]);

    return NextResponse.json({
      success: true,
      follower_count: followerCount.count ?? 0,
      following_count: followingCount.count ?? 0,
    });
  } catch (error) {
    console.error('Error following user:', error);
    return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const { allowed } = checkRateLimit(`unfollow:${ip}`, 30);
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

    const body = await request.json();
    const { following_id, mutual } = body;

    if (!following_id) {
      return NextResponse.json({ error: 'following_id is required' }, { status: 400 });
    }

    if (mutual) {
      // Remove both directions (unfriend)
      // Use admin client to bypass RLS (policy only allows deleting own follows)
      const admin = getSupabaseAdmin();
      if (!admin) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 503 });
      }
      await Promise.all([
        admin.from('follows').delete().eq('follower_id', user.id).eq('following_id', following_id),
        admin.from('follows').delete().eq('follower_id', following_id).eq('following_id', user.id),
      ]);
    } else {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', following_id);

      if (error) throw error;
    }

    // Return updated counts
    const [followerCount, followingCount] = await Promise.all([
      supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', following_id),
      supabase.from('follows').select('id', { count: 'exact' }).eq('follower_id', user.id),
    ]);

    return NextResponse.json({
      success: true,
      follower_count: followerCount.count ?? 0,
      following_count: followingCount.count ?? 0,
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 });
  }
}
