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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function verifySailingAccess(supabase: any, sailingId: string, userId: string): Promise<'owner' | 'guest' | null> {
  const { data: sailing, error } = await supabase
    .from('sailing_reviews')
    .select('id, user_id')
    .eq('id', sailingId)
    .single();

  if (error || !sailing) return null;
  if (sailing.user_id === userId) return 'owner';

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

    const role = await verifySailingAccess(supabase, sailingId, user.id);
    if (!role) {
      return NextResponse.json({ error: 'Sailing not found or access denied' }, { status: 403 });
    }

    // Get sailing owner
    const { data: sailing } = await supabase
      .from('sailing_reviews')
      .select('user_id')
      .eq('id', sailingId)
      .single();

    if (!sailing) {
      return NextResponse.json({ error: 'Sailing not found' }, { status: 404 });
    }

    // Get all companions on the sailing
    const { data: companions } = await supabase
      .from('sailing_companions')
      .select('companion_id')
      .eq('sailing_id', sailingId);

    // Build list of all party member user IDs (owner + companions), excluding current user
    const partyUserIds: { userId: string; role: 'owner' | 'guest' }[] = [];
    if (sailing.user_id !== user.id) {
      partyUserIds.push({ userId: sailing.user_id, role: 'owner' });
    }
    for (const c of (companions ?? [])) {
      if (c.companion_id !== user.id) {
        partyUserIds.push({ userId: c.companion_id, role: 'guest' });
      }
    }

    if (partyUserIds.length === 0) {
      return NextResponse.json({ companions: [] });
    }

    const userIds = partyUserIds.map(p => p.userId);

    // Fetch data for all party members in parallel
    const [profilesRes, plannerRes, checklistRes, rotationsRes] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('id, display_name, avatar_url, handle')
        .in('id', userIds),
      supabase
        .from('planner_items')
        .select('user_id, item_type, item_id')
        .eq('sailing_id', sailingId)
        .in('user_id', userIds),
      supabase
        .from('pre_cruise_checklist')
        .select('user_id, category, label')
        .eq('sailing_id', sailingId)
        .in('user_id', userIds),
      supabase
        .from('adventure_rotations')
        .select('user_id, rotation')
        .eq('sailing_id', sailingId)
        .in('user_id', userIds),
    ]);

    const profiles = profilesRes.data ?? [];
    const plannerItems = plannerRes.data ?? [];
    const checklistItems = checklistRes.data ?? [];
    const rotations = rotationsRes.data ?? [];

    // Build companion summaries
    const result = partyUserIds.map(({ userId, role: memberRole }) => {
      const profile = profiles.find((p: { id: string }) => p.id === userId);
      const userPlanner = plannerItems.filter((i: { user_id: string }) => i.user_id === userId);
      const userChecklist = checklistItems.filter((i: { user_id: string }) => i.user_id === userId);
      const userRotation = rotations.find((r: { user_id: string }) => r.user_id === userId);

      return {
        user_id: userId,
        display_name: profile?.display_name || 'Cruiser',
        avatar_url: profile?.avatar_url || null,
        handle: profile?.handle || null,
        role: memberRole,
        planner_items: userPlanner.map((i: { item_type: string; item_id: string }) => ({
          item_type: i.item_type,
          item_id: i.item_id,
        })),
        planner_summary: `${userPlanner.length} item${userPlanner.length !== 1 ? 's' : ''} planned`,
        pre_cruise_items: userChecklist.map((i: { category: string; label: string }) => ({
          category: i.category,
          label: i.label,
        })),
        pre_cruise_summary: `${userChecklist.length} checklist item${userChecklist.length !== 1 ? 's' : ''}`,
        adventure_rotation: userRotation?.rotation ?? null,
      };
    });

    return NextResponse.json({ companions: result });
  } catch (error) {
    console.error('Error fetching companion plans:', error);
    return NextResponse.json({ error: 'Failed to fetch companion plans' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const { allowed } = checkRateLimit(`companion-copy:${ip}`, 5);
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
    const { sailing_id, source_user_id, include_planner, include_checklist, include_rotation } = body;

    if (!sailing_id || !source_user_id) {
      return NextResponse.json({ error: 'sailing_id and source_user_id are required' }, { status: 400 });
    }

    // Verify requesting user has sailing access
    const selfRole = await verifySailingAccess(supabase, sailing_id, user.id);
    if (!selfRole) {
      return NextResponse.json({ error: 'Sailing not found or access denied' }, { status: 403 });
    }

    // Verify source user also has sailing access
    const sourceRole = await verifySailingAccess(supabase, sailing_id, source_user_id);
    if (!sourceRole) {
      return NextResponse.json({ error: 'Source user is not on this sailing' }, { status: 403 });
    }

    const copied = { planner_items: 0, checklist_items: 0, rotation: null as number | null };

    // Copy planner items
    if (include_planner) {
      const { data: sourceItems } = await supabase
        .from('planner_items')
        .select('item_type, item_id')
        .eq('sailing_id', sailing_id)
        .eq('user_id', source_user_id);

      if (sourceItems && sourceItems.length > 0) {
        const insertRows = sourceItems.map((item: { item_type: string; item_id: string }) => ({
          user_id: user.id,
          sailing_id,
          item_type: item.item_type,
          item_id: item.item_id,
          checked: false,
          notes: null,
        }));

        const { data: inserted } = await supabase
          .from('planner_items')
          .upsert(insertRows, { onConflict: 'user_id,sailing_id,item_type,item_id', ignoreDuplicates: true })
          .select('id');

        copied.planner_items = inserted?.length ?? 0;
      }
    }

    // Copy checklist items
    if (include_checklist) {
      const { data: sourceChecklist } = await supabase
        .from('pre_cruise_checklist')
        .select('category, label, sort_order')
        .eq('sailing_id', sailing_id)
        .eq('user_id', source_user_id);

      if (sourceChecklist && sourceChecklist.length > 0) {
        // Get user's existing checklist items to avoid duplicates
        const { data: existingChecklist } = await supabase
          .from('pre_cruise_checklist')
          .select('category, label')
          .eq('sailing_id', sailing_id)
          .eq('user_id', user.id);

        const existingKeys = new Set(
          (existingChecklist ?? []).map((i: { category: string; label: string }) => `${i.category}:${i.label}`)
        );

        const newItems = sourceChecklist.filter(
          (i: { category: string; label: string }) => !existingKeys.has(`${i.category}:${i.label}`)
        );

        if (newItems.length > 0) {
          const insertRows = newItems.map((item: { category: string; label: string; sort_order: number }) => ({
            user_id: user.id,
            sailing_id,
            category: item.category,
            label: item.label,
            checked: false,
            sort_order: item.sort_order,
          }));

          const { data: inserted } = await supabase
            .from('pre_cruise_checklist')
            .insert(insertRows)
            .select('id');

          copied.checklist_items = inserted?.length ?? 0;
        }
      }
    }

    // Copy rotation
    if (include_rotation) {
      const { data: sourceRotation } = await supabase
        .from('adventure_rotations')
        .select('rotation')
        .eq('sailing_id', sailing_id)
        .eq('user_id', source_user_id)
        .maybeSingle();

      if (sourceRotation?.rotation) {
        await supabase
          .from('adventure_rotations')
          .upsert({
            user_id: user.id,
            sailing_id,
            rotation: sourceRotation.rotation,
          }, { onConflict: 'user_id,sailing_id' });

        copied.rotation = sourceRotation.rotation;
      }
    }

    return NextResponse.json({ success: true, copied });
  } catch (error) {
    console.error('Error copying companion plan:', error);
    return NextResponse.json({ error: 'Failed to copy plan' }, { status: 500 });
  }
}
