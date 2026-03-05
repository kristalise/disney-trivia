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
    const characterId = searchParams.get('character_id');

    // Fetch own meetups (all or for a specific character)
    let ownQuery = supabase
      .from('character_meetups')
      .select('id, sailing_id, character_id, photo_url, notes, is_default, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (characterId) {
      ownQuery = ownQuery.eq('character_id', characterId);
    }

    const { data: ownMeetups, error: ownError } = await ownQuery;
    if (ownError) throw ownError;

    // Enrich with sailing info
    const sailingIds = [...new Set((ownMeetups ?? []).map(m => m.sailing_id))];
    let sailingMap: Record<string, { ship_name: string; sail_start_date: string; sail_end_date: string; itinerary_name: string | null }> = {};

    if (sailingIds.length > 0) {
      const { data: sailings } = await supabase
        .from('sailing_reviews')
        .select('id, ship_name, sail_start_date, sail_end_date, itinerary_name')
        .in('id', sailingIds);
      sailingMap = Object.fromEntries((sailings ?? []).map(s => [s.id, s]));
    }

    const enrichedMeetups = (ownMeetups ?? []).map(m => ({
      ...m,
      sailing: sailingMap[m.sailing_id] || null,
    }));

    // Fetch meetups where this user is tagged
    const { data: taggedRows, error: tagError } = await supabase
      .from('character_meetup_tags')
      .select('meetup_id')
      .eq('tagged_user_id', user.id);

    if (tagError) throw tagError;

    let taggedMeetups: Array<Record<string, unknown>> = [];
    if (taggedRows && taggedRows.length > 0) {
      const meetupIds = taggedRows.map(t => t.meetup_id);
      let taggedQuery = supabase
        .from('character_meetups')
        .select('id, sailing_id, character_id, photo_url, notes, is_default, created_at, user_id');

      if (characterId) {
        taggedQuery = taggedQuery.eq('character_id', characterId);
      }

      const { data: tagged, error: taggedError } = await taggedQuery.in('id', meetupIds);
      if (taggedError) throw taggedError;

      if (tagged && tagged.length > 0) {
        // Enrich tagged meetups with sailing info + tagger name
        const tagSailingIds = [...new Set(tagged.map(m => m.sailing_id))];
        const missingIds = tagSailingIds.filter(id => !sailingMap[id]);
        if (missingIds.length > 0) {
          const { data: moreSailings } = await supabase
            .from('sailing_reviews')
            .select('id, ship_name, sail_start_date, sail_end_date, itinerary_name')
            .in('id', missingIds);
          for (const s of (moreSailings ?? [])) {
            sailingMap[s.id] = s;
          }
        }

        const taggerIds = [...new Set(tagged.map(m => m.user_id))];
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, display_name')
          .in('id', taggerIds);
        const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

        taggedMeetups = tagged.map(m => ({
          ...m,
          tagged_by: profileMap[m.user_id]?.display_name || 'Someone',
          sailing: sailingMap[m.sailing_id] || null,
        }));
      }
    }

    return NextResponse.json({
      meetups: enrichedMeetups,
      tagged_meetups: taggedMeetups,
    });
  } catch (error) {
    console.error('Error fetching character meetups:', error);
    return NextResponse.json({ error: 'Failed to fetch character meetups' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const { allowed } = checkRateLimit(`character-meetup:${ip}`, 30);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
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
    const { sailing_id, character_id, photo_url, notes } = body;

    if (!sailing_id || !character_id) {
      return NextResponse.json({ error: 'sailing_id and character_id are required' }, { status: 400 });
    }

    const sanitizedCharacterId = stripHtml(String(character_id)).slice(0, 100);
    const sanitizedNotes = notes ? stripHtml(String(notes)).slice(0, 500) : null;
    const sanitizedPhotoUrl = photo_url ? String(photo_url).slice(0, 2000) : null;

    // Check if user already has meetups for this character (to determine is_default)
    const { data: existing } = await supabase
      .from('character_meetups')
      .select('id')
      .eq('user_id', user.id)
      .eq('character_id', sanitizedCharacterId);

    const isFirst = !existing || existing.length === 0;

    const { data, error } = await supabase
      .from('character_meetups')
      .upsert({
        user_id: user.id,
        sailing_id,
        character_id: sanitizedCharacterId,
        photo_url: sanitizedPhotoUrl,
        notes: sanitizedNotes,
        is_default: isFirst,
      }, { onConflict: 'user_id,sailing_id,character_id' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, meetup: data });
  } catch (error) {
    console.error('Error creating character meetup:', error);
    return NextResponse.json({ error: 'Failed to create character meetup' }, { status: 500 });
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
    const { id, set_default } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Fetch the meetup to verify ownership and get character_id
    const { data: meetup, error: fetchError } = await supabase
      .from('character_meetups')
      .select('id, user_id, character_id')
      .eq('id', id)
      .single();

    if (fetchError || !meetup) {
      return NextResponse.json({ error: 'Meetup not found' }, { status: 404 });
    }
    if (meetup.user_id !== user.id) {
      return NextResponse.json({ error: 'Not your meetup' }, { status: 403 });
    }

    if (set_default) {
      // Clear is_default on all meetups for this character, then set this one
      await supabase
        .from('character_meetups')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('character_id', meetup.character_id);

      const { data, error } = await supabase
        .from('character_meetups')
        .update({ is_default: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, meetup: data });
    }

    return NextResponse.json({ error: 'No valid update field provided' }, { status: 400 });
  } catch (error) {
    console.error('Error updating character meetup:', error);
    return NextResponse.json({ error: 'Failed to update character meetup' }, { status: 500 });
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
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Verify ownership and get character_id
    const { data: existing, error: fetchError } = await supabase
      .from('character_meetups')
      .select('id, user_id, character_id, is_default')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Meetup not found' }, { status: 404 });
    }
    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Not your meetup' }, { status: 403 });
    }

    const { error } = await supabase
      .from('character_meetups')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // If deleted meetup was the default, promote another one
    if (existing.is_default) {
      const { data: remaining } = await supabase
        .from('character_meetups')
        .select('id')
        .eq('user_id', user.id)
        .eq('character_id', existing.character_id)
        .order('created_at', { ascending: true })
        .limit(1);

      if (remaining && remaining.length > 0) {
        await supabase
          .from('character_meetups')
          .update({ is_default: true })
          .eq('id', remaining[0].id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting character meetup:', error);
    return NextResponse.json({ error: 'Failed to delete character meetup' }, { status: 500 });
  }
}
