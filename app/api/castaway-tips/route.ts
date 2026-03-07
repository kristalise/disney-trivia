import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, requireAuth, enrichWithProfiles, stripHtml } from '@/lib/review-api-utils';

const VALID_LEVELS = ['new', 'silver', 'gold', 'platinum', 'pearl'];
const VALID_CATEGORIES = ['Embarkation', 'Dining', 'Packing', 'Saving Money', 'Kids', 'First-Time'];

export async function GET(req: NextRequest) {
  const supabase = getSupabase(null);
  if (!supabase) return NextResponse.json({ tips: [] });

  const { searchParams } = new URL(req.url);
  const level = searchParams.get('level');
  const category = searchParams.get('category');

  let query = supabase
    .from('castaway_tips')
    .select('*')
    .order('upvotes', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50);

  if (level && VALID_LEVELS.includes(level)) {
    query = query.eq('castaway_level', level);
  }
  if (category && VALID_CATEGORIES.includes(category)) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch tips' }, { status: 500 });

  const enriched = await enrichWithProfiles(supabase, data || []);
  return NextResponse.json({ tips: enriched });
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  const supabase = getSupabase(authHeader);
  if (!supabase) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  const auth = await requireAuth(supabase);
  if (auth.error) return auth.error;

  const body = await req.json();
  const title = stripHtml(String(body.title || '')).slice(0, 200);
  const tip_text = stripHtml(String(body.tip_text || '')).slice(0, 2000);
  const category = String(body.category || '');

  if (!title || !tip_text) return NextResponse.json({ error: 'Title and tip text are required.' }, { status: 400 });
  if (!VALID_CATEGORIES.includes(category)) return NextResponse.json({ error: 'Invalid category.' }, { status: 400 });

  // Auto-detect Castaway level from user's sailing count
  const { data: sailings } = await supabase
    .from('sailing_reviews')
    .select('id, sail_end_date')
    .eq('user_id', auth.user.id);

  const now = new Date();
  const pastCount = (sailings || []).filter(s => new Date(s.sail_end_date + 'T23:59:59') < now).length;

  let castaway_level = 'new';
  if (pastCount >= 25) castaway_level = 'pearl';
  else if (pastCount >= 10) castaway_level = 'platinum';
  else if (pastCount >= 5) castaway_level = 'gold';
  else if (pastCount >= 1) castaway_level = 'silver';

  const { data, error } = await supabase
    .from('castaway_tips')
    .insert({
      user_id: auth.user.id,
      castaway_level,
      category,
      title,
      tip_text,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to submit tip.' }, { status: 500 });
  return NextResponse.json({ tip: data }, { status: 201 });
}
