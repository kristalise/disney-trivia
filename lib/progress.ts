'use client';

import { LocalProgress } from '@/types';

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

export function saveQuestionAnswer(questionId: string, correct: boolean): void {
  const progress = getLocalProgress();

  if (!progress.questionsAnswered[questionId]) {
    progress.questionsAnswered[questionId] = [];
  }

  progress.questionsAnswered[questionId].push({
    correct,
    answeredAt: new Date().toISOString(),
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function saveQuizSession(
  categorySlug: string,
  score: number,
  totalQuestions: number
): void {
  const progress = getLocalProgress();

  progress.quizSessions.push({
    categorySlug,
    score,
    totalQuestions,
    completedAt: new Date().toISOString(),
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
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
