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
    const sailingId = searchParams.get('sailing_id');

    if (!sailingId) {
      return NextResponse.json({ error: 'sailing_id query parameter is required' }, { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    const supabase = getSupabase(authHeader);
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('adventure_rotations')
      .select('rotation')
      .eq('user_id', user.id)
      .eq('sailing_id', sailingId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found

    return NextResponse.json({ rotation: data?.rotation ?? null });
  } catch (error) {
    console.error('Error fetching adventure rotation:', error);
    return NextResponse.json({ error: 'Failed to fetch rotation' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const supabase = getSupabase(authHeader);
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { sailing_id, rotation } = body;

    if (!sailing_id || !rotation) {
      return NextResponse.json({ error: 'sailing_id and rotation are required' }, { status: 400 });
    }

    const rotationNum = Number(rotation);
    if (rotationNum !== 1 && rotationNum !== 2) {
      return NextResponse.json({ error: 'Rotation must be 1 or 2' }, { status: 400 });
    }

    // Verify the sailing exists
    const { data: sailing, error: sailingError } = await supabase
      .from('sailing_reviews')
      .select('id')
      .eq('id', sailing_id)
      .single();

    if (sailingError || !sailing) {
      return NextResponse.json({ error: 'Sailing not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('adventure_rotations')
      .upsert({
        user_id: user.id,
        sailing_id,
        rotation: rotationNum,
      }, { onConflict: 'user_id,sailing_id' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, rotation: data });
  } catch (error) {
    console.error('Error setting adventure rotation:', error);
    return NextResponse.json({ error: 'Failed to set rotation' }, { status: 500 });
  }
}
