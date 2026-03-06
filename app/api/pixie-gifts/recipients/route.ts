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

function extractRoomNumbers(text: string): number[] {
  const matches = text.match(/\b\d{4,5}\b/g);
  if (!matches) return [];
  return [...new Set(matches.map(Number))];
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
    const giftId = searchParams.get('gift_id');
    if (!giftId) {
      return NextResponse.json({ error: 'gift_id is required' }, { status: 400 });
    }

    // Verify ownership
    const { data: gift } = await supabase
      .from('pixie_gifts')
      .select('id, user_id, name, emoji, color, sailing_id')
      .eq('id', giftId)
      .single();

    if (!gift || gift.user_id !== user.id) {
      return NextResponse.json({ error: 'Gift not found or not yours' }, { status: 403 });
    }

    const { data: recipients, error } = await supabase
      .from('pixie_gift_recipients')
      .select('id, stateroom_number, delivered, delivered_at, notes')
      .eq('gift_id', giftId)
      .order('stateroom_number', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      recipients: recipients ?? [],
      gift: { id: gift.id, name: gift.name, emoji: gift.emoji, color: gift.color, sailing_id: gift.sailing_id },
    });
  } catch (error) {
    console.error('Error fetching recipients:', error);
    return NextResponse.json({ error: 'Failed to fetch recipients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const { allowed } = checkRateLimit(`pixie-recipient:${ip}`, 30);
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
    const { gift_id, stateroom_numbers, from_group, raw_text } = body;

    if (!gift_id) {
      return NextResponse.json({ error: 'gift_id is required' }, { status: 400 });
    }

    // Verify ownership
    const { data: gift } = await supabase
      .from('pixie_gifts')
      .select('id, user_id, sailing_id')
      .eq('id', gift_id)
      .single();

    if (!gift || gift.user_id !== user.id) {
      return NextResponse.json({ error: 'Gift not found or not yours' }, { status: 403 });
    }

    let roomNumbers: number[] = [];

    if (stateroom_numbers && Array.isArray(stateroom_numbers)) {
      // Mode 1: manual batch add
      roomNumbers = stateroom_numbers.map(Number).filter(n => !isNaN(n) && n >= 1000);
    } else if (from_group) {
      // Mode 2: import from FE group
      const { data: members } = await supabase
        .from('fe_group_members')
        .select('stateroom_number')
        .eq('group_id', from_group);

      roomNumbers = (members ?? []).map(m => m.stateroom_number);
    } else if (raw_text) {
      // Mode 3: paste-parse
      roomNumbers = extractRoomNumbers(String(raw_text));
    } else {
      return NextResponse.json({ error: 'Provide stateroom_numbers, from_group, or raw_text' }, { status: 400 });
    }

    if (roomNumbers.length === 0) {
      return NextResponse.json({ error: 'No valid stateroom numbers found' }, { status: 400 });
    }

    // Prevent self-delivery: filter out user's own stateroom(s)
    const { data: userSailing } = await supabase
      .from('sailing_reviews')
      .select('stateroom_numbers')
      .eq('id', gift.sailing_id)
      .eq('user_id', user.id)
      .single();

    const ownRooms = new Set((userSailing?.stateroom_numbers ?? []).map(Number));
    if (ownRooms.size > 0) {
      const filtered = roomNumbers.filter(n => !ownRooms.has(n));
      if (filtered.length === 0) {
        return NextResponse.json({ error: 'You cannot add your own stateroom for pixie dusting' }, { status: 400 });
      }
      roomNumbers = filtered;
    }

    // Insert recipients with ON CONFLICT DO NOTHING
    const inserts = roomNumbers.map(n => ({
      gift_id,
      stateroom_number: n,
    }));

    const { data: inserted, error } = await supabase
      .from('pixie_gift_recipients')
      .upsert(inserts, { onConflict: 'gift_id,stateroom_number', ignoreDuplicates: true })
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      added: (inserted ?? []).length,
      total_rooms: roomNumbers.length,
    });
  } catch (error) {
    console.error('Error adding recipients:', error);
    return NextResponse.json({ error: 'Failed to add recipients' }, { status: 500 });
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
    const { id, delivered } = body;
    if (!id || delivered === undefined) {
      return NextResponse.json({ error: 'id and delivered are required' }, { status: 400 });
    }

    // Get recipient + gift info
    const { data: recipient } = await supabase
      .from('pixie_gift_recipients')
      .select('id, gift_id, stateroom_number')
      .eq('id', id)
      .single();

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    const { data: gift } = await supabase
      .from('pixie_gifts')
      .select('id, user_id, sailing_id, name')
      .eq('id', recipient.gift_id)
      .single();

    if (!gift || gift.user_id !== user.id) {
      return NextResponse.json({ error: 'Not your gift' }, { status: 403 });
    }

    const updates: Record<string, unknown> = {
      delivered: Boolean(delivered),
      delivered_at: delivered ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from('pixie_gift_recipients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // On deliver: upsert pixie_dust_log
    if (delivered) {
      // Get duster's stateroom from sailing_reviews
      const { data: sailing } = await supabase
        .from('sailing_reviews')
        .select('stateroom_numbers, ship_name')
        .eq('id', gift.sailing_id)
        .eq('user_id', user.id)
        .single();

      const dusterStateroom = sailing?.stateroom_numbers?.[0];
      if (dusterStateroom) {
        await supabase.from('pixie_dust_log').upsert({
          duster_user_id: user.id,
          duster_stateroom: dusterStateroom,
          target_stateroom: recipient.stateroom_number,
          sailing_id: gift.sailing_id,
          ship_name: sailing.ship_name,
          gift_name: gift.name,
        }, { onConflict: 'duster_user_id,target_stateroom,sailing_id' });
      }
    }

    return NextResponse.json({ success: true, recipient: data });
  } catch (error) {
    console.error('Error updating delivery:', error);
    return NextResponse.json({ error: 'Failed to update delivery' }, { status: 500 });
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

    // Verify via gift ownership
    const { data: recipient } = await supabase
      .from('pixie_gift_recipients')
      .select('id, gift_id')
      .eq('id', id)
      .single();

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    const { data: gift } = await supabase
      .from('pixie_gifts')
      .select('user_id')
      .eq('id', recipient.gift_id)
      .single();

    if (!gift || gift.user_id !== user.id) {
      return NextResponse.json({ error: 'Not your gift' }, { status: 403 });
    }

    const { error } = await supabase
      .from('pixie_gift_recipients')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting recipient:', error);
    return NextResponse.json({ error: 'Failed to delete recipient' }, { status: 500 });
  }
}
