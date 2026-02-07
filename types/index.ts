export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  created_at: string;
  question_count?: number;
}

export interface Question {
  id: string;
  category_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
  category?: Category;
  // User contribution fields
  is_user_contributed?: boolean;
  contributed_by?: string;
  cruise_name?: string;
  contributed_at?: string;
  // Reliability fields
  reliability_score?: number;
  total_ratings?: number;
  reliable_ratings?: number;
}

export interface QuestionRating {
  id: string;
  question_id: string;
  user_id?: string;
  session_id?: string;
  is_reliable: boolean;
  suggested_correct_answer?: number;
  suggested_explanation?: string;
  created_at: string;
}

export interface ContributeQuestionInput {
  category_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  cruise_name: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  question_id: string;
  correct: boolean;
  answered_at: string;
}

export interface QuizSession {
  id: string;
  user_id: string;
  category_id: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

export interface QuizState {
  questions: Question[];
  currentIndex: number;
  score: number;
  answers: { questionId: string; selectedAnswer: number; correct: boolean }[];
  isComplete: boolean;
  mode: 'practice' | 'timed' | 'study';
}

export interface LocalProgress {
  questionsAnswered: { [questionId: string]: { correct: boolean; answeredAt: string }[] };
  quizSessions: {
    categorySlug: string;
    score: number;
    totalQuestions: number;
    completedAt: string;
  }[];
}
