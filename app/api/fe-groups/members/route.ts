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
    const groupId = searchParams.get('group_id');
    if (!groupId) {
      return NextResponse.json({ error: 'group_id is required' }, { status: 400 });
    }

    // Verify user is a member of the group
    const { data: membership } = await supabase
      .from('fe_group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      // Check if user is creator
      const { data: group } = await supabase
        .from('fe_groups')
        .select('id')
        .eq('id', groupId)
        .eq('creator_id', user.id)
        .maybeSingle();

      if (!group) {
        return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });
      }
    }

    const { data: members, error } = await supabase
      .from('fe_group_members')
      .select('id, user_id, stateroom_number, display_name, joined_at')
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true });

    if (error) throw error;

    // Enrich with profiles
    const userIds = (members ?? []).map(m => m.user_id);
    let profiles: Record<string, { display_name: string; avatar_url: string | null; handle: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('id, display_name, avatar_url, handle')
        .in('id', userIds);

      for (const p of (profileData ?? [])) {
        profiles[p.id] = p;
      }
    }

    const enrichedMembers = (members ?? []).map(m => ({
      ...m,
      profile: profiles[m.user_id] || null,
    }));

    return NextResponse.json({ members: enrichedMembers });
  } catch (error) {
    console.error('Error fetching group members:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
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
    const { group_id, stateroom_number } = body;

    if (!group_id || !stateroom_number) {
      return NextResponse.json({ error: 'group_id and stateroom_number are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('fe_group_members')
      .update({ stateroom_number: Number(stateroom_number) })
      .eq('group_id', group_id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, member: data });
  } catch (error) {
    console.error('Error updating membership:', error);
    return NextResponse.json({ error: 'Failed to update membership' }, { status: 500 });
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

    const { error } = await supabase
      .from('fe_group_members')
      .delete()
      .eq('group_id', group_id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error leaving group:', error);
    return NextResponse.json({ error: 'Failed to leave group' }, { status: 500 });
  }
}
