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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sailingId = searchParams.get('sailing_id');

    if (!sailingId) {
      return NextResponse.json({ error: 'sailing_id is required' }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ companions: [], invites: [] });
    }

    const [companionsRes, invitesRes] = await Promise.all([
      supabase
        .from('sailing_companions')
        .select('id, companion_id, stateroom_number, created_at')
        .eq('sailing_id', sailingId),
      supabase
        .from('sailing_invites')
        .select('id, email, placeholder_name, stateroom_number, claimed_by, created_at')
        .eq('sailing_id', sailingId),
    ]);

    if (companionsRes.error) throw companionsRes.error;
    if (invitesRes.error) throw invitesRes.error;

    // Enrich companions with profile info
    const companions = companionsRes.data ?? [];
    const companionIds = companions.map(c => c.companion_id).filter(Boolean);
    let enrichedCompanions = companions;

    if (companionIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, avatar_url, handle')
        .in('id', companionIds);
      const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));
      enrichedCompanions = companions.map(c => ({
        ...c,
        display_name: profileMap[c.companion_id]?.display_name || 'Unknown',
        avatar_url: profileMap[c.companion_id]?.avatar_url || null,
        handle: profileMap[c.companion_id]?.handle || null,
      }));
    }

    return NextResponse.json({
      companions: enrichedCompanions,
      invites: invitesRes.data ?? [],
    });
  } catch (error) {
    console.error('Error fetching companions:', error);
    return NextResponse.json({ error: 'Failed to fetch companions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const { allowed } = checkRateLimit(`sailing-companion:${ip}`, 10);
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
    const { sailing_id, companion_id, stateroom_number } = body;

    if (!sailing_id || !companion_id) {
      return NextResponse.json({ error: 'sailing_id and companion_id are required' }, { status: 400 });
    }

    // Verify the user owns the sailing
    const { data: sailing } = await supabase
      .from('sailing_reviews')
      .select('user_id')
      .eq('id', sailing_id)
      .single();

    if (!sailing || sailing.user_id !== user.id) {
      return NextResponse.json({ error: 'You can only add companions to your own sailings' }, { status: 403 });
    }

    const insertData: Record<string, unknown> = { sailing_id, companion_id };
    if (stateroom_number != null) {
      insertData.stateroom_number = Number(stateroom_number);
    }

    const { data, error } = await supabase
      .from('sailing_companions')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'This user is already a companion on this sailing' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, companion: data });
  } catch (error) {
    console.error('Error adding companion:', error);
    return NextResponse.json({ error: 'Failed to add companion' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
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
    const { sailing_id, companion_id, stateroom_number } = body;

    if (!sailing_id || !companion_id) {
      return NextResponse.json({ error: 'sailing_id and companion_id are required' }, { status: 400 });
    }

    // Verify ownership
    const { data: sailing } = await supabase
      .from('sailing_reviews')
      .select('user_id')
      .eq('id', sailing_id)
      .single();

    if (!sailing || sailing.user_id !== user.id) {
      return NextResponse.json({ error: 'You can only update companions on your own sailings' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('sailing_companions')
      .update({ stateroom_number: stateroom_number != null ? Number(stateroom_number) : null })
      .eq('sailing_id', sailing_id)
      .eq('companion_id', companion_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, companion: data });
  } catch (error) {
    console.error('Error updating companion:', error);
    return NextResponse.json({ error: 'Failed to update companion' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
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
    const { sailing_id, companion_id } = body;

    if (!sailing_id || !companion_id) {
      return NextResponse.json({ error: 'sailing_id and companion_id are required' }, { status: 400 });
    }

    // Verify ownership
    const { data: sailing } = await supabase
      .from('sailing_reviews')
      .select('user_id')
      .eq('id', sailing_id)
      .single();

    if (!sailing || sailing.user_id !== user.id) {
      return NextResponse.json({ error: 'You can only remove companions from your own sailings' }, { status: 403 });
    }

    const { error } = await supabase
      .from('sailing_companions')
      .delete()
      .eq('sailing_id', sailing_id)
      .eq('companion_id', companion_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing companion:', error);
    return NextResponse.json({ error: 'Failed to remove companion' }, { status: 500 });
  }
}
