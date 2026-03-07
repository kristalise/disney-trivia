import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, requireAuth } from '@/lib/review-api-utils';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tipId } = await params;
  const authHeader = req.headers.get('Authorization');
  const supabase = getSupabase(authHeader);
  if (!supabase) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  const auth = await requireAuth(supabase);
  if (auth.error) return auth.error;

  // Check existing upvote
  const { data: existing } = await supabase
    .from('castaway_tip_upvotes')
    .select('tip_id')
    .eq('user_id', auth.user.id)
    .eq('tip_id', tipId)
    .maybeSingle();

  if (existing) {
    // Remove upvote
    await supabase.from('castaway_tip_upvotes').delete().eq('user_id', auth.user.id).eq('tip_id', tipId);
    const { count } = await supabase.from('castaway_tip_upvotes').select('*', { count: 'exact', head: true }).eq('tip_id', tipId);
    await supabase.from('castaway_tips').update({ upvotes: count || 0 }).eq('id', tipId);
    return NextResponse.json({ upvoted: false, upvotes: count || 0 });
  } else {
    // Add upvote
    await supabase.from('castaway_tip_upvotes').insert({ user_id: auth.user.id, tip_id: tipId });
    const { count } = await supabase.from('castaway_tip_upvotes').select('*', { count: 'exact', head: true }).eq('tip_id', tipId);
    await supabase.from('castaway_tips').update({ upvotes: count || 0 }).eq('id', tipId);
    return NextResponse.json({ upvoted: true, upvotes: count || 0 });
  }
}
