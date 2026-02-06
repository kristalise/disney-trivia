'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Category } from '@/types';

interface FormData {
  category_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  cruise_name: string;
}

const initialFormData: FormData = {
  category_id: '',
  question: '',
  options: ['', '', '', ''],
  correct_answer: 0,
  explanation: '',
  difficulty: 'medium',
  cruise_name: '',
};

const CRUISE_OPTIONS = [
  'Disney Magic',
  'Disney Wonder',
  'Disney Dream',
  'Disney Fantasy',
  'Disney Wish',
  'Disney Treasure',
  'Disney Destiny',
  'Disney Adventure',
  'Other/Unknown',
];

export default function ContributePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCategories();
  }, []);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.category_id) {
      setError('Please select a category');
      return;
    }
    if (!formData.question.trim()) {
      setError('Please enter a question');
      return;
    }
    if (formData.options.some(opt => !opt.trim())) {
      setError('Please fill in all answer options');
      return;
    }
    if (!formData.explanation.trim()) {
      setError('Please provide an explanation for the correct answer');
      return;
    }
    if (!formData.cruise_name) {
      setError('Please select which cruise this question was asked on');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit question');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit question');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAnother = () => {
    setFormData(initialFormData);
    setSubmitted(false);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">✨</div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Question Submitted!
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Thank you for contributing to the Disney Trivia database!
            Your question will help other Disney fans study for their cruise trivia nights.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleAddAnother}
              className="px-6 py-3 rounded-xl font-medium btn-disney"
            >
              Add Another Question
            </button>
            <button
              onClick={() => router.push('/quiz')}
              className="px-6 py-3 rounded-xl font-medium bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Take a Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Contribute a Question
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Share trivia questions from your Disney cruise experience to help others study!
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          {/* Cruise Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Which cruise was this question asked on? <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.cruise_name}
              onChange={(e) => setFormData({ ...formData, cruise_name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
            >
              <option value="">Select a cruise ship...</option>
              {CRUISE_OPTIONS.map((cruise) => (
                <option key={cruise} value={cruise}>{cruise}</option>
              ))}
            </select>
          </div>

          {/* Category Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
            >
              <option value="">Select a category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Question */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Question <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="Enter your trivia question..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
              rows={3}
            />
          </div>

          {/* Answer Options */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Answer Options <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, correct_answer: index })}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                      formData.correct_answer === index
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-green-100 dark:hover:bg-green-900/30'
                    }`}
                    title={formData.correct_answer === index ? 'Correct answer' : 'Click to mark as correct'}
                  >
                    {formData.correct_answer === index ? '✓' : String.fromCharCode(65 + index)}
                  </button>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Click the letter button to mark the correct answer (currently: {String.fromCharCode(65 + formData.correct_answer)})
            </p>
          </div>

          {/* Explanation */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Explanation <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              placeholder="Explain why this is the correct answer..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
              rows={2}
            />
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Difficulty
            </label>
            <div className="flex gap-3">
              {(['easy', 'medium', 'hard'] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setFormData({ ...formData, difficulty: diff })}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium capitalize transition-all ${
                    formData.difficulty === diff
                      ? diff === 'easy'
                        ? 'bg-green-500 text-white'
                        : diff === 'medium'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-red-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-6 py-4 rounded-xl font-medium btn-disney text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Question'}
        </button>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-400">
          <div className="flex items-start gap-2">
            <span className="text-lg">ℹ️</span>
            <div>
              <p className="font-medium mb-1">Contribution Guidelines</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Questions should be from actual Disney cruise trivia nights</li>
                <li>Make sure the answer you mark as correct is accurate</li>
                <li>Other users can rate question reliability</li>
                <li>Low-reliability questions may be reviewed or removed</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
