// Data models for the Quiz Maker App

export interface Question {
  id: string;
  question: string;
  answer: string;
}

export interface Quiz {
  id: string;
  name: string;
  categoryId: string;
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  isExpanded: boolean;
  createdAt: Date;
}

export interface QuizResult {
  quizId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  answers: { questionId: string; userAnswer: string; isCorrect: boolean }[];
  completedAt: Date;
}

export interface CreateQuizRequest {
  name: string;
  categoryId?: string;
  newCategoryName?: string;
}

export interface QuizTakeState {
  currentQuestionIndex: number;
  answers: { questionId: string; answer: string }[];
  startTime: Date;
}