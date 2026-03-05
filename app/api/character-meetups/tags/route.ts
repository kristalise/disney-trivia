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

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const { allowed } = checkRateLimit(`character-tag:${ip}`, 20);
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
    const { meetup_id, tagged_user_id } = body;

    if (!meetup_id || !tagged_user_id) {
      return NextResponse.json({ error: 'meetup_id and tagged_user_id are required' }, { status: 400 });
    }

    // Verify the user owns the meetup
    const { data: meetup } = await supabase
      .from('character_meetups')
      .select('user_id')
      .eq('id', meetup_id)
      .single();

    if (!meetup || meetup.user_id !== user.id) {
      return NextResponse.json({ error: 'You can only tag friends on your own meetups' }, { status: 403 });
    }

    // Cannot tag yourself
    if (tagged_user_id === user.id) {
      return NextResponse.json({ error: 'Cannot tag yourself' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('character_meetup_tags')
      .insert({ meetup_id, tagged_user_id })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'This user is already tagged on this meetup' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, tag: data });
  } catch (error) {
    console.error('Error tagging friend:', error);
    return NextResponse.json({ error: 'Failed to tag friend' }, { status: 500 });
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

    const { searchParams } = new URL(request.url);
    const meetupId = searchParams.get('meetup_id');
    const taggedUserId = searchParams.get('tagged_user_id');

    if (!meetupId || !taggedUserId) {
      return NextResponse.json({ error: 'meetup_id and tagged_user_id are required' }, { status: 400 });
    }

    // Verify the user owns the meetup
    const { data: meetup } = await supabase
      .from('character_meetups')
      .select('user_id')
      .eq('id', meetupId)
      .single();

    if (!meetup || meetup.user_id !== user.id) {
      return NextResponse.json({ error: 'You can only remove tags from your own meetups' }, { status: 403 });
    }

    const { error } = await supabase
      .from('character_meetup_tags')
      .delete()
      .eq('meetup_id', meetupId)
      .eq('tagged_user_id', taggedUserId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing tag:', error);
    return NextResponse.json({ error: 'Failed to remove tag' }, { status: 500 });
  }
}
