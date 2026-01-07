import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Quizzes, Question, Quiz } from '../quizzes';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-test-screen',
  imports: [FormsModule],
  template: /*html*/`
    <div id="back-button" class="button" (click)="goToSearchScreen()">
      <i class="fa-solid fa-arrow-left"></i> Back
    </div>
    <h1 class="centered title">{{title}}</h1>
    
    @if (questions().length > 0) {
      <div class="test-container">
        <div class="progress-bar" role="progressbar" aria-valuemin="0" [attr.aria-valuenow]="progressPercentRounded()" aria-valuemax="100">
          <div class="progress-text centered">
            Question {{currentQuestionIndex() + 1}} of {{questions().length}}
          </div>  
          <div class="progress-track">
            <div class="progress-fill" [style.width.%]="progressPercent()"></div>
            <span>{{answeredCount()}} answered ({{progressPercentRounded()}}%)</span>
          </div>
          <div class="correct-track">
            <div class="correct-fill" [style.width.%]="correctOfTotalPercent()"></div>
            <span>{{correctCount()}} correct ({{correctPercentRounded()}}%)</span>
          </div>
        </div>
        
        <div class="question-card container">
          <h2 class="question-text">{{currentQuestion().term}}</h2>
          
          <div class="answer-section">
            @if (!showAnswer()) {
              <input 
                type="text" 
                class="answer-input" 
                [(ngModel)]="userAnswer"
                placeholder="Type your answer here..."
                (keyup.enter)="checkAnswer()">
              <button class="button check-button" (click)="checkAnswer()">Check Answer</button>
            } @else {
              <div class="answer-reveal" [class.correct]="isCurrentAnswerCorrect()" [class.incorrect]="!isCurrentAnswerCorrect()">
                <div class="result-indicator">
                  @if (isCurrentAnswerCorrect()) {
                    <i class="fa-solid fa-circle-check"></i>
                    <h3>Correct!</h3>
                  } @else {
                    <i class="fa-solid fa-circle-xmark"></i>
                    <h3>Incorrect</h3>
                  }
                </div>
                <div class="answer-details">
                  <div>
                    <p class="correct-answer-label">Correct Answer:</p>
                    <p class="correct-answer">{{currentQuestion().definition}}</p>
                </div>
                  @if (!isCurrentAnswerCorrect()) {
                    <div>
                      <p class="user-answer-label">Your answer:</p>
                      <p class="user-answer">{{userAnswer}}</p>
                    </div>
                    <div id="i-was-right" class="button" (click)="claimCorrect()">I was right</div>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <div class="navigation-buttons">
          <button 
            class="button nav-button" 
            (click)="previousQuestion()" 
            [disabled]="currentQuestionIndex() === 0">
            <i class="fa-solid fa-chevron-left"></i> Previous
          </button>
          @if(currentQuestionIndex() < questions().length - 1) {
            <button 
              class="button nav-button" 
              (click)="nextQuestion()">
              Next <i class="fa-solid fa-chevron-right"></i>
            </button>
          } @else {
            <button 
              id="view-results-button"
              class="button nav-button" 
              (click)="viewResults()">
              Results <i class="fa-solid fa-chevron-right"></i>
            </button>
          }
        </div>
      </div>
    } @else {
      <div class="centered" style="margin-top: 50px;">
        <p>No questions in this quiz yet.</p>
      </div>
    }


    @if(viewingResults()) {
      <div class="results-blur-background">
        <div class="results-container">
          <h1 class="centered title">{{title}}</h1>
          <h2 class="centered">Quiz Results</h2>
          <p class="centered">You answered {{correctCount()}} out of {{questions().length}} questions correctly ({{correctPercentRounded()}}%).</p>
          <div class="results-buttons-container centered">
            <div id="results-back" class="button results-button" (click)="goToSearchScreen()">Back to Quiz Selection</div>
            <div id="results-retake" class="button results-button" (click)="refresh()">Retake Quiz</div>
            <div id="results-close" class="button results-button" (click)="viewingResults.set(false)">Close</div>
          </div>
        </div>
      </div>
    }
  `,
  styles: /*css*/`
    .test-container {
      position: absolute;
      top: 60px;
      left: 10%;
      right: 10%;
      bottom: 10px;
      margin: 20px auto;
      padding: 10px;
      border-radius: 15px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 20px;
      border: 4px solid black;
      background-color: #e0e0e0;
      overflow: auto;
      scrollbar-color: gray transparent;
    }

    .progress-bar {
      background-color: var(--container-bg-color);
      border: 4px solid var(--elem-border-color);
      border-radius: 15px;
      padding: 15px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .progress-track, .correct-track {
      width: 100%;
      height: 18px;
      background: #2244aa;
      border: 2px solid var(--elem-border-color);
      border-radius: 999px;
      overflow: hidden;
      position: relative;
    }

    .progress-fill, .correct-fill {
      position: absolute;
      left: 0px;
      top: 0px;
      height: 100%;
      transition: width 200ms ease-out;
    }

    .progress-fill {
      background: linear-gradient(90deg, #9000ff, #bb00ff);
    }

    .correct-fill {
      background: linear-gradient(90deg, #00ff95ff, #00ff04ff);
    }

    .progress-track span, .correct-track span {
      position: absolute;
      width: 100%;
      text-align: center;
      font-weight: bold;
      user-select: none;
      z-index: 10;
    }

    .progress-text {
      text-align: center;
      font-size: 1rem;
      font-weight: bold;
    }

    .question-card {
      padding: 15px 40px;
      border-radius: 15px;
      display: flex;
      flex-direction: column;
      justify-content: space-evenly;
      border: 4px solid var(--elem-border-color);
      flex: 1;
    }

    .question-text {
      font-size: 28px;
      text-align: center;
      margin-bottom: 30px;
    }

    .answer-section {
      display: flex;
      flex-direction: column;
      gap: 15px;
      align-items: center;
    }

    .answer-input {
      width: 80%;
      padding: 15px;
      font-size: 18px;
      border: 2px solid var(--elem-border-color);
      border-radius: 10px;
      background-color: #e0e0e0;
      text-align: center;
    }

    .check-button {
      padding: 15px 40px;
      font-size: 18px;
      font-weight: bold;
      border-radius: 10px;
    }

    .answer-reveal {
      width: 80%;
      padding: 20px;
      background-color: var(--dark-elem-bg-color);
      border: 4px solid var(--dark-elem-border-color);
      border-radius: 10px;
      text-align: center;
      position: relative;
    }

    .answer-reveal.correct {
      border-color: #00aa00;
      background-color: #004400;
    }

    .answer-reveal.incorrect {
      border-color: #aa0000;
      background-color: #440000;
    }

    .result-indicator {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
    }

    .result-indicator i {
      font-size: 40px;
    }

    .answer-reveal.correct .result-indicator i {
      color: #00ff00;
    }

    .answer-reveal.incorrect .result-indicator i {
      color: #ff0000;
    }

    .result-indicator h3 {
      margin: 0;
      font-size: 20px;
    }

    .answer-reveal.correct .result-indicator h3 {
      color: #00ff00;
    }

    .answer-reveal.incorrect .result-indicator h3 {
      color: #ff0000;
    }

    .answer-details {
      border-top: 2px solid rgba(255, 255, 255, 0.2);
      padding-top: 20px;
      display: flex;
      flex-direction: row;
      justify-content: space-evenly;
    }

    .answer-reveal h3 {
      color: white;
      margin-top: 0;
    }

    .correct-answer-label,
    .user-answer-label {
      color: #cccccc;
      font-size: 16px;
      margin: 10px 0 5px 0;
      font-weight: bold;
    }

    .correct-answer {
      font-size: 22px;
      font-weight: bold;
      color: #00ff00;
      margin: 5px 0 15px 0;
    }

    .user-answer {
      font-size: 20px;
      color: #ffaa00;
      margin: 5px 0;
    }

    #i-was-right {
      position: absolute;
      bottom: 10px;
      right: 10px;
      border-radius: 10px;
    }

    .navigation-buttons {
      display: flex;
      justify-content: space-between;
      gap: 20px;
    }

    .nav-button {
      flex: 1;
      padding: 15px;
      font-size: 16px;
      font-weight: bold;
      border-radius: 10px;
    }

    .nav-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .nav-button:disabled:hover {
      background-color: var(--elem-bg-color);
      border-color: var(--elem-border-color);
    }

    #view-results-button {
      background-color: green;
      border-color: darkgreen;
      color: white;
    }

    #view-results-button:hover {
      background-color: #006600;
      border-color: #004400;
    }

    #back-button {
      position: absolute;
      left: 10px;
      top: 10px;
      border-radius: 10px;
    }


    .results-blur-background {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(5px);
      z-index: 50;
    }

    .results-container {
      position: absolute;
      top: 20%;
      left: 25%;
      right: 25%;
      bottom: 20%;
      padding: 20px;
      border-radius: 15px;
      border: 4px solid black;
      background-color: #e0e0e0;
      overflow: auto;
      scrollbar-color: gray transparent;
      z-index: 100;
    }

    .results-buttons-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 20px;
      width: 50%;
      margin-left: auto;
      margin-right: auto;
    }

    .results-button {
      display: inline-block;
      border-radius: 10px;
      width: 100%;
      font-weight: bold;
    }


    #results-back {
      background-color: #0067d5ff;
      border-color: #004a9aff;
      color: white;
    }

    #results-back:hover {
      background-color: #004ea0ff;
      border-color: #00356eff;
    }

    #results-retake {
      background-color: darkorange;
      border-color: orangered;
      color: white;
    }

    #results-retake:hover {
      background-color: #aa6600;
      border-color: #885500;
    }
    
    #results-close {
      background-color: red;
      border-color: darkred;
      color: white;
    }

    #results-close:hover {
      background-color: darkred;
      border-color: red;
    }
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

  anyAnswered(): boolean {
    return this.answeredCount() > 0;
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