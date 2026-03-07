import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, requireAuth, enrichWithProfiles, stripHtml } from '@/lib/review-api-utils';

const VALID_TOPICS = ['dining', 'staterooms', 'activities', 'general', 'first-sail'];

export async function GET(req: NextRequest) {
  const supabase = getSupabase(null);
  if (!supabase) return NextResponse.json({ questions: [] });

  const { searchParams } = new URL(req.url);
  const topic = searchParams.get('topic');
  const sort = searchParams.get('sort') || 'popular';

  let query = supabase
    .from('community_questions')
    .select('*')
    .limit(50);

  if (topic && VALID_TOPICS.includes(topic)) {
    query = query.eq('topic', topic);
  }

  if (sort === 'recent') {
    query = query.order('created_at', { ascending: false });
  } else {
    query = query.order('upvotes', { ascending: false }).order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });

  const enriched = await enrichWithProfiles(supabase, data || []);

  // Get answer counts
  const questionIds = (data || []).map(q => q.id);
  let answerCounts: Record<string, number> = {};
  if (questionIds.length > 0) {
    const { data: answers } = await supabase
      .from('community_answers')
      .select('question_id')
      .in('question_id', questionIds);
    for (const a of answers || []) {
      answerCounts[a.question_id] = (answerCounts[a.question_id] || 0) + 1;
    }
  }

  const questions = enriched.map(q => ({
    ...q,
    answer_count: answerCounts[q.id] || 0,
  }));

  return NextResponse.json({ questions });
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  const supabase = getSupabase(authHeader);
  if (!supabase) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  const auth = await requireAuth(supabase);
  if (auth.error) return auth.error;

  const body = await req.json();
  const question_text = stripHtml(String(body.question_text || '')).slice(0, 500);
  const topic = String(body.topic || '');

  if (!question_text) return NextResponse.json({ error: 'Question text is required.' }, { status: 400 });
  if (!VALID_TOPICS.includes(topic)) return NextResponse.json({ error: 'Invalid topic.' }, { status: 400 });

  const { data, error } = await supabase
    .from('community_questions')
    .insert({
      user_id: auth.user.id,
      question_text,
      topic,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to submit question.' }, { status: 500 });
  return NextResponse.json({ question: data }, { status: 201 });
}
