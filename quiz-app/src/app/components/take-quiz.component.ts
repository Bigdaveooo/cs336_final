import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Quiz, Question } from '../models';
import { QuizService } from '../quiz.service';

@Component({
  selector: 'app-take-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      @if (quiz() && !showResults()) {
        <div class="modal-content" style="position: static; max-width: 600px; margin: 2rem auto;">
          <h2 class="modal-title">{{ quiz()!.name }}</h2>
          <p>Question {{ currentQuestionIndex() + 1 }} of {{ quiz()!.questions.length }}</p>
          
          @if (currentQuestion()) {
            <div class="form-group">
              <label class="form-label">{{ currentQuestion()!.question }}</label>
              <input 
                type="text" 
                class="form-input" 
                [(ngModel)]="currentAnswer"
                placeholder="Enter your answer"
                (keyup.enter)="nextQuestion()"
              />
            </div>
            
            <div class="modal-buttons">
              @if (currentQuestionIndex() < quiz()!.questions.length - 1) {
                <button class="modal-button primary-button" (click)="nextQuestion()">
                  Next Question
                </button>
              } @else {
                <button class="modal-button primary-button" (click)="finishQuiz()">
                  Finish Quiz
                </button>
              }
              <button class="modal-button secondary-button" (click)="cancel()">
                Exit Quiz
              </button>
            </div>
          }
        </div>
      } @else if (showResults()) {
        <div class="modal-content" style="position: static; max-width: 600px; margin: 2rem auto;">
          <h2 class="modal-title">Quiz Complete!</h2>
          <h3 style="text-align: center; color: #4285f4; margin: 2rem 0;">
            Score: {{ score() }}/{{ totalQuestions() }} ({{ percentage() }}%)
          </h3>
          
          <div style="margin: 2rem 0;">
            <h4 style="margin-bottom: 1rem;">Results:</h4>
            @for (result of detailedResults(); track $index) {
              <div style="margin-bottom: 1rem; padding: 1rem; border-radius: 6px; background: #f8f9fa;">
                <p><strong>Q:</strong> {{ result.question }}</p>
                <p><strong>Your Answer:</strong> {{ result.userAnswer }}</p>
                <p><strong>Correct Answer:</strong> {{ result.correctAnswer }}</p>
                <p style="color: {{ result.isCorrect ? '#4caf50' : '#f44336' }};">
                  <strong>{{ result.isCorrect ? '✓ Correct' : '✗ Incorrect' }}</strong>
                </p>
              </div>
            }
          </div>
          
          <div class="modal-buttons">
            <button class="modal-button primary-button" (click)="retakeQuiz()">
              Retake Quiz
            </button>
            <button class="modal-button secondary-button" (click)="backToDashboard()">
              Back to Dashboard
            </button>
          </div>
        </div>
      } @else {
        <div style="text-align: center; padding: 2rem;">
          @if (quiz() && quiz()!.questions.length === 0) {
            <h2>This quiz has no questions yet</h2>
            <p>Please add some questions to this quiz before taking it.</p>
          } @else {
            <h2>Quiz not found</h2>
          }
          <button class="modal-button primary-button" (click)="cancel()">
            Back to Dashboard
          </button>
        </div>
      }
    </div>
  `
})
export class TakeQuizComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private quizService = inject(QuizService);

  quiz = signal<Quiz | null>(null);
  currentQuestionIndex = signal(0);
  currentAnswer = '';
  userAnswers: { questionId: string; answer: string }[] = [];
  showResults = signal(false);
  
  // Results
  score = signal(0);
  totalQuestions = signal(0);
  percentage = signal(0);
  detailedResults = signal<Array<{
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>>([]);

  currentQuestion = computed(() => {
    const quiz = this.quiz();
    if (!quiz) return null;
    return quiz.questions[this.currentQuestionIndex()] || null;
  });

  async ngOnInit() {
    const quizId = this.route.snapshot.params['id'];
    console.log('Taking quiz ID:', quizId);
    
    // For now, use sample data
    const sampleQuizzes: Quiz[] = [
      {
        id: '1',
        name: 'Harry Potter Trivia',
        categoryId: '1',
        questions: [
          { id: '1', question: 'Who is the main character?', answer: 'Harry Potter' },
          { id: '2', question: 'What school does he attend?', answer: 'Hogwarts' },
          { id: '3', question: 'What is his house?', answer: 'Gryffindor' },
          { id: '4', question: 'Who is his best friend?', answer: 'Ron Weasley' },
          { id: '5', question: 'What is his owl\'s name?', answer: 'Hedwig' }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        name: 'Christmas carol quiz',
        categoryId: '1',
        questions: [
          { id: '1', question: 'Who wrote A Christmas Carol?', answer: 'Charles Dickens' },
          { id: '2', question: 'What is the main character\'s name?', answer: 'Ebenezer Scrooge' },
          { id: '3', question: 'How many ghosts visit Scrooge?', answer: '4' }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Add more sample quizzes as needed
    ];

    const foundQuiz = sampleQuizzes.find(q => q.id === quizId);
    this.quiz.set(foundQuiz || null);
    
    // Reset state
    this.currentQuestionIndex.set(0);
    this.currentAnswer = '';
    this.userAnswers = [];
    this.showResults.set(false);
  }

  nextQuestion() {
    const currentQ = this.currentQuestion();
    if (!currentQ) return;

    // Save current answer
    this.userAnswers.push({
      questionId: currentQ.id,
      answer: this.currentAnswer.trim()
    });

    this.currentQuestionIndex.update(index => index + 1);
    this.currentAnswer = '';
  }

  finishQuiz() {
    const currentQ = this.currentQuestion();
    if (!currentQ || !this.quiz()) return;

    // Save final answer
    this.userAnswers.push({
      questionId: currentQ.id,
      answer: this.currentAnswer.trim()
    });

    // Calculate score
    let correctCount = 0;
    const results: Array<{
      question: string;
      userAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
    }> = [];

    for (const userAnswer of this.userAnswers) {
      const question = this.quiz()!.questions.find(q => q.id === userAnswer.questionId);
      if (question) {
        const isCorrect = userAnswer.answer.toLowerCase().trim() === question.answer.toLowerCase().trim();
        if (isCorrect) correctCount++;
        
        results.push({
          question: question.question,
          userAnswer: userAnswer.answer || '(No answer)',
          correctAnswer: question.answer,
          isCorrect
        });
      }
    }

    const total = this.quiz()!.questions.length;
    const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    this.score.set(correctCount);
    this.totalQuestions.set(total);
    this.percentage.set(percent);
    this.detailedResults.set(results);
    this.showResults.set(true);
  }

  retakeQuiz() {
    this.currentQuestionIndex.set(0);
    this.currentAnswer = '';
    this.userAnswers = [];
    this.showResults.set(false);
  }

  backToDashboard() {
    this.router.navigate(['/']);
  }

  cancel() {
    this.router.navigate(['/']);
  }
}