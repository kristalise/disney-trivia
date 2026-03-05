import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getVenueById } from '@/lib/unified-data';

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
      return NextResponse.json({ sailings: [] });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ sailings: [] });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venue_id');
    if (!venueId) {
      return NextResponse.json({ error: 'venue_id is required' }, { status: 400 });
    }

    // Look up venue to get its ships
    const venue = getVenueById(venueId);
    if (!venue) {
      return NextResponse.json({ sailings: [] });
    }

    const venueShips = venue.shipInstances.filter(si => si.current).map(si => si.ship);
    if (venueShips.length === 0) {
      return NextResponse.json({ sailings: [] });
    }

    // Fetch user's sailings on ships that have this venue
    const { data: sailings, error: sailingError } = await supabase
      .from('sailing_reviews')
      .select('id, ship_name, sail_start_date, itinerary_name')
      .eq('user_id', user.id)
      .in('ship_name', venueShips)
      .order('sail_start_date', { ascending: false });

    if (sailingError || !sailings || sailings.length === 0) {
      return NextResponse.json({ sailings: [] });
    }

    // Check which sailings already have a venue review for this venue
    const { data: existingReviews } = await supabase
      .from('venue_reviews')
      .select('sailing_id')
      .eq('user_id', user.id)
      .eq('venue_id', venueId);

    const reviewedSailingIds = new Set((existingReviews ?? []).map(r => r.sailing_id));

    const result = sailings.map(s => ({
      id: s.id,
      ship_name: s.ship_name,
      sail_start_date: s.sail_start_date,
      itinerary_name: s.itinerary_name,
      already_reviewed: reviewedSailingIds.has(s.id),
    }));

    return NextResponse.json({ sailings: result });
  } catch (error) {
    console.error('Error fetching eligible sailings:', error);
    return NextResponse.json({ error: 'Failed to fetch eligible sailings' }, { status: 500 });
  }
}
