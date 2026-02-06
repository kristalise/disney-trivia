'use client';

import { LocalProgress } from '@/types';
import { getAuthClient } from './auth';

const STORAGE_KEY = 'disney-trivia-progress';

export function getLocalProgress(): LocalProgress {
  if (typeof window === 'undefined') {
    return { questionsAnswered: {}, quizSessions: [] };
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return { questionsAnswered: {}, quizSessions: [] };
  }

  try {
    return JSON.parse(stored);
  } catch {
    return { questionsAnswered: {}, quizSessions: [] };
  }
}

export async function saveQuestionAnswer(questionId: string, correct: boolean): Promise<void> {
  // Save to local storage always
  const progress = getLocalProgress();

  if (!progress.questionsAnswered[questionId]) {
    progress.questionsAnswered[questionId] = [];
  }

  progress.questionsAnswered[questionId].push({
    correct,
    answeredAt: new Date().toISOString(),
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));

  // Also save to Supabase if logged in
  try {
    const supabase = getAuthClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase.from('user_progress').insert({
        user_id: user.id,
        question_id: questionId,
        correct,
        answered_at: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Failed to save progress to database:', error);
  }
}

export async function saveQuizSession(
  categorySlug: string,
  score: number,
  totalQuestions: number,
  categoryId?: string
): Promise<void> {
  // Save to local storage always
  const progress = getLocalProgress();

  progress.quizSessions.push({
    categorySlug,
    score,
    totalQuestions,
    completedAt: new Date().toISOString(),
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));

  // Also save to Supabase if logged in
  try {
    const supabase = getAuthClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user && categoryId) {
      await supabase.from('quiz_sessions').insert({
        user_id: user.id,
        category_id: categoryId,
        score,
        total_questions: totalQuestions,
        completed_at: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Failed to save quiz session to database:', error);
  }
}

export function getAccuracyByCategory(categorySlug: string): number {
  const progress = getLocalProgress();
  const sessions = progress.quizSessions.filter(s => s.categorySlug === categorySlug);

  if (sessions.length === 0) return 0;

  const totalScore = sessions.reduce((sum, s) => sum + s.score, 0);
  const totalQuestions = sessions.reduce((sum, s) => sum + s.totalQuestions, 0);

  return totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
}

export function getOverallAccuracy(): number {
  const progress = getLocalProgress();
  const sessions = progress.quizSessions;

  if (sessions.length === 0) return 0;

  const totalScore = sessions.reduce((sum, s) => sum + s.score, 0);
  const totalQuestions = sessions.reduce((sum, s) => sum + s.totalQuestions, 0);

  return totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
}

export function getTotalQuestionsAnswered(): number {
  const progress = getLocalProgress();
  return Object.values(progress.questionsAnswered).reduce(
    (sum, answers) => sum + answers.length,
    0
  );
}

export function getRecentQuizzes(limit: number = 5): LocalProgress['quizSessions'] {
  const progress = getLocalProgress();
  return progress.quizSessions
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, limit);
}

// Fetch user progress from Supabase for logged-in users
export async function fetchUserProgress(): Promise<{
  questionsAnswered: number;
  correctAnswers: number;
  quizSessions: Array<{
    categorySlug: string;
    score: number;
    totalQuestions: number;
    completedAt: string;
  }>;
} | null> {
  try {
    const supabase = getAuthClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch question answers
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('correct')
      .eq('user_id', user.id);

    if (progressError) throw progressError;

    // Fetch quiz sessions with category info
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('quiz_sessions')
      .select(`
        score,
        total_questions,
        completed_at,
        categories (slug)
      `)
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false });

    if (sessionsError) throw sessionsError;

    const questionsAnswered = progressData?.length || 0;
    const correctAnswers = progressData?.filter(p => p.correct).length || 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quizSessions = (sessionsData || []).map((session: any) => ({
      categorySlug: session.categories?.slug || 'unknown',
      score: session.score,
      totalQuestions: session.total_questions,
      completedAt: session.completed_at,
    }));

    return {
      questionsAnswered,
      correctAnswers,
      quizSessions,
    };
  } catch (error) {
    console.error('Failed to fetch user progress:', error);
    return null;
  }
}

// Sync local progress to Supabase when user logs in
export async function syncLocalProgressToCloud(): Promise<void> {
  try {
    const supabase = getAuthClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const localProgress = getLocalProgress();

    // Sync question answers
    const progressInserts = [];
    for (const [questionId, answers] of Object.entries(localProgress.questionsAnswered)) {
      for (const answer of answers) {
        progressInserts.push({
          user_id: user.id,
          question_id: questionId,
          correct: answer.correct,
          answered_at: answer.answeredAt,
        });
      }
    }

    if (progressInserts.length > 0) {
      await supabase.from('user_progress').upsert(progressInserts, {
        onConflict: 'user_id,question_id,answered_at',
        ignoreDuplicates: true,
      });
    }

    console.log('Local progress synced to cloud');
  } catch (error) {
    console.error('Failed to sync local progress:', error);
  }
}
