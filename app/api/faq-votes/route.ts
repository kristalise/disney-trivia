import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { checkRateLimit } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

function getSessionId(request: NextRequest): string {
  const existingSession = request.cookies.get('trivia_session')?.value;
  if (existingSession) return existingSession;
  return `anon_${randomUUID()}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const items = searchParams.get('items');

    if (!items) {
      return NextResponse.json({ error: 'items parameter is required' }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ votes: {} });
    }

    const itemIds = items.split(',').filter(Boolean);
    const sessionId = getSessionId(request);

    const { data: allVotes, error } = await supabase
      .from('faq_votes')
      .select('faq_item_id, is_helpful, session_id')
      .in('faq_item_id', itemIds);

    if (error) throw error;

    const votes: Record<string, { up: number; down: number; user_vote: boolean | null }> = {};

    for (const id of itemIds) {
      votes[id] = { up: 0, down: 0, user_vote: null };
    }

    for (const vote of allVotes || []) {
      const entry = votes[vote.faq_item_id];
      if (!entry) continue;
      if (vote.is_helpful) entry.up++;
      else entry.down++;
      if (vote.session_id === sessionId) entry.user_vote = vote.is_helpful;
    }

    return NextResponse.json({ votes });
  } catch (error) {
    console.error('Error fetching FAQ votes:', error);
    return NextResponse.json({ error: 'Failed to fetch votes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const { allowed } = checkRateLimit(`faq-vote:${ip}`, 30);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { faq_item_id, is_helpful } = body;

    if (!faq_item_id || typeof is_helpful !== 'boolean') {
      return NextResponse.json(
        { error: 'faq_item_id and is_helpful are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ success: true, action: 'voted', fallback: true });
    }

    const sessionId = getSessionId(request);

    // Check for existing vote
    const { data: existing } = await supabase
      .from('faq_votes')
      .select('id, is_helpful')
      .eq('faq_item_id', faq_item_id)
      .eq('session_id', sessionId)
      .single();

    let action: 'voted' | 'removed' | 'switched';

    if (existing) {
      if (existing.is_helpful === is_helpful) {
        // Same vote — toggle off (remove)
        const { error } = await supabase
          .from('faq_votes')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
        action = 'removed';
      } else {
        // Different vote — switch
        const { error } = await supabase
          .from('faq_votes')
          .update({ is_helpful })
          .eq('id', existing.id);
        if (error) throw error;
        action = 'switched';
      }
    } else {
      // New vote
      const { error } = await supabase
        .from('faq_votes')
        .insert({ faq_item_id, session_id: sessionId, is_helpful });
      if (error) throw error;
      action = 'voted';
    }

    const response = NextResponse.json({ success: true, action });

    response.cookies.set('trivia_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch (error) {
    console.error('Error recording FAQ vote:', error);
    return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
  }
}
