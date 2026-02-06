'use client';

import { useState, useEffect } from 'react';
import ProgressChart from '@/components/ProgressChart';
import {
  getLocalProgress,
  getOverallAccuracy,
  getAccuracyByCategory,
  getTotalQuestionsAnswered,
  getRecentQuizzes,
  fetchUserProgress,
} from '@/lib/progress';
import { Category } from '@/types';
import { useAuth } from '@/components/AuthProvider';

export default function ProgressPage() {
  const { user, loading: authLoading } = useAuth();
  const [overallAccuracy, setOverallAccuracy] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [categoryAccuracy, setCategoryAccuracy] = useState<{ label: string; value: number; color: string }[]>([]);
  const [recentQuizzes, setRecentQuizzes] = useState<ReturnType<typeof getRecentQuizzes>>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [dataSource, setDataSource] = useState<'local' | 'cloud'>('local');

  useEffect(() => {
    async function loadData() {
      // Load categories
      try {
        const res = await fetch('/api/questions?categoriesOnly=true');
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }

      // Try to load from cloud if user is logged in
      if (user) {
        try {
          const cloudProgress = await fetchUserProgress();
          if (cloudProgress) {
            const accuracy = cloudProgress.questionsAnswered > 0
              ? Math.round((cloudProgress.correctAnswers / cloudProgress.questionsAnswered) * 100)
              : 0;
            setOverallAccuracy(accuracy);
            setTotalAnswered(cloudProgress.questionsAnswered);
            setRecentQuizzes(cloudProgress.quizSessions.slice(0, 10));
            setDataSource('cloud');
            setIsLoaded(true);
            return;
          }
        } catch (error) {
          console.error('Failed to load cloud progress:', error);
        }
      }

      // Fall back to local storage
      setOverallAccuracy(getOverallAccuracy());
      setTotalAnswered(getTotalQuestionsAnswered());
      setRecentQuizzes(getRecentQuizzes(10));
      setDataSource('local');
      setIsLoaded(true);
    }

    if (!authLoading) {
      loadData();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (categories.length > 0) {
      const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'];
      const accuracy = categories.map((cat, index) => ({
        label: cat.name,
        value: getAccuracyByCategory(cat.slug),
        color: colors[index % colors.length],
      }));
      setCategoryAccuracy(accuracy);
    }
  }, [categories]);

  const getCategoryName = (slug: string) => {
    const cat = categories.find(c => c.slug === slug);
    return cat?.name || slug;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isLoaded || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">📊</div>
          <p className="text-slate-600 dark:text-slate-400">Loading your progress...</p>
        </div>
      </div>
    );
  }

  const hasProgress = totalAnswered > 0 || recentQuizzes.length > 0;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Your Progress
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Track your Disney trivia journey
        </p>
        {user ? (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Progress synced to cloud
          </div>
        ) : (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Sign in to sync progress across devices
          </div>
        )}
      </div>

      {!hasProgress ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            No Progress Yet
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
            Start taking quizzes to track your progress and see your improvement over time!
          </p>
          <a
            href="/quiz"
            className="inline-block px-6 py-3 rounded-xl font-medium btn-disney"
          >
            Take Your First Quiz
          </a>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-4xl mb-2">🎯</div>
              <div className="text-3xl font-bold text-disney-blue dark:text-disney-gold mb-1">
                {overallAccuracy}%
              </div>
              <div className="text-slate-600 dark:text-slate-400">Overall Accuracy</div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-4xl mb-2">❓</div>
              <div className="text-3xl font-bold text-disney-blue dark:text-disney-gold mb-1">
                {totalAnswered}
              </div>
              <div className="text-slate-600 dark:text-slate-400">Questions Answered</div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-4xl mb-2">📝</div>
              <div className="text-3xl font-bold text-disney-blue dark:text-disney-gold mb-1">
                {recentQuizzes.length}
              </div>
              <div className="text-slate-600 dark:text-slate-400">Quizzes Completed</div>
            </div>
          </div>

          {/* Category Breakdown */}
          {categoryAccuracy.some(c => c.value > 0) && (
            <ProgressChart data={categoryAccuracy} title="Accuracy by Category" />
          )}

          {/* Recent Quizzes */}
          {recentQuizzes.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                Recent Quizzes
              </h3>
              <div className="space-y-3">
                {recentQuizzes.map((quiz, index) => {
                  const percentage = Math.round((quiz.score / quiz.totalQuestions) * 100);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {getCategoryName(quiz.categorySlug)}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {formatDate(quiz.completedAt)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${
                          percentage >= 70 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {quiz.score}/{quiz.totalQuestions}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {percentage}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="bg-disney-gradient rounded-xl p-6 text-white">
            <h3 className="font-bold text-lg mb-3">💡 Tips to Improve</h3>
            <ul className="space-y-2 text-white/90">
              {categoryAccuracy.filter(c => c.value > 0 && c.value < 60).length > 0 && (
                <li>Focus on categories where you score below 60%</li>
              )}
              <li>Use Practice mode to learn explanations for each answer</li>
              <li>Search for specific topics you want to study</li>
              <li>Take quizzes regularly to reinforce your memory</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
