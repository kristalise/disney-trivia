'use client';

import { useState } from 'react';
import { Question, Category } from '@/types';

interface QuestionCardProps {
  question: Question & { category?: Category };
}

export default function QuestionCard({ question }: QuestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const difficultyColors = {
    easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {question.category && (
                <span className="text-xs font-medium text-disney-blue dark:text-disney-gold bg-disney-blue/10 dark:bg-disney-gold/10 px-2 py-1 rounded-full">
                  {question.category.name}
                </span>
              )}
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${difficultyColors[question.difficulty]}`}>
                {question.difficulty}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {question.question}
            </h3>
          </div>
          <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <svg
              className="w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 animate-slide-up">
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            {/* Options */}
            <div className="space-y-2 mb-4">
              {question.options.map((option, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg flex items-center gap-3 ${
                    index === question.correct_answer
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-slate-50 dark:bg-slate-900'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-xs font-medium border border-slate-200 dark:border-slate-600">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className={index === question.correct_answer ? 'font-medium' : ''}>
                    {option}
                  </span>
                  {index === question.correct_answer && (
                    <span className="ml-auto text-green-600 dark:text-green-400 text-sm font-medium">
                      ✓ Correct
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Explanation */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <span className="text-lg">💡</span>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white text-sm mb-1">
                    Explanation
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {question.explanation}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
