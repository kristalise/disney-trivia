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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('Authorization');
    const supabase = getSupabase(authHeader);
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    // Verify the sailing exists and belongs to the user
    const { data: sailing, error: sailingError } = await supabase
      .from('sailing_reviews')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (sailingError || !sailing) {
      return NextResponse.json({ error: 'Sailing not found' }, { status: 404 });
    }
    if (sailing.user_id !== user.id) {
      return NextResponse.json({ error: 'Not your sailing' }, { status: 403 });
    }

    // Parallel-fetch from all review tables for this sailing
    const [diningRes, stateroomRes, activityRes, venueRes, plannerRes] = await Promise.all([
      supabase
        .from('dining_reviews')
        .select('id, restaurant_id, rating, review_text')
        .eq('sailing_id', id)
        .eq('user_id', user.id),
      supabase
        .from('stateroom_reviews')
        .select('id, stateroom_number, stateroom_rating, review_text')
        .eq('sailing_id', id)
        .eq('user_id', user.id),
      supabase
        .from('activity_reviews')
        .select('id, activity_id, rating, review_text')
        .eq('sailing_id', id)
        .eq('user_id', user.id),
      supabase
        .from('venue_reviews')
        .select('id, venue_id, rating, review_text')
        .eq('sailing_id', id)
        .eq('user_id', user.id),
      supabase
        .from('planner_items')
        .select('id, item_type, item_id, checked, notes')
        .eq('sailing_id', id)
        .eq('user_id', user.id),
    ]);

    return NextResponse.json({
      dining: diningRes.data ?? [],
      stateroom: stateroomRes.data ?? [],
      activity: activityRes.data ?? [],
      venue: venueRes.data ?? [],
      planner: plannerRes.data ?? [],
    });
  } catch (error) {
    console.error('Error fetching sailing reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
