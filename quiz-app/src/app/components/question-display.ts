import { Component, Input, inject } from '@angular/core';
import { Quizzes } from '../quizzes';
import { CdkDragHandle } from '@angular/cdk/drag-drop';

@Component({
  selector: 'question-display',
  imports: [CdkDragHandle],
  template: /*html*/`
    <div class="question-display-container">
      <div class="row">
        <i class="fa-solid fa-grip-lines drag-handle" cdkDragHandle></i>

        <div class="fields">
          <div class="field">
            <label class="field-label" [attr.for]="'question-input-' + questionId">
              QUESTION @if (questionNumber) { {{ questionNumber }} }
            </label>
            <textarea
              class="field-control"
              [attr.id]="'question-input-' + questionId"
              [value]="question"
              (input)="onQuestionChange($event)"
              rows="2"
              placeholder="Type the question…"
            ></textarea>
          </div>

          <div class="field">
            <label class="field-label" [attr.for]="'answer-input-' + questionId">Answer</label>
            <textarea
              class="field-control"
              [attr.id]="'answer-input-' + questionId"
              [value]="answer"
              (input)="onAnswerChange($event)"
              rows="2"
              placeholder="Type the answer…"
            ></textarea>
          </div>
        </div>

        <button type="button" class="question-delete-button" (click)="delete()" aria-label="Delete question">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  `,
  styles: /*css*/`
    .question-display-container {
      width: 100%;
    }

    .row {
      display: grid;
      grid-template-columns: 32px 1fr 44px;
      gap: 12px;
      align-items: start;
    }

    .drag-handle {
      font-size: 18px;
      color: rgba(15, 23, 42, 0.55);
      cursor: move;
      user-select: none;
      padding-top: 10px;
    }

    .fields {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .field-label {
      font-size: 0.85rem;
      font-weight: 800;
      color: rgba(15, 23, 42, 0.70);
      letter-spacing: 0.02em;
      text-transform: uppercase;
      user-select: none;
    }

    .field-control {
      width: 100%;
      min-height: 54px;
      resize: vertical;
      border: 1px solid rgba(15, 23, 42, 0.14);
      border-radius: 12px;
      padding: 10px 12px;
      font-size: 1rem;
      line-height: 1.4;
      background: #ffffff;
      box-sizing: border-box;
    }

    .question-delete-button {
      height: 44px;
      width: 44px;
      padding: 0;
      border-radius: 12px;
      background: rgba(239, 68, 68, 0.10);
      border: 1px solid rgba(239, 68, 68, 0.22);
      color: #b91c1c;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background-color 160ms ease, transform 120ms ease;
    }

    .question-delete-button:hover {
      background: rgba(239, 68, 68, 0.16);
      transform: translateY(-1px);
    }
  `,
})
export class QuestionDisplay {
  @Input() questionNumber?: number;
  @Input({ required: true }) questionId!: number;
  @Input({ required: true }) question: any;
  @Input({ required: true }) answer: any;
  @Input({ required: true }) delete: any;

  private quizzesService = inject(Quizzes);

  onQuestionChange(event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    this.question = input.value;
    this.quizzesService.updateQuestion(this.questionId, this.question, this.answer);
  }

  onAnswerChange(event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    this.answer = input.value;
    this.quizzesService.updateQuestion(this.questionId, this.question, this.answer);
  }
}