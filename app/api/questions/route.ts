import { NextRequest, NextResponse } from 'next/server';
import { getCategories, getQuestionsByCategory, getRandomQuestions } from '@/lib/questions';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const categoriesOnly = searchParams.get('categoriesOnly');

  try {
    // If only categories are requested
    if (categoriesOnly === 'true') {
      const categories = await getCategories();
      return NextResponse.json({ categories });
    }

    // Get questions by category or random
    if (category && category !== 'mixed') {
      const questions = await getQuestionsByCategory(category);
      return NextResponse.json({ questions, totalCount: questions.length });
    } else {
      const questions = await getRandomQuestions(limit);
      return NextResponse.json({ questions });
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
