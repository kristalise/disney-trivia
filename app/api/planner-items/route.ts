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

const VALID_ITEM_TYPES = ['venue', 'activity', 'dining', 'stateroom', 'character', 'entertainment', 'shopping'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function verifySailingAccess(supabase: any, sailingId: string, userId: string): Promise<'owner' | 'guest' | null> {
  const { data: sailing, error } = await supabase
    .from('sailing_reviews')
    .select('id, user_id')
    .eq('id', sailingId)
    .single();

  if (error || !sailing) return null;
  if (sailing.user_id === userId) return 'owner';

  // Check if user is a companion on this sailing
  const { data: companion } = await supabase
    .from('sailing_companions')
    .select('id')
    .eq('sailing_id', sailingId)
    .eq('companion_id', userId)
    .maybeSingle();

  return companion ? 'guest' : null;
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

    // Verify sailing access (owner or companion)
    const role = await verifySailingAccess(supabase, sailingId, user.id);
    if (!role) {
      return NextResponse.json({ error: 'Sailing not found or access denied' }, { status: 403 });
    }

    const { data: items, error } = await supabase
      .from('planner_items')
      .select('id, sailing_id, item_type, item_id, checked, notes, created_at')
      .eq('sailing_id', sailingId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ items: items ?? [] });
  } catch (error) {
    console.error('Error fetching planner items:', error);
    return NextResponse.json({ error: 'Failed to fetch planner items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const { allowed } = checkRateLimit(`planner-item:${ip}`, 30);
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
    const { sailing_id, item_type, item_id, notes, checked } = body;

    if (!sailing_id || !item_type || !item_id) {
      return NextResponse.json({ error: 'sailing_id, item_type, and item_id are required' }, { status: 400 });
    }

    if (!VALID_ITEM_TYPES.includes(item_type)) {
      return NextResponse.json({ error: 'Invalid item_type' }, { status: 400 });
    }

    // Verify sailing access (owner or companion)
    const role = await verifySailingAccess(supabase, sailing_id, user.id);
    if (!role) {
      return NextResponse.json({ error: 'Sailing not found or access denied' }, { status: 403 });
    }

    const sanitizedItemId = stripHtml(String(item_id)).slice(0, 200);
    const sanitizedNotes = notes ? stripHtml(String(notes)).slice(0, 500) : null;

    const insertData: Record<string, unknown> = {
      user_id: user.id,
      sailing_id,
      item_type,
      item_id: sanitizedItemId,
      notes: sanitizedNotes,
    };
    if (checked !== undefined) {
      insertData.checked = Boolean(checked);
    }

    const { data, error } = await supabase
      .from('planner_items')
      .upsert(insertData, { onConflict: 'user_id,sailing_id,item_type,item_id' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, item: data });
  } catch (error) {
    console.error('Error creating planner item:', error);
    return NextResponse.json({ error: 'Failed to create planner item' }, { status: 500 });
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
    const { id, checked, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('planner_items')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Planner item not found' }, { status: 404 });
    }
    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Not your planner item' }, { status: 403 });
    }

    const updates: Record<string, unknown> = {};
    if (checked !== undefined) {
      updates.checked = Boolean(checked);
    }
    if (notes !== undefined) {
      updates.notes = notes ? stripHtml(String(notes)).slice(0, 500) : null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('planner_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, item: data });
  } catch (error) {
    console.error('Error updating planner item:', error);
    return NextResponse.json({ error: 'Failed to update planner item' }, { status: 500 });
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

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('planner_items')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Planner item not found' }, { status: 404 });
    }
    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Not your planner item' }, { status: 403 });
    }

    const { error } = await supabase
      .from('planner_items')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting planner item:', error);
    return NextResponse.json({ error: 'Failed to delete planner item' }, { status: 500 });
  }
}
