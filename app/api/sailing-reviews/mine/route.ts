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
      return NextResponse.json({ sailings: [] });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const sailingFields = 'id, ship_name, sail_start_date, sail_end_date, itinerary_name, embarkation_port, ports_of_call, disembarkation_port, stateroom_numbers, num_pax, cost_per_pax, overall_rating, service_rating, entertainment_rating, food_rating';

    // Fetch owned sailings
    const { data: ownedSailings, error } = await supabase
      .from('sailing_reviews')
      .select(sailingFields)
      .eq('user_id', user.id)
      .order('sail_start_date', { ascending: false });

    if (error) throw error;

    // Fetch sailings where user is a companion (guest)
    const { data: companionRecords, error: compError } = await supabase
      .from('sailing_companions')
      .select('sailing_id, stateroom_number')
      .eq('companion_id', user.id);

    // If sailing_companions table doesn't exist yet, just skip guest sailings
    if (compError) {
      console.warn('sailing_companions query failed (table may not exist):', compError.message);
      const allSailings = (ownedSailings ?? []).map(s => ({ ...s, role: 'owner' as const }))
        .sort((a, b) => String(b.sail_start_date).localeCompare(String(a.sail_start_date)));
      return NextResponse.json({ sailings: allSailings });
    }

    let guestSailings: Array<Record<string, unknown>> = [];
    if (companionRecords && companionRecords.length > 0) {
      const guestSailingIds = companionRecords.map(c => c.sailing_id);
      const { data: guestData, error: guestError } = await supabase
        .from('sailing_reviews')
        .select(sailingFields)
        .in('id', guestSailingIds);

      if (guestError) throw guestError;

      const stateroomMap = new Map(companionRecords.map(c => [c.sailing_id, c.stateroom_number]));
      guestSailings = (guestData ?? []).map(s => ({
        ...s,
        role: 'guest' as const,
        guest_stateroom_number: stateroomMap.get(s.id) ?? null,
      }));
    }

    // Merge owned + guest, sort by date descending
    const allSailings = [
      ...(ownedSailings ?? []).map(s => ({ ...s, role: 'owner' as const })),
      ...guestSailings,
    ].sort((a, b) => String(b.sail_start_date).localeCompare(String(a.sail_start_date)));

    return NextResponse.json({ sailings: allSailings });
  } catch (error) {
    console.error('Error fetching user sailings:', error);
    return NextResponse.json({ error: 'Failed to fetch sailings' }, { status: 500 });
  }
}
