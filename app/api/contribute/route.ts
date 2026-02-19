import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

const MAX_QUESTION_LENGTH = 500;
const MAX_OPTION_LENGTH = 200;
const MAX_EXPLANATION_LENGTH = 1000;
const MAX_CRUISE_NAME_LENGTH = 100;

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '').trim();
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const { allowed } = checkRateLimit(`contribute:${ip}`, 5);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      category_id,
      question,
      options,
      correct_answer,
      explanation,
      difficulty,
      cruise_name
    } = body;

    // Validation
    if (!category_id || !question || !options || correct_answer === undefined || !explanation || !difficulty || !cruise_name) {
      return NextResponse.json(
        { error: 'All fields are required: category_id, question, options, correct_answer, explanation, difficulty, cruise_name' },
        { status: 400 }
      );
    }

    if (!Array.isArray(options) || options.length !== 4) {
      return NextResponse.json(
        { error: 'Options must be an array of 4 choices' },
        { status: 400 }
      );
    }

    if (correct_answer < 0 || correct_answer > 3) {
      return NextResponse.json(
        { error: 'correct_answer must be between 0 and 3' },
        { status: 400 }
      );
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'difficulty must be easy, medium, or hard' },
        { status: 400 }
      );
    }

    // Sanitize and enforce length limits
    const sanitizedQuestion = stripHtml(question).slice(0, MAX_QUESTION_LENGTH);
    const sanitizedOptions = options.map((opt: string) => stripHtml(String(opt)).slice(0, MAX_OPTION_LENGTH));
    const sanitizedExplanation = stripHtml(explanation).slice(0, MAX_EXPLANATION_LENGTH);
    const sanitizedCruiseName = stripHtml(cruise_name).slice(0, MAX_CRUISE_NAME_LENGTH);

    if (!sanitizedQuestion || sanitizedOptions.some((opt: string) => !opt) || !sanitizedExplanation) {
      return NextResponse.json(
        { error: 'Fields cannot be empty after sanitization' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    if (!supabase) {
      // Return success but note it's stored locally
      return NextResponse.json({
        success: true,
        message: 'Question saved locally (database not configured)',
        fallback: true,
        question: {
          id: `local_${Date.now()}`,
          category_id,
          question: sanitizedQuestion,
          options: sanitizedOptions,
          correct_answer,
          explanation: sanitizedExplanation,
          difficulty,
          cruise_name: sanitizedCruiseName,
          is_user_contributed: true,
          contributed_at: new Date().toISOString(),
          reliability_score: 1.0,
          total_ratings: 0,
          reliable_ratings: 0
        }
      });
    }

    // Insert the question
    const { data, error } = await supabase
      .from('questions')
      .insert({
        category_id,
        question: sanitizedQuestion,
        options: sanitizedOptions,
        correct_answer,
        explanation: sanitizedExplanation,
        difficulty,
        cruise_name: sanitizedCruiseName,
        is_user_contributed: true,
        contributed_at: new Date().toISOString(),
        reliability_score: 1.0,
        total_ratings: 0,
        reliable_ratings: 0
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Question contributed successfully!',
      question: data
    });
  } catch (error) {
    console.error('Error contributing question:', error);
    return NextResponse.json(
      { error: 'Failed to contribute question' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = getSupabase();

    if (!supabase) {
      return NextResponse.json({ questions: [], total: 0 });
    }

    // Get user-contributed questions
    const { data: questions, error, count } = await supabase
      .from('questions')
      .select('*, category:categories(name, slug)', { count: 'exact' })
      .eq('is_user_contributed', true)
      .order('contributed_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({
      questions: questions || [],
      total: count || 0
    });
  } catch (error) {
    console.error('Error fetching contributed questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contributed questions' },
      { status: 500 }
    );
  }
}
