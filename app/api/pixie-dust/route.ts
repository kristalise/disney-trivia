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
    const sailingId = searchParams.get('sailing_id');
    if (!sailingId) {
      return NextResponse.json({ error: 'sailing_id is required' }, { status: 400 });
    }

    // Get user's stateroom_numbers for this sailing
    const { data: sailing } = await supabase
      .from('sailing_reviews')
      .select('stateroom_numbers')
      .eq('id', sailingId)
      .eq('user_id', user.id)
      .single();

    if (!sailing || !sailing.stateroom_numbers || sailing.stateroom_numbers.length === 0) {
      return NextResponse.json({ dusted_by: [] });
    }

    // Find dust log entries where target_stateroom is in user's rooms
    const { data: dustLogs, error } = await supabase
      .from('pixie_dust_log')
      .select('id, duster_stateroom, gift_name, created_at')
      .eq('sailing_id', sailingId)
      .in('target_stateroom', sailing.stateroom_numbers)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ dusted_by: dustLogs ?? [] });
  } catch (error) {
    console.error('Error fetching dusted by:', error);
    return NextResponse.json({ error: 'Failed to fetch dusted by' }, { status: 500 });
  }
}
