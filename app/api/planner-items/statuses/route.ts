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
      return NextResponse.json({ statuses: {} });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ statuses: {} });
    }

    // Fetch all planner items for this user across all sailings
    const { data: items, error: itemsError } = await supabase
      .from('planner_items')
      .select('item_type, item_id, checked, sailing_id')
      .eq('user_id', user.id);

    if (itemsError) throw itemsError;

    // Fetch reviews across all review types for cross-referencing
    const [foodieRes, venueRes, activityRes, diningRes] = await Promise.all([
      supabase.from('foodie_reviews').select('venue_id, sailing_id').eq('user_id', user.id),
      supabase.from('venue_reviews').select('venue_id, sailing_id').eq('user_id', user.id),
      supabase.from('activity_reviews').select('activity_id, sailing_id').eq('user_id', user.id),
      supabase.from('dining_reviews').select('restaurant_id, sailing_id').eq('user_id', user.id),
    ]);

    // Build reviewed sets per item_type
    const reviewedSets: Record<string, Set<string>> = {
      dining: new Set([
        ...(foodieRes.data ?? []).map(r => `${r.venue_id}:${r.sailing_id}`),
        ...(diningRes.data ?? []).map(r => `${r.restaurant_id}:${r.sailing_id}`),
      ]),
      venue: new Set(
        (venueRes.data ?? []).map(r => `${r.venue_id}:${r.sailing_id}`)
      ),
      activity: new Set(
        (activityRes.data ?? []).map(r => `${r.activity_id}:${r.sailing_id}`)
      ),
    };

    // Aggregate status per unique item_type:item_id
    const itemMap = new Map<string, { hasUnchecked: boolean; hasPendingReview: boolean; hasReview: boolean }>();

    for (const item of (items ?? [])) {
      const key = `${item.item_type}:${item.item_id}`;
      if (!itemMap.has(key)) {
        itemMap.set(key, { hasUnchecked: false, hasPendingReview: false, hasReview: false });
      }
      const entry = itemMap.get(key)!;

      const reviewSet = reviewedSets[item.item_type];
      if (reviewSet) {
        const isReviewed = reviewSet.has(`${item.item_id}:${item.sailing_id}`);
        if (isReviewed) {
          entry.hasReview = true;
        } else if (item.checked) {
          entry.hasPendingReview = true;
        } else {
          entry.hasUnchecked = true;
        }
      } else {
        // Item types without review systems (stateroom, character, entertainment, shopping)
        if (!item.checked) {
          entry.hasUnchecked = true;
        }
      }
    }

    // Compute final status per item
    const statuses: Record<string, string> = {};
    for (const [key, entry] of itemMap) {
      if (entry.hasPendingReview) {
        statuses[key] = 'to-review';
      } else if (entry.hasUnchecked) {
        statuses[key] = 'added';
      } else if (entry.hasReview) {
        statuses[key] = 'reviewed';
      } else {
        statuses[key] = 'added';
      }
    }

    return NextResponse.json({ statuses });
  } catch (error) {
    console.error('Error fetching planner statuses:', error);
    return NextResponse.json({ statuses: {} });
  }
}
