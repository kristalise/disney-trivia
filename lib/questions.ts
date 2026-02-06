import { Question, Category } from '@/types';
import { getSupabase, isSupabaseConfigured } from './supabase';
import seedData from '@/data/seed-questions.json';

export async function getCategories(): Promise<Category[]> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    return seedData.categories as Category[];
  }

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    return seedData.categories as Category[];
  }

  return data;
}

export async function getQuestionsByCategory(
  categorySlug: string,
  limit: number = 10
): Promise<Question[]> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    const category = seedData.categories.find(c => c.slug === categorySlug);
    if (!category) return [];

    const questions = seedData.questions.filter(
      q => q.category_id === category.id
    ) as Question[];

    // Shuffle and return limited questions
    return shuffleArray(questions).slice(0, limit);
  }

  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .single();

  if (!category) return [];

  const { data, error } = await supabase
    .from('questions')
    .select('*, category:categories(*)')
    .eq('category_id', category.id)
    .limit(limit);

  if (error) {
    console.error('Error fetching questions:', error);
    return [];
  }

  return shuffleArray(data);
}

export async function searchQuestions(
  query: string,
  categorySlug?: string
): Promise<Question[]> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    let questions = seedData.questions as Question[];

    if (categorySlug) {
      const category = seedData.categories.find(c => c.slug === categorySlug);
      if (category) {
        questions = questions.filter(q => q.category_id === category.id);
      }
    }

    const lowerQuery = query.toLowerCase();
    return questions.filter(
      q =>
        q.question.toLowerCase().includes(lowerQuery) ||
        q.explanation.toLowerCase().includes(lowerQuery) ||
        q.options.some(opt => opt.toLowerCase().includes(lowerQuery))
    );
  }

  let queryBuilder = supabase
    .from('questions')
    .select('*, category:categories(*)');

  if (categorySlug) {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();

    if (category) {
      queryBuilder = queryBuilder.eq('category_id', category.id);
    }
  }

  // Use Supabase full-text search
  const { data, error } = await queryBuilder.textSearch('question', query, {
    type: 'websearch',
    config: 'english',
  });

  if (error) {
    console.error('Error searching questions:', error);
    return [];
  }

  return data;
}

export async function getRandomQuestions(limit: number = 10): Promise<Question[]> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    return shuffleArray(seedData.questions as Question[]).slice(0, limit);
  }

  const { data, error } = await supabase
    .from('questions')
    .select('*, category:categories(*)')
    .limit(limit * 2); // Get more to shuffle

  if (error) {
    console.error('Error fetching random questions:', error);
    return [];
  }

  return shuffleArray(data).slice(0, limit);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
