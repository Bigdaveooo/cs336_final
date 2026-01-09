import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Quizzes, Question } from '../quizzes';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-test-screen',
  imports: [FormsModule],
  template: /*html*/`
    <div class="app-container take-quiz-page">
      <header class="take-quiz-header">
        <button type="button" class="button btn-secondary back-btn" (click)="goToSearchScreen()">
          <i class="fa-solid fa-arrow-left"></i>
          <span>Back</span>
        </button>

        <div class="take-quiz-title">
          <h1 class="title">{{title}}</h1>
          @if (questions().length > 0) {
            <p class="subtitle">Question {{currentQuestionIndex() + 1}} of {{questions().length}}</p>
          }
        </div>

        <div class="header-spacer"></div>
      </header>

      <main class="take-quiz-main">
        @if (questions().length > 0) {
          <div class="take-quiz-layout">
            <section class="card progress-card" aria-label="Quiz progress">
              <div class="progress-row">
                <div class="progress-label">Progress</div>
                <div class="progress-meta">{{answeredCount()}} / {{questions().length}} answered ({{progressPercentRounded()}}%)</div>
              </div>
              <div class="bar" role="progressbar" aria-valuemin="0" [attr.aria-valuenow]="progressPercentRounded()" aria-valuemax="100">
                <div class="bar-fill bar-fill-accent" [style.width.%]="progressPercent()"></div>
              </div>

              <div class="progress-row" style="margin-top: 0.875rem;">
                <div class="progress-label">Correct</div>
                <div class="progress-meta">{{correctCount()}} correct ({{correctPercentRounded()}}%)</div>
              </div>
              <div class="bar" aria-label="Correct answers">
                <div class="bar-fill bar-fill-success" [style.width.%]="correctOfTotalPercent()"></div>
              </div>
            </section>

            <section class="card question-card" aria-label="Question">
              <h2 class="question-text">{{currentQuestion().term}}</h2>

              <div class="answer-section">
                @if (!showAnswer()) {
                  <input
                    type="text"
                    class="answer-input"
                    [(ngModel)]="userAnswer"
                    placeholder="Type your answer here…"
                    (keyup.enter)="checkAnswer()">
                  <button type="button" class="button check-button" (click)="checkAnswer()">Check Answer</button>
                } @else {
                  <div class="answer-reveal" [class.correct]="isCurrentAnswerCorrect()" [class.incorrect]="!isCurrentAnswerCorrect()">
                    <div class="result-indicator">
                      @if (isCurrentAnswerCorrect()) {
                        <i class="fa-solid fa-circle-check"></i>
                        <h3>Correct</h3>
                      } @else {
                        <i class="fa-solid fa-circle-xmark"></i>
                        <h3>Incorrect</h3>
                      }
                    </div>

                    <div class="answer-details">
                      <div class="answer-block">
                        <p class="answer-label">Correct Answer</p>
                        <p class="answer-value">{{currentQuestion().definition}}</p>
                      </div>

                      @if (!isCurrentAnswerCorrect()) {
                        <div class="answer-block">
                          <p class="answer-label">Your Answer</p>
                          <p class="answer-value user">{{userAnswer}}</p>
                        </div>

                        <div class="claim-row">
                          <button type="button" class="button btn-secondary" (click)="claimCorrect()">I was right</button>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </section>

            <section class="nav-row" aria-label="Navigation">
              <button
                type="button"
                class="button btn-secondary nav-button"
                (click)="previousQuestion()"
                [disabled]="currentQuestionIndex() === 0">
                <i class="fa-solid fa-chevron-left"></i>
                <span>Previous</span>
              </button>

              @if(currentQuestionIndex() < questions().length - 1) {
                <button
                  type="button"
                  class="button nav-button"
                  (click)="nextQuestion()">
                  <span>Next</span>
                  <i class="fa-solid fa-chevron-right"></i>
                </button>
              } @else {
                <button
                  type="button"
                  class="button nav-button results-button"
                  (click)="viewResults()">
                  <span>Results</span>
                  <i class="fa-solid fa-chevron-right"></i>
                </button>
              }
            </section>
          </div>
        } @else {
          <div class="empty-state">
            <h2>No questions yet</h2>
            <p>This quiz doesn’t have any questions. Add some questions, then try again.</p>
            <button type="button" class="button btn-secondary" (click)="goToSearchScreen()">Back to Quiz Selection</button>
          </div>
        }
      </main>

      @if(viewingResults()) {
        <div class="modal-backdrop" (click)="viewingResults.set(false)">
          <div class="modal-card results-modal" (click)="$event.stopPropagation()">
            <h2 class="results-title">Quiz Results</h2>
            <p class="results-summary">You answered {{correctCount()}} out of {{questions().length}} correctly ({{correctPercentRounded()}}%).</p>

            <div class="results-actions">
              <button type="button" class="button btn-secondary" (click)="goToSearchScreen()">Back to Quiz Selection</button>
              <button type="button" class="button" (click)="refresh()">Retake Quiz</button>
              <button type="button" class="button btn-secondary" (click)="viewingResults.set(false)">Close</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class TakeQuiz {
  id = signal(0);
  quizzesService = inject(Quizzes);
  questions = signal<Question[]>([]);
  quiz = signal<any>(null);
  currentQuestionIndex = signal(0);
  showAnswer = signal(false);
  userAnswer = '';

  // Track answers, submitted state, and correctness for each question by question ID
  private answerMap = new Map<number, { answer: string; submitted: boolean; correct: boolean }>();

  private activatedRoute = inject(ActivatedRoute);

  constructor() {
    this.activatedRoute.params.subscribe((params) => {
      this.id.set(parseInt(params['id']));
    });

    this.quizzesService.fetchedQuestions$.subscribe((_: any) => {
      this.questions.set(this.quizzesService.getQuizQuestions(this.id()));
      this.quiz.set(this.quizzesService.getQuizByID(this.id()));
    });
  }

  currentQuestion() {
    return this.questions()[this.currentQuestionIndex()];
  }

  checkAnswer() {
    const questionId = this.currentQuestion().id;

    const reducedUserAnswer = this.userAnswer.trim().toLocaleLowerCase();
    const reducedCorrectAnswer = this.currentQuestion().definition.trim().toLocaleLowerCase();
    const isCorrect = reducedUserAnswer === reducedCorrectAnswer;

    this.answerMap.set(questionId, { answer: this.userAnswer, submitted: true, correct: isCorrect });
    this.showAnswer.set(true);
  }

  nextQuestion() {
    if (this.currentQuestionIndex() < this.questions().length - 1) {
      this.saveCurrentAnswer();
      this.currentQuestionIndex.set(this.currentQuestionIndex() + 1);
      this.loadQuestionState();
    }
  }

  previousQuestion() {
    if (this.currentQuestionIndex() > 0) {
      this.saveCurrentAnswer();
      this.currentQuestionIndex.set(this.currentQuestionIndex() - 1);
      this.loadQuestionState();
    }
  }

  private saveCurrentAnswer() {
    const questionId = this.currentQuestion().id;
    // Only save if not already submitted (submitted answers are already saved)
    if (!this.showAnswer()) {
      this.answerMap.set(questionId, { answer: this.userAnswer, submitted: false, correct: false });
    }
  }

  claimCorrect() {
    const questionId = this.currentQuestion().id;
    this.answerMap.set(questionId, { answer: this.userAnswer, submitted: true, correct: true });
    this.showAnswer.set(true);
  }

  private loadQuestionState() {
    const questionId = this.currentQuestion().id;
    const savedState = this.answerMap.get(questionId);
    
    if (savedState) {
      this.userAnswer = savedState.answer;
      this.showAnswer.set(savedState.submitted);
    } else {
      this.userAnswer = '';
      this.showAnswer.set(false);
    }
  }

  isCurrentAnswerCorrect(): boolean {
    const questionId = this.currentQuestion().id;
    const savedState = this.answerMap.get(questionId);
    return savedState?.correct ?? false;
  }

  get title(): string {
    return this.quiz() ? this.quiz().title : '...';
  }

  goToSearchScreen(): void {
    window.location.href = `/`;
  }

  answeredCount(): number {
    const qs = this.questions();
    let count = 0;
    for (const q of qs) {
      const s = this.answerMap.get(q.id);
      if (s?.submitted) count++;
    }
    return count;
  }

  progressPercent(): number {
    const total = this.questions().length;
    if (!total) return 0;
    return (this.answeredCount() / total) * 100;
  }

  progressPercentRounded(): number {
    return Math.round(this.progressPercent());
  }

  correctCount(): number {
    const qs = this.questions();
    let count = 0;
    for (const q of qs) {
      const s = this.answerMap.get(q.id);
      if (s?.correct) count++;
    }
    return count;
  }

  correctPercent(): number {
    const answered = this.answeredCount();
    if (!answered) return 0;
    return Math.round((this.correctCount() / answered) * 100);
  }

  correctOfTotalPercent(): number {
    const total = this.questions().length;
    if (!total) return 0;
    return (this.correctCount() / total) * 100;
  }

  correctPercentRounded(): number {
    return Math.round(this.correctPercent());
  }

  viewingResults = signal(false);

  viewResults() {
    if (this.answeredCount() < this.questions().length) {
      const confirmProceed = confirm('You have unanswered questions. Are you sure you want to view results?');
      if (!confirmProceed) {
        return;
      }
    }

    this.viewingResults.set(true);
  }

  refresh() {
    window.location.reload();
  }
}