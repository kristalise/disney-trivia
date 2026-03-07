import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, requireAuth, enrichWithProfiles, stripHtml } from '@/lib/review-api-utils';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: questionId } = await params;
  const supabase = getSupabase(null);
  if (!supabase) return NextResponse.json({ answers: [] });

  const { data, error } = await supabase
    .from('community_answers')
    .select('*')
    .eq('question_id', questionId)
    .order('is_accepted', { ascending: false })
    .order('upvotes', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 });

  const enriched = await enrichWithProfiles(supabase, data || []);
  return NextResponse.json({ answers: enriched });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: questionId } = await params;
  const authHeader = req.headers.get('Authorization');
  const supabase = getSupabase(authHeader);
  if (!supabase) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  const auth = await requireAuth(supabase);
  if (auth.error) return auth.error;

  const body = await req.json();
  const answer_text = stripHtml(String(body.answer_text || '')).slice(0, 2000);

  if (!answer_text) return NextResponse.json({ error: 'Answer text is required.' }, { status: 400 });

  const { data, error } = await supabase
    .from('community_answers')
    .insert({
      question_id: questionId,
      user_id: auth.user.id,
      answer_text,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to submit answer.' }, { status: 500 });

  // Mark question as answered
  await supabase
    .from('community_questions')
    .update({ is_answered: true })
    .eq('id', questionId);

  return NextResponse.json({ answer: data }, { status: 201 });
}
