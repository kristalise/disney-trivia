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

    return NextResponse.json({ gifts: giftsWithProgress });
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
    const { sailing_id, name, emoji, color } = body;

    if (!sailing_id || !name) {
      return NextResponse.json({ error: 'sailing_id and name are required' }, { status: 400 });
    }

    const sanitizedName = String(name).replace(/<[^>]*>/g, '').trim().slice(0, 100);
    if (!sanitizedName) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }

    // Get next sort_order
    const { data: existing } = await supabase
      .from('pixie_gifts')
      .select('sort_order')
      .eq('user_id', user.id)
      .eq('sailing_id', sailing_id)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

    const { data: gift, error } = await supabase
      .from('pixie_gifts')
      .insert({
        user_id: user.id,
        sailing_id,
        name: sanitizedName,
        emoji: emoji || '🎁',
        color: color || '#8B5CF6',
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
