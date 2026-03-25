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

    // Get ship_name from sailing_reviews
    const { data: sailingInfo } = await supabase
      .from('sailing_reviews')
      .select('ship_name, sail_end_date')
      .eq('id', sailingId)
      .eq('user_id', user.id)
      .single();
    const shipName = sailingInfo?.ship_name ?? null;
    const sailEndDate = sailingInfo?.sail_end_date ?? null;

    const { data: gifts, error } = await supabase
      .from('pixie_gifts')
      .select('id, sailing_id, name, emoji, color, sort_order, created_at')
      .eq('user_id', user.id)
      .eq('sailing_id', sailingId)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    // Get recipient counts and delivery progress for each gift
    const giftsWithProgress = await Promise.all((gifts ?? []).map(async (gift) => {
      const { data: recipients } = await supabase
        .from('pixie_gift_recipients')
        .select('id, delivered')
        .eq('gift_id', gift.id);

      const total = (recipients ?? []).length;
      const delivered = (recipients ?? []).filter(r => r.delivered).length;

      return { ...gift, recipient_count: total, delivered_count: delivered };
    }));

    return NextResponse.json({ gifts: giftsWithProgress, ship_name: shipName, sail_end_date: sailEndDate });
  } catch (error) {
    console.error('Error fetching pixie gifts:', error);
    return NextResponse.json({ error: 'Failed to fetch gifts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const { allowed } = checkRateLimit(`pixie-gift:${ip}`, 20);
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
    const { sailing_id, name, emoji, color, bulk_import } = body;

    if (!sailing_id) {
      return NextResponse.json({ error: 'sailing_id is required' }, { status: 400 });
    }

    const GIFT_PALETTE = [
      '#8B5CF6', '#0EA5E9', '#F97316', '#10B981', '#EC4899',
      '#EAB308', '#06B6D4', '#E11D48', '#6366F1', '#84CC16',
    ];

    // ── Bulk import mode ──
    if (Array.isArray(bulk_import)) {
      // Validate entries
      const entries = bulk_import
        .filter((e: { stateroom_number?: number; gift_name?: string }) => e.stateroom_number && e.gift_name)
        .map((e: { stateroom_number: number; recipient_name?: string; notes?: string; gift_name: string }) => ({
          stateroom_number: Number(e.stateroom_number),
          recipient_name: e.recipient_name ? String(e.recipient_name).replace(/<[^>]*>/g, '').trim().slice(0, 100) : null,
          notes: e.notes ? String(e.notes).replace(/<[^>]*>/g, '').trim().slice(0, 500) : null,
          gift_name: String(e.gift_name).replace(/<[^>]*>/g, '').trim().slice(0, 100),
        }))
        .filter(e => e.stateroom_number >= 1000 && e.gift_name);

      if (entries.length === 0) {
        return NextResponse.json({ error: 'No valid entries in bulk_import' }, { status: 400 });
      }

      // Prevent self-delivery
      const { data: userSailing } = await supabase
        .from('sailing_reviews')
        .select('stateroom_numbers')
        .eq('id', sailing_id)
        .eq('user_id', user.id)
        .maybeSingle();
      const ownRooms = new Set((userSailing?.stateroom_numbers ?? []).map(Number));

      const filteredEntries = ownRooms.size > 0
        ? entries.filter(e => !ownRooms.has(e.stateroom_number))
        : entries;

      if (filteredEntries.length === 0) {
        return NextResponse.json({ error: 'All entries were your own stateroom' }, { status: 400 });
      }

      // Group by gift_name
      const byGiftName: Record<string, typeof filteredEntries> = {};
      for (const entry of filteredEntries) {
        const key = entry.gift_name.toLowerCase();
        if (!byGiftName[key]) byGiftName[key] = [];
        byGiftName[key].push(entry);
      }

      // Fetch existing gifts for this sailing
      const { data: existingGifts } = await supabase
        .from('pixie_gifts')
        .select('id, name, sort_order')
        .eq('user_id', user.id)
        .eq('sailing_id', sailing_id)
        .order('sort_order', { ascending: false });

      let maxOrder = existingGifts?.[0]?.sort_order ?? -1;
      const giftMap = new Map<string, string>(); // lowercase name → gift id
      for (const g of existingGifts ?? []) {
        giftMap.set(g.name.toLowerCase(), g.id);
      }

      let giftsCreated = 0;
      let recipientsAdded = 0;

      for (const [lowerName, groupEntries] of Object.entries(byGiftName)) {
        let giftId: string = giftMap.get(lowerName) ?? '';

        // Create gift if not found
        if (!giftId) {
          maxOrder++;
          const displayName = groupEntries[0].gift_name; // preserve original casing
          const { data: newGift, error: createErr } = await supabase
            .from('pixie_gifts')
            .insert({
              user_id: user.id,
              sailing_id,
              name: displayName,
              emoji: '🎁',
              color: GIFT_PALETTE[maxOrder % GIFT_PALETTE.length],
              sort_order: maxOrder,
            })
            .select('id')
            .single();

          if (createErr || !newGift) throw createErr ?? new Error('Failed to create gift');
          giftId = newGift.id;
          giftMap.set(lowerName, giftId);
          giftsCreated++;
        }

        // Upsert recipients with name+notes (deduplicate by stateroom to avoid PG 21000 error)
        const deduped = new Map<number, typeof groupEntries[0]>();
        for (const e of groupEntries) deduped.set(e.stateroom_number, e);
        const inserts = Array.from(deduped.values()).map(e => ({
          gift_id: giftId,
          stateroom_number: e.stateroom_number,
          recipient_name: e.recipient_name,
          notes: e.notes,
        }));

        const { data: inserted, error: insertErr } = await supabase
          .from('pixie_gift_recipients')
          .upsert(inserts, { onConflict: 'gift_id,stateroom_number' })
          .select('id');

        if (insertErr) throw insertErr;
        recipientsAdded += (inserted ?? []).length;
      }

      return NextResponse.json({ success: true, gifts_created: giftsCreated, recipients_added: recipientsAdded });
    }

    // ── Single gift create mode ──
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const sanitizedName = String(name).replace(/<[^>]*>/g, '').trim().slice(0, 100);
    if (!sanitizedName) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }

    // Get next sort_order and count for color cycling
    const { data: existing } = await supabase
      .from('pixie_gifts')
      .select('sort_order')
      .eq('user_id', user.id)
      .eq('sailing_id', sailing_id)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;
    const autoColor = GIFT_PALETTE[nextOrder % GIFT_PALETTE.length];

    const { data: gift, error } = await supabase
      .from('pixie_gifts')
      .insert({
        user_id: user.id,
        sailing_id,
        name: sanitizedName,
        emoji: emoji || '🎁',
        color: color || autoColor,
        sort_order: nextOrder,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, gift });
  } catch (error) {
    console.error('Error creating pixie gift:', error);
    return NextResponse.json({ error: 'Failed to create gift' }, { status: 500 });
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
    const { id, name, emoji, color } = body;
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) {
      const sanitized = String(name).replace(/<[^>]*>/g, '').trim().slice(0, 100);
      if (!sanitized) return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
      updates.name = sanitized;
    }
    if (emoji !== undefined) updates.emoji = String(emoji).slice(0, 10);
    if (color !== undefined) updates.color = String(color).slice(0, 20);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('pixie_gifts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, gift: data });
  } catch (error) {
    console.error('Error updating pixie gift:', error);
    return NextResponse.json({ error: 'Failed to update gift' }, { status: 500 });
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

    const { error } = await supabase
      .from('pixie_gifts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pixie gift:', error);
    return NextResponse.json({ error: 'Failed to delete gift' }, { status: 500 });
  }
}
