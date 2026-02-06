'use client';

import { useState, useEffect, useCallback } from 'react';
import { Question } from '@/types';
import ReliabilityBadge from './ReliabilityBadge';
import ReliabilityRating from './ReliabilityRating';

interface QuizCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (selectedIndex: number, correct: boolean) => void;
  mode: 'practice' | 'timed' | 'study';
}

const TIMER_SECONDS = 20;

export default function QuizCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  mode,
}: QuizCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [timerExpired, setTimerExpired] = useState(false);

  // Study mode states
  const [showAnswer, setShowAnswer] = useState(false);
  const [selfAssessment, setSelfAssessment] = useState<'correct' | 'incorrect' | null>(null);

  // Reliability rating states
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Reset states when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setShowResult(false);
    setTimeLeft(TIMER_SECONDS);
    setTimerExpired(false);
    setShowAnswer(false);
    setSelfAssessment(null);
    setShowRatingModal(false);
  }, [question.id]);

  // Timer for timed mode
  useEffect(() => {
    if (mode !== 'timed' || showResult || timerExpired) return;

    if (timeLeft <= 0) {
      setTimerExpired(true);
      setShowResult(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, timeLeft, showResult, timerExpired]);

  const handleSelectAnswer = (index: number) => {
    if (showResult || timerExpired) return;

    setSelectedAnswer(index);

    if (mode === 'practice') {
      setShowResult(true);
    }
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    setShowResult(true);
  };

  const handleNext = useCallback(() => {
    if (mode === 'study') {
      const correct = selfAssessment === 'correct';
      onAnswer(0, correct);
    } else {
      if (selectedAnswer === null && !timerExpired) return;
      const correct = selectedAnswer === question.correct_answer;
      onAnswer(selectedAnswer ?? -1, correct);
    }
    setSelectedAnswer(null);
    setShowResult(false);
    setShowAnswer(false);
    setSelfAssessment(null);
  }, [mode, selfAssessment, selectedAnswer, timerExpired, question.correct_answer, onAnswer]);

  const handleRevealAnswer = () => {
    setShowAnswer(true);
  };

  const handleSelfAssess = (assessment: 'correct' | 'incorrect') => {
    setSelfAssessment(assessment);
  };

  const getOptionStyle = (index: number) => {
    const baseStyle = 'w-full p-4 rounded-xl text-left transition-all border-2 ';

    if (!showResult && !timerExpired) {
      if (selectedAnswer === index) {
        return baseStyle + 'border-disney-blue bg-disney-blue/10 dark:border-disney-gold dark:bg-disney-gold/10';
      }
      return baseStyle + 'border-slate-200 dark:border-slate-600 hover:border-disney-blue dark:hover:border-disney-gold bg-white dark:bg-slate-800';
    }

    // Show results
    if (index === question.correct_answer) {
      return baseStyle + 'border-green-500 bg-green-50 dark:bg-green-900/20';
    }
    if (selectedAnswer === index && index !== question.correct_answer) {
      return baseStyle + 'border-red-500 bg-red-50 dark:bg-red-900/20';
    }
    return baseStyle + 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 opacity-60';
  };

  const difficultyColors = {
    easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  const getTimerColor = () => {
    if (timeLeft > 10) return 'text-green-600';
    if (timeLeft > 5) return 'text-yellow-600';
    return 'text-red-600 animate-pulse';
  };

  // Study Mode (Flashcard)
  if (mode === 'study') {
    return (
      <div className="animate-slide-up">
        {/* Rating Modal */}
        {showRatingModal && (
          <ReliabilityRating
            question={question}
            onClose={() => setShowRatingModal(false)}
          />
        )}

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
            <span>Card {questionNumber} of {totalQuestions}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColors[question.difficulty]}`}>
              {question.difficulty}
            </span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full progress-bar transition-all duration-300"
              style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Flashcard */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Reliability Badge */}
          <div className="px-6 pt-4 flex justify-between items-center">
            <ReliabilityBadge
              score={question.reliability_score ?? 1}
              totalRatings={question.total_ratings ?? 0}
              isUserContributed={question.is_user_contributed}
              cruiseName={question.cruise_name}
            />
            <button
              onClick={() => setShowRatingModal(true)}
              className="text-xs px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Rate
            </button>
          </div>

          {/* Question Side */}
          <div className="p-8 min-h-[200px] flex items-center justify-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center">
              {question.question}
            </h2>
          </div>

          {!showAnswer ? (
            <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              <button
                onClick={handleRevealAnswer}
                className="w-full px-6 py-4 rounded-xl font-medium btn-disney text-lg"
              >
                Reveal Answer
              </button>
            </div>
          ) : (
            <>
              {/* Answer Side */}
              <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-green-50 dark:bg-green-900/20 animate-fade-in">
                <div className="text-center mb-4">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Answer:</span>
                  <p className="text-xl font-bold text-green-700 dark:text-green-400 mt-1">
                    {question.options[question.correct_answer]}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">💡</span>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {question.explanation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Self Assessment */}
              <div className="p-6 border-t border-slate-200 dark:border-slate-700">
                {!selfAssessment ? (
                  <div>
                    <p className="text-center text-slate-600 dark:text-slate-400 mb-4">
                      Did you know this one?
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleSelfAssess('incorrect')}
                        className="flex-1 px-4 py-3 rounded-xl font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-colors"
                      >
                        Didn&apos;t Know
                      </button>
                      <button
                        onClick={() => handleSelfAssess('correct')}
                        className="flex-1 px-4 py-3 rounded-xl font-medium bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 transition-colors"
                      >
                        Knew It!
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleNext}
                    className="w-full px-6 py-3 rounded-xl font-medium btn-disney"
                  >
                    {questionNumber === totalQuestions ? 'See Results' : 'Next Card'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Practice and Timed Modes
  return (
    <div className="animate-slide-up">
      {/* Rating Modal */}
      {showRatingModal && (
        <ReliabilityRating
          question={question}
          onClose={() => setShowRatingModal(false)}
        />
      )}

      {/* Progress bar and Timer */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
          <span>Question {questionNumber} of {totalQuestions}</span>
          <div className="flex items-center gap-3">
            {mode === 'timed' && !showResult && (
              <span className={`font-mono font-bold text-lg ${getTimerColor()}`}>
                {timeLeft}s
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColors[question.difficulty]}`}>
              {question.difficulty}
            </span>
          </div>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full progress-bar transition-all duration-300"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>
        {/* Timer bar for timed mode */}
        {mode === 'timed' && !showResult && (
          <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full transition-all duration-1000 ${timeLeft > 10 ? 'bg-green-500' : timeLeft > 5 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${(timeLeft / TIMER_SECONDS) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Question */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        {/* Reliability Badge */}
        <div className="flex justify-between items-center mb-4">
          <ReliabilityBadge
            score={question.reliability_score ?? 1}
            totalRatings={question.total_ratings ?? 0}
            isUserContributed={question.is_user_contributed}
            cruiseName={question.cruise_name}
          />
        </div>

        {timerExpired && !selectedAnswer && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-400 text-center font-medium">
            Time&apos;s up!
          </div>
        )}

        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
          {question.question}
        </h2>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleSelectAnswer(index)}
              disabled={showResult || timerExpired}
              className={getOptionStyle(index)}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm font-medium">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="text-slate-900 dark:text-white">{option}</span>
                {(showResult || timerExpired) && index === question.correct_answer && (
                  <span className="ml-auto text-green-600">✓</span>
                )}
                {(showResult || timerExpired) && selectedAnswer === index && index !== question.correct_answer && (
                  <span className="ml-auto text-red-600">✗</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Explanation */}
        {(showResult || timerExpired) && (
          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl animate-fade-in">
            <div className="flex items-start gap-2">
              <span className="text-xl">💡</span>
              <div className="flex-1">
                <p className="font-medium text-slate-900 dark:text-white mb-1">
                  {timerExpired && !selectedAnswer
                    ? 'Time ran out!'
                    : selectedAnswer === question.correct_answer
                    ? 'Correct!'
                    : 'Not quite!'}
                </p>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {question.explanation}
                </p>
              </div>
            </div>
            {/* Rate Answer Button */}
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowRatingModal(true)}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-disney-blue dark:hover:text-disney-gold transition-colors flex items-center gap-1"
              >
                <span>📊</span>
                <span>Is this answer correct? Rate reliability</span>
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          {!showResult && !timerExpired && mode === 'timed' && (
            <button
              onClick={handleSubmit}
              disabled={selectedAnswer === null}
              className="px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-disney"
            >
              Submit Answer
            </button>
          )}
          {(showResult || timerExpired) && (
            <button
              onClick={handleNext}
              className="px-6 py-3 rounded-xl font-medium btn-disney"
            >
              {questionNumber === totalQuestions ? 'See Results' : 'Next Question'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
