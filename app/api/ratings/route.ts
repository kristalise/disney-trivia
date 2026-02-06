import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseKey);
}

// Generate a session ID for anonymous users
function getSessionId(request: NextRequest): string {
  const existingSession = request.cookies.get('trivia_session')?.value;
  if (existingSession) return existingSession;
  return `anon_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question_id, is_reliable, suggested_correct_answer, suggested_explanation } = body;

    if (!question_id || typeof is_reliable !== 'boolean') {
      return NextResponse.json(
        { error: 'question_id and is_reliable are required' },
        { status: 400 }
      );
    }

    // If marking as unreliable, require suggested answer
    if (!is_reliable && suggested_correct_answer === undefined) {
      return NextResponse.json(
        { error: 'suggested_correct_answer is required when marking as unreliable' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    if (!supabase) {
      // Store in memory/localStorage on client side as fallback
      return NextResponse.json({
        success: true,
        message: 'Rating recorded locally (database not configured)',
        fallback: true
      });
    }

    const sessionId = getSessionId(request);

    // Check if user already rated this question
    const { data: existingRating } = await supabase
      .from('question_ratings')
      .select('id')
      .eq('question_id', question_id)
      .eq('session_id', sessionId)
      .single();

    if (existingRating) {
      // Update existing rating
      const { error } = await supabase
        .from('question_ratings')
        .update({
          is_reliable,
          suggested_correct_answer: is_reliable ? null : suggested_correct_answer,
          suggested_explanation: is_reliable ? null : suggested_explanation,
        })
        .eq('id', existingRating.id);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: 'Rating updated',
        updated: true
      });
    }

    // Insert new rating
    const { error } = await supabase
      .from('question_ratings')
      .insert({
        question_id,
        session_id: sessionId,
        is_reliable,
        suggested_correct_answer: is_reliable ? null : suggested_correct_answer,
        suggested_explanation: is_reliable ? null : suggested_explanation,
      });

    if (error) throw error;

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Rating recorded'
    });

    response.cookies.set('trivia_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return response;
  } catch (error) {
    console.error('Error recording rating:', error);
    return NextResponse.json(
      { error: 'Failed to record rating' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('question_id');

    if (!questionId) {
      return NextResponse.json(
        { error: 'question_id is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    if (!supabase) {
      return NextResponse.json({ ratings: [], total: 0, reliable: 0 });
    }

    const { data: ratings, error } = await supabase
      .from('question_ratings')
      .select('*')
      .eq('question_id', questionId);

    if (error) throw error;

    const total = ratings?.length || 0;
    const reliable = ratings?.filter(r => r.is_reliable).length || 0;

    return NextResponse.json({
      ratings,
      total,
      reliable,
      score: total > 0 ? reliable / total : 1
    });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    );
  }
}
