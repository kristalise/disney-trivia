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

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '').trim();
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const { allowed } = checkRateLimit(`sailing-invite:${ip}`, 10);
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
    const { sailing_id, email, placeholder_name, stateroom_number } = body;

    if (!sailing_id) {
      return NextResponse.json({ error: 'sailing_id is required' }, { status: 400 });
    }

    // Must have at least one of email or placeholder_name
    if (!email && !placeholder_name) {
      return NextResponse.json({ error: 'At least one of email or placeholder_name is required' }, { status: 400 });
    }

    let sanitizedEmail: string | null = null;
    if (email) {
      sanitizedEmail = stripHtml(String(email)).toLowerCase().slice(0, 254);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
        return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
      }
    }

    const sanitizedName = placeholder_name ? stripHtml(String(placeholder_name)).slice(0, 100) : null;

    // Verify the user owns the sailing
    const { data: sailing } = await supabase
      .from('sailing_reviews')
      .select('user_id')
      .eq('id', sailing_id)
      .single();

    if (!sailing || sailing.user_id !== user.id) {
      return NextResponse.json({ error: 'You can only invite to your own sailings' }, { status: 403 });
    }

    const insertData: Record<string, unknown> = { sailing_id, invited_by: user.id };
    if (sanitizedEmail) insertData.email = sanitizedEmail;
    if (sanitizedName) insertData.placeholder_name = sanitizedName;
    if (stateroom_number != null) insertData.stateroom_number = Number(stateroom_number);

    const { data, error } = await supabase
      .from('sailing_invites')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'This email has already been invited to this sailing' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, invite: data });
  } catch (error) {
    console.error('Error creating invite:', error);
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
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
    const { sailing_id, email, invite_id } = body;

    // Support deletion by invite_id (for placeholders without email) or by sailing_id + email (legacy)
    if (!invite_id && (!sailing_id || !email)) {
      return NextResponse.json({ error: 'invite_id or (sailing_id and email) is required' }, { status: 400 });
    }

    if (invite_id) {
      // Verify ownership by checking invited_by
      const { data: invite } = await supabase
        .from('sailing_invites')
        .select('invited_by')
        .eq('id', invite_id)
        .single();

      if (!invite || invite.invited_by !== user.id) {
        return NextResponse.json({ error: 'You can only remove your own invites' }, { status: 403 });
      }

      const { error } = await supabase
        .from('sailing_invites')
        .delete()
        .eq('id', invite_id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('sailing_invites')
        .delete()
        .eq('sailing_id', sailing_id)
        .eq('email', String(email).toLowerCase())
        .eq('invited_by', user.id);

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing invite:', error);
    return NextResponse.json({ error: 'Failed to remove invite' }, { status: 500 });
  }
}
