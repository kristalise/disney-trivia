import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Auth client — uses anon key + user's JWT for auth.getUser() */
function getSupabase(authHeader?: string | null) {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
  });
}

/** Admin client — uses service role key to bypass RLS for data queries */
function getAdminSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** Check if a Supabase error means the table doesn't exist */
function isTableMissing(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  if (err.code === '42P01') return true;
  const msg = (err.message || '').toLowerCase();
  return msg.includes('does not exist') || msg.includes('relation') || msg.includes('undefined_table');
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

    // Use admin client for data queries to bypass broken RLS circular policies
    const admin = getAdminSupabase();
    if (!admin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const sailingId = searchParams.get('sailing_id');

    // Get groups user belongs to
    const { data: memberships, error: memberErr } = await admin
      .from('fe_group_members')
      .select('group_id')
      .eq('user_id', user.id);

    if (memberErr) {
      console.error('Error querying fe_group_members:', JSON.stringify(memberErr));
      if (isTableMissing(memberErr)) {
        return NextResponse.json({ groups: [], _warning: 'fe_group_members table not found — run migration-pixie-dusting.sql' });
      }
      return NextResponse.json({ error: `FE members query failed: ${memberErr.message} (code: ${memberErr.code})` }, { status: 500 });
    }

    const memberGroupIds = (memberships ?? []).map(m => m.group_id);

    // Get groups user created or is a member of
    let query = admin
      .from('fe_groups')
      .select('id, sailing_id, creator_id, name, invite_code, created_at');

    if (sailingId) {
      query = query.eq('sailing_id', sailingId);
    }

    if (memberGroupIds.length > 0) {
      query = query.or(`creator_id.eq.${user.id},id.in.(${memberGroupIds.join(',')})`);
    } else {
      query = query.eq('creator_id', user.id);
    }

    const { data: groups, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.error('Error querying fe_groups:', JSON.stringify(error));
      if (isTableMissing(error)) {
        return NextResponse.json({ groups: [], _warning: 'fe_groups table not found — run migration-pixie-dusting.sql' });
      }
      return NextResponse.json({ error: `FE groups query failed: ${error.message} (code: ${error.code})` }, { status: 500 });
    }

    // Get member counts — batch by querying all relevant group_ids at once
    const groupIds = (groups ?? []).map(g => g.id);
    let memberCounts: Record<string, number> = {};
    if (groupIds.length > 0) {
      const { data: allMembers } = await admin
        .from('fe_group_members')
        .select('group_id')
        .in('group_id', groupIds);

      for (const m of (allMembers ?? [])) {
        memberCounts[m.group_id] = (memberCounts[m.group_id] || 0) + 1;
      }
    }

    const groupsWithCounts = (groups ?? []).map(g => ({
      ...g,
      member_count: memberCounts[g.id] || 0,
      is_creator: g.creator_id === user.id,
    }));

    return NextResponse.json({ groups: groupsWithCounts });
  } catch (error) {
    console.error('Error fetching FE groups:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Failed to fetch groups: ${msg}` }, { status: 500 });
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

    const admin = getAdminSupabase();
    if (!admin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 503 });
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
      const { data, error } = await admin
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
    const { error: memberErr } = await admin.from('fe_group_members').insert({
      group_id: group.id,
      user_id: user.id,
      stateroom_number: Number(stateroom_number),
    });

    if (memberErr) {
      console.error('Error adding creator as member:', memberErr);
      await admin.from('fe_groups').delete().eq('id', group.id);
      return NextResponse.json({ error: `Failed to add you as a member: ${memberErr.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, group });
  } catch (error) {
    console.error('Error creating FE group:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to create group: ${msg}` }, { status: 500 });
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

    const admin = getAdminSupabase();
    if (!admin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 503 });
    }

    const body = await request.json();
    const { group_id } = body;
    if (!group_id) {
      return NextResponse.json({ error: 'group_id is required' }, { status: 400 });
    }

    // Verify creator
    const { data: group } = await admin
      .from('fe_groups')
      .select('id, creator_id')
      .eq('id', group_id)
      .single();

    if (!group || group.creator_id !== user.id) {
      return NextResponse.json({ error: 'Only the creator can delete a group' }, { status: 403 });
    }

    const { error } = await admin.from('fe_groups').delete().eq('id', group_id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting FE group:', error);
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}
