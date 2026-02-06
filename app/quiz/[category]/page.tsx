'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import QuizCard from '@/components/QuizCard';
import Confetti from '@/components/Confetti';
import { Question } from '@/types';
import { saveQuestionAnswer, saveQuizSession } from '@/lib/progress';

interface QuizPageProps {
  params: Promise<{ category: string }>;
}

type QuizMode = 'practice' | 'timed' | 'study';

export default function QuizCategoryPage({ params }: QuizPageProps) {
  const { category } = use(params);
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: string; correct: boolean }[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<QuizMode>('practice');
  const [showModeSelect, setShowModeSelect] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    async function loadQuestions() {
      try {
        const res = await fetch(`/api/questions?category=${category}&limit=10`);
        const data = await res.json();
        setQuestions(data.questions || []);
      } catch (error) {
        console.error('Failed to load questions:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadQuestions();
  }, [category]);

  const handleAnswer = (selectedIndex: number, correct: boolean) => {
    const currentQuestion = questions[currentIndex];

    // Save answer locally
    saveQuestionAnswer(currentQuestion.id, correct);

    // Update state
    setAnswers([...answers, { questionId: currentQuestion.id, correct }]);
    if (correct) {
      setScore(score + 1);
    }

    if (currentIndex + 1 >= questions.length) {
      // Quiz complete
      setIsComplete(true);
      const finalScore = correct ? score + 1 : score;
      saveQuizSession(category, finalScore, questions.length);

      // Show confetti if score is good
      if (finalScore / questions.length >= 0.7) {
        setShowConfetti(true);
      }
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleStartQuiz = (selectedMode: QuizMode) => {
    setMode(selectedMode);
    setShowModeSelect(false);
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setScore(0);
    setAnswers([]);
    setIsComplete(false);
    setShowModeSelect(true);
    setShowConfetti(false);
  };

  const getCategoryName = (slug: string) => {
    const names: Record<string, string> = {
      movies: 'Disney Movies & Characters',
      parks: 'Disney Parks & History',
      cruise: 'Disney Cruise Line',
      mixed: 'Mixed/Random',
    };
    return names[slug] || slug;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">✨</div>
          <p className="text-slate-600 dark:text-slate-400">Loading trivia questions...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">😕</div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          No Questions Found
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          We could not find any questions for this category.
        </p>
        <button
          onClick={() => router.push('/quiz')}
          className="px-6 py-3 rounded-xl font-medium btn-disney"
        >
          Back to Categories
        </button>
      </div>
    );
  }

  // Mode selection screen
  if (showModeSelect) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {getCategoryName(category)}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {questions.length} questions ready. Choose your quiz mode:
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              mode: 'practice' as QuizMode,
              title: 'Practice Mode',
              description: 'See answers immediately. Perfect for learning.',
              icon: '📝',
            },
            {
              mode: 'timed' as QuizMode,
              title: 'Timed Challenge',
              description: 'Submit your answer, then see if you were right.',
              icon: '⏱️',
            },
            {
              mode: 'study' as QuizMode,
              title: 'Study Mode',
              description: 'Review questions one by one at your own pace.',
              icon: '📚',
            },
          ].map((item) => (
            <button
              key={item.mode}
              onClick={() => handleStartQuiz(item.mode)}
              className="w-full bg-white dark:bg-slate-800 rounded-xl p-6 text-left border-2 border-slate-200 dark:border-slate-700 hover:border-disney-blue dark:hover:border-disney-gold transition-colors card-hover"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">{item.icon}</div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {item.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Quiz complete screen
  if (isComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    const incorrectAnswers = answers.filter(a => !a.correct);

    return (
      <div className="max-w-2xl mx-auto">
        {showConfetti && <Confetti />}

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
          <div className="text-6xl mb-4">
            {percentage >= 90 ? '🏆' : percentage >= 70 ? '🌟' : percentage >= 50 ? '👍' : '📚'}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Quiz Complete!
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {getCategoryName(category)}
          </p>

          {/* Score */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 mb-6">
            <div className="text-5xl font-bold text-disney-blue dark:text-disney-gold mb-2">
              {score}/{questions.length}
            </div>
            <div className="text-xl text-slate-600 dark:text-slate-400">
              {percentage}% Correct
            </div>
          </div>

          {/* Message */}
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {percentage >= 90
              ? "Outstanding! You're a true Disney expert!"
              : percentage >= 70
              ? "Great job! You really know your Disney trivia!"
              : percentage >= 50
              ? "Good effort! Keep studying to improve."
              : "Keep practicing! Every Disney fan starts somewhere."}
          </p>

          {/* Review Mistakes */}
          {incorrectAnswers.length > 0 && (
            <div className="text-left mb-6">
              <h3 className="font-bold text-slate-900 dark:text-white mb-3">
                Review Your Mistakes ({incorrectAnswers.length})
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {incorrectAnswers.map((answer) => {
                  const q = questions.find(q => q.id === answer.questionId);
                  if (!q) return null;
                  return (
                    <div
                      key={answer.questionId}
                      className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800"
                    >
                      <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                        {q.question}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Correct: {q.options[q.correct_answer]}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRetry}
              className="flex-1 px-6 py-3 rounded-xl font-medium btn-disney"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/quiz')}
              className="flex-1 px-6 py-3 rounded-xl font-medium bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Choose Category
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active quiz
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.push('/quiz')}
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Categories
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
          {getCategoryName(category)}
        </h1>
      </div>

      <QuizCard
        question={questions[currentIndex]}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        onAnswer={handleAnswer}
        mode={mode}
      />
    </div>
  );
}
