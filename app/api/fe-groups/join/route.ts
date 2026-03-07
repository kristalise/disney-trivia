import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabase(authHeader?: string | null) {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
  });
}

function getAdminSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const { allowed } = checkRateLimit(`fe-join:${ip}`, 10);
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
    const { invite_code, stateroom_number } = body;

    if (!invite_code || !stateroom_number) {
      return NextResponse.json({ error: 'invite_code and stateroom_number are required' }, { status: 400 });
    }

    // Find group by invite code
    const { data: group, error: groupError } = await admin
      .from('fe_groups')
      .select('id, sailing_id, name')
      .eq('invite_code', String(invite_code).toUpperCase().trim())
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
    }

    // Check if already a member
    const { data: existing } = await admin
      .from('fe_group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Already a member of this group' }, { status: 409 });
    }

    // Join group
    const { data: membership, error } = await admin
      .from('fe_group_members')
      .insert({
        group_id: group.id,
        user_id: user.id,
        stateroom_number: Number(stateroom_number),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, group, membership });
  } catch (error) {
    console.error('Error joining FE group:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to join group: ${msg}` }, { status: 500 });
  }
}
