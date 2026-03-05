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

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const sailingId = searchParams.get('sailing_id');

    // Get groups user belongs to
    const { data: memberships } = await supabase
      .from('fe_group_members')
      .select('group_id')
      .eq('user_id', user.id);

    const memberGroupIds = (memberships ?? []).map(m => m.group_id);

    // Get groups user created
    let query = supabase
      .from('fe_groups')
      .select('id, sailing_id, creator_id, name, invite_code, created_at');

    if (sailingId) {
      query = query.eq('sailing_id', sailingId);
    }

    // Filter to groups user is creator or member of
    if (memberGroupIds.length > 0) {
      query = query.or(`creator_id.eq.${user.id},id.in.(${memberGroupIds.join(',')})`);
    } else {
      query = query.eq('creator_id', user.id);
    }

    const { data: groups, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    // Get member counts for each group
    const groupsWithCounts = await Promise.all((groups ?? []).map(async (g) => {
      const { count } = await supabase
        .from('fe_group_members')
        .select('id', { count: 'exact' })
        .eq('group_id', g.id);

      return { ...g, member_count: count ?? 0, is_creator: g.creator_id === user.id };
    }));

    return NextResponse.json({ groups: groupsWithCounts });
  } catch (error) {
    console.error('Error fetching FE groups:', error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const { allowed } = checkRateLimit(`fe-group:${ip}`, 10);
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
    const { sailing_id, name, stateroom_number } = body;

    if (!sailing_id || !name || !stateroom_number) {
      return NextResponse.json({ error: 'sailing_id, name, and stateroom_number are required' }, { status: 400 });
    }

    const sanitizedName = String(name).replace(/<[^>]*>/g, '').trim().slice(0, 100);
    if (!sanitizedName) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }

    // Generate unique invite code with retry
    let group = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const inviteCode = generateInviteCode();
      const { data, error } = await supabase
        .from('fe_groups')
        .insert({
          sailing_id,
          creator_id: user.id,
          name: sanitizedName,
          invite_code: inviteCode,
        })
        .select()
        .single();

      if (!error) {
        group = data;
        break;
      }
      // If unique constraint violation on invite_code, retry
      if (error.code === '23505' && error.message?.includes('invite_code')) {
        continue;
      }
      throw error;
    }

    if (!group) {
      return NextResponse.json({ error: 'Failed to generate unique invite code. Please try again.' }, { status: 500 });
    }

    // Auto-add creator as first member
    await supabase.from('fe_group_members').insert({
      group_id: group.id,
      user_id: user.id,
      stateroom_number: Number(stateroom_number),
    });

    return NextResponse.json({ success: true, group });
  } catch (error) {
    console.error('Error creating FE group:', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
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
    const { group_id } = body;
    if (!group_id) {
      return NextResponse.json({ error: 'group_id is required' }, { status: 400 });
    }

    // Verify creator
    const { data: group } = await supabase
      .from('fe_groups')
      .select('id, creator_id')
      .eq('id', group_id)
      .single();

    if (!group || group.creator_id !== user.id) {
      return NextResponse.json({ error: 'Only the creator can delete a group' }, { status: 403 });
    }

    const { error } = await supabase.from('fe_groups').delete().eq('id', group_id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting FE group:', error);
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}
