import { NextRequest, NextResponse } from 'next/server';
import { searchQuestions, getQuestionsByCategory } from '@/lib/questions';
import { Question } from '@/types';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';

  try {
    let questions: Question[] = [];

    if (query) {
      // Search with query
      questions = await searchQuestions(query, category || undefined);
    } else if (category) {
      // Browse by category
      questions = await getQuestionsByCategory(category, 50);
    } else {
      // Return empty array if no query or category
      questions = [];
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
