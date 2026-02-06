'use client';

import { useState } from 'react';
import { Question } from '@/types';

interface ReliabilityRatingProps {
  question: Question;
  onClose: () => void;
  onRatingSubmitted?: () => void;
}

export default function ReliabilityRating({
  question,
  onClose,
  onRatingSubmitted,
}: ReliabilityRatingProps) {
  const [isReliable, setIsReliable] = useState<boolean | null>(null);
  const [suggestedAnswer, setSuggestedAnswer] = useState<number>(question.correct_answer);
  const [suggestedExplanation, setSuggestedExplanation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (isReliable === null) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: question.id,
          is_reliable: isReliable,
          suggested_correct_answer: isReliable ? undefined : suggestedAnswer,
          suggested_explanation: isReliable ? undefined : suggestedExplanation || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit rating');
      }

      setSubmitted(true);
      onRatingSubmitted?.();

      // Close after showing success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full text-center animate-fade-in">
          <div className="text-5xl mb-4">✨</div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Thank You!
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Your feedback helps improve our trivia database.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Rate Question Reliability
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Question Preview */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 mb-6">
          <p className="font-medium text-slate-900 dark:text-white mb-3">
            {question.question}
          </p>
          <div className="space-y-2">
            {question.options.map((option, index) => (
              <div
                key={index}
                className={`text-sm px-3 py-2 rounded-lg ${
                  index === question.correct_answer
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {String.fromCharCode(65 + index)}. {option}
                {index === question.correct_answer && ' ✓'}
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            <strong>Explanation:</strong> {question.explanation}
          </p>
        </div>

        {/* Rating Selection */}
        <div className="mb-6">
          <p className="font-medium text-slate-900 dark:text-white mb-3">
            Is this answer correct and reliable?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setIsReliable(true)}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                isReliable === true
                  ? 'bg-green-500 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
              }`}
            >
              ✓ Yes, it&apos;s correct
            </button>
            <button
              onClick={() => setIsReliable(false)}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                isReliable === false
                  ? 'bg-red-500 text-white'
                  : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              ✗ No, it&apos;s wrong
            </button>
          </div>
        </div>

        {/* Correction Form (shown when marking as unreliable) */}
        {isReliable === false && (
          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl animate-fade-in">
            <p className="font-medium text-slate-900 dark:text-white mb-3">
              What should the correct answer be?
            </p>
            <div className="space-y-2 mb-4">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setSuggestedAnswer(index)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    suggestedAnswer === index
                      ? 'bg-disney-blue text-white dark:bg-disney-gold dark:text-slate-900'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white'
                  }`}
                >
                  {String.fromCharCode(65 + index)}. {option}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Additional explanation (optional)
              </label>
              <textarea
                value={suggestedExplanation}
                onChange={(e) => setSuggestedExplanation(e.target.value)}
                placeholder="Why is this the correct answer?"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-xl font-medium bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isReliable === null || isSubmitting}
            className="flex-1 px-6 py-3 rounded-xl font-medium btn-disney disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  );
}
