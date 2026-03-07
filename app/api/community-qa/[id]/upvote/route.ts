import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, requireAuth } from '@/lib/review-api-utils';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authHeader = req.headers.get('Authorization');
  const supabase = getSupabase(authHeader);
  if (!supabase) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  const auth = await requireAuth(supabase);
  if (auth.error) return auth.error;

  const body = await req.json();
  const type = body.type || 'question'; // 'question' or 'answer'

  if (type === 'question') {
    const { data: existing } = await supabase
      .from('community_question_upvotes')
      .select('question_id')
      .eq('user_id', auth.user.id)
      .eq('question_id', id)
      .maybeSingle();

    if (existing) {
      await supabase.from('community_question_upvotes').delete().eq('user_id', auth.user.id).eq('question_id', id);
    } else {
      await supabase.from('community_question_upvotes').insert({ user_id: auth.user.id, question_id: id });
    }

    const { count } = await supabase.from('community_question_upvotes').select('*', { count: 'exact', head: true }).eq('question_id', id);
    await supabase.from('community_questions').update({ upvotes: count || 0 }).eq('id', id);
    return NextResponse.json({ upvoted: !existing, upvotes: count || 0 });
  } else {
    const { data: existing } = await supabase
      .from('community_answer_upvotes')
      .select('answer_id')
      .eq('user_id', auth.user.id)
      .eq('answer_id', id)
      .maybeSingle();

    if (existing) {
      await supabase.from('community_answer_upvotes').delete().eq('user_id', auth.user.id).eq('answer_id', id);
    } else {
      await supabase.from('community_answer_upvotes').insert({ user_id: auth.user.id, answer_id: id });
    }

    const { count } = await supabase.from('community_answer_upvotes').select('*', { count: 'exact', head: true }).eq('answer_id', id);
    await supabase.from('community_answers').update({ upvotes: count || 0 }).eq('id', id);
    return NextResponse.json({ upvoted: !existing, upvotes: count || 0 });
  }
}
