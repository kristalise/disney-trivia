import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabase(authHeader?: string | null) {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    const authHeader = request.headers.get('Authorization');
    const supabase = getSupabase(authHeader);
    if (!supabase) {
      return NextResponse.json({ friends: [], met_on_ship: [], frequent_companions: [] });
    }

    // If no user_id, use authenticated user
    let targetUserId = userId;
    if (!targetUserId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
      }
      targetUserId = user.id;
    }

    // Get followers and following to compute mutual follows
    const [followersRes, followingRes] = await Promise.all([
      supabase.from('follows').select('follower_id').eq('following_id', targetUserId),
      supabase.from('follows').select('following_id').eq('follower_id', targetUserId),
    ]);

    const followerIds = new Set((followersRes.data ?? []).map(f => f.follower_id));
    const followingIds = new Set((followingRes.data ?? []).map(f => f.following_id));

    // Friends = mutual follows
    const friendIds = Array.from(followingIds).filter(id => followerIds.has(id));

    // Fetch friend profiles
    let friends: Array<{ id: string; display_name: string; avatar_url: string | null; handle: string | null; bio: string | null }> = [];
    if (friendIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, avatar_url, handle, bio')
        .in('id', friendIds);
      friends = profiles ?? [];
    }

    // Fetch met_on_ship records
    const { data: metRecords } = await supabase
      .from('met_on_ship')
      .select('id, user_a, user_b, ship_name, sail_date_overlap_start, sail_date_overlap_end')
      .or(`user_a.eq.${targetUserId},user_b.eq.${targetUserId}`);

    const metOnShip = (metRecords ?? []).map(r => ({
      ...r,
      other_user_id: r.user_a === targetUserId ? r.user_b : r.user_a,
    }));

    // Enrich met_on_ship with profiles
    const metUserIds = metOnShip.map(m => m.other_user_id).filter(id => !friendIds.includes(id));
    let metProfiles: Record<string, { display_name: string; avatar_url: string | null; handle: string | null }> = {};
    if (metUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, avatar_url, handle')
        .in('id', metUserIds);
      for (const p of (profiles ?? [])) {
        metProfiles[p.id] = p;
      }
    }
    // Also include friend profiles for met records
    for (const f of friends) {
      metProfiles[f.id] = f;
    }

    const enrichedMet = metOnShip.map(m => ({
      ...m,
      profile: metProfiles[m.other_user_id] || null,
    }));

    // Frequent travel companions: count co-occurrences across sailings
    const { data: userSailings } = await supabase
      .from('sailing_reviews')
      .select('id, ship_name, sail_start_date, sail_end_date')
      .eq('user_id', targetUserId);

    const companionCounts = new Map<string, number>();
    if (userSailings && userSailings.length > 0) {
      // Check sailing_companions for each sailing
      const { data: companions } = await supabase
        .from('sailing_companions')
        .select('sailing_id, companion_id')
        .in('sailing_id', userSailings.map(s => s.id));

      for (const c of (companions ?? [])) {
        companionCounts.set(c.companion_id, (companionCounts.get(c.companion_id) || 0) + 1);
      }
    }

    // Sort by count descending
    const companionEntries = Array.from(companionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    let frequentCompanions: Array<{ id: string; display_name: string; avatar_url: string | null; handle: string | null; shared_count: number }> = [];
    if (companionEntries.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, avatar_url, handle')
        .in('id', companionEntries.map(e => e[0]));

      const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));
      frequentCompanions = companionEntries
        .filter(([id]) => profileMap.has(id))
        .map(([id, count]) => ({
          ...profileMap.get(id)!,
          shared_count: count,
        }));
    }

    return NextResponse.json({
      friends,
      met_on_ship: enrichedMet,
      frequent_companions: frequentCompanions,
    });
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 });
  }
}
