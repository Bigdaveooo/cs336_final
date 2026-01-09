import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuestionDisplay } from './question-display';
import { Quizzes } from '../quizzes';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-edit-screen',
  imports: [QuestionDisplay, CdkDropList, CdkDrag],
  template: /*html*/`
    <div class="top-bar">
      <div id="back-button" class="button" (click)="goToSearchScreen()">
        <i class="fa-solid fa-arrow-left"></i> Back
      </div>
      <div id="save-button" class="button" (click)="saveAll()">
        <i class="fa-solid fa-floppy-disk"></i> Save
        @if (showSavedCheck()) {
          <i class="fa-solid fa-check saved-check" aria-label="Saved"></i>
        }
      </div>
    </div>
    <div class="title-row">
      <div class="title-label">Title</div>
      <input
        class="title-input"
        [value]="titleDraft()"
        (input)="titleDraft.set($any($event.target).value); showSavedCheck.set(false)"
        (blur)="saveTitle()"
        placeholder="Quiz title"
      />

      <div class="title-label title-label--spaced">Category</div>
      <div class="category-row">
        <select
          class="category-select"
          [value]="categorySelection()"
          (change)="onCategoryChange($any($event.target).value)"
        >
          @for (category of categories(); track $index) {
            <option [value]="category">{{ category }}</option>
          }
          <option value="__new__">Create new category…</option>
        </select>

        @if (categorySelection() === '__new__') {
          <input
            class="category-new"
            placeholder="New category name"
            [value]="newCategoryName()"
            (input)="newCategoryName.set($any($event.target).value); showSavedCheck.set(false); categoryTouched.set(true)"
          />
        }
      </div>
    </div>
    <div class="example-list questions-container" (cdkDropListDropped)="drop($event)" cdkDropList>
      @for (question of questions(); track $index) {
        <div class="question-card" cdkDrag>
          <question-display [questionNumber]="$index + 1" [questionId]="question.id" [delete]="deleter(question.id)" [question]="question.term" [answer]="question.definition"></question-display>
        </div>
      }
      <div class="new-question-button container button centered" (click)="makeNewQuestion()">
        <h3>New Question</h3>
      </div>
    </div>
  `,
  styles: /*css*/`
    .top-bar {
      position: absolute;
      left: 0.625rem;
      top: 0.625rem;
      display: flex;
      gap: 0.625rem;
      align-items: center;
    }

    .title-row {
      width: min(56.25rem, 92vw);
      margin: 5.25rem auto 0.75rem auto;
      background: rgba(255, 255, 255, 0.75);
      backdrop-filter: blur(0.625rem);
      border: 1px solid var(--card-border-color);
      box-shadow: var(--card-shadow);
      border-radius: 1.125rem;
      padding: 1rem;
    }

    :host {
      display: block;
      min-height: 100vh;
      padding-bottom: 3rem;
    }

    .title-label {
      font-size: 0.85rem;
      font-weight: 800;
      color: rgba(15, 23, 42, 0.70);
      margin: 0 0 8px 0;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }

    .title-label--spaced {
      margin-top: 0.875rem;
    }

    .title-input {
      width: 100%;
      font-size: 1.65rem;
      font-weight: 800;
      padding: 0.75rem 0.875rem;
      border-radius: 0.875rem;
      border: 1px solid rgba(15, 23, 42, 0.14);
      box-sizing: border-box;
      background: #ffffff;
    }

    .category-row {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .category-select {
      flex: 1;
      border-radius: 0.75rem;
      border: 1px solid rgba(15, 23, 42, 0.14);
      padding: 0.625rem 0.75rem;
      background: #ffffff;
    }

    .category-new {
      flex: 2;
      border-radius: 0.75rem;
      border: 1px solid rgba(15, 23, 42, 0.14);
      padding: 0.625rem 0.75rem;
      background: #ffffff;
    }

    .questions-container {
      width: min(56.25rem, 92vw);
      margin: 0 auto;
      padding: 1.125rem;
      border: 1px solid var(--card-border-color);
      border-radius: 1.125rem;
      background: rgba(255, 255, 255, 0.75);
      backdrop-filter: blur(0.625rem);
      box-shadow: var(--card-shadow);
      overflow: visible;
      scrollbar-color: rgba(15, 23, 42, 0.25) transparent;
    }

    .question-card {
      display: block;
      padding: 0.75rem;
      margin: 0.75rem 0;
      border-radius: 1rem;
      border: 1px solid rgba(15, 23, 42, 0.12);
      background: #ffffff;
    }

    .new-question-button {
      margin: 0.75rem 0 0.25rem 0;
      padding: 0.75rem;
      border-radius: 0.875rem;
    }

    #back-button, #save-button {
      border-radius: 0.625rem;
      gap: 0.5rem;
    }

    .saved-check {
      color: var(--success-color);
      font-size: 0.95em;
    }

    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .cdk-drop-list-dragging .question-card:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

  `,
})
export class EditScreen {
  private readonly defaultCategoryName = window.localStorage.getItem('defaultCategoryName') ?? 'My Quizzes';

  id = signal(0);

  quizzesService = inject(Quizzes);
  private router = inject(Router);
  questions = signal<any[]>([]);
  quiz = signal<any>(null);
  titleDraft = signal('');
  showSavedCheck = signal(false);

  categories = signal<string[]>([this.defaultCategoryName]);
  categorySelection = signal<string>(this.defaultCategoryName);
  newCategoryName = signal('');
  categoryTouched = signal(false);

  private activatedRoute = inject(ActivatedRoute);

  constructor() {
    this.activatedRoute.params.subscribe((params) => {
      this.id.set(parseInt(params['id']));
    });

    this.quizzesService.fetchedQuizes$.subscribe((quizData: any) => {
      const cats = new Set<string>();
      cats.add(this.defaultCategoryName);
      if (quizData && quizData.length > 0) {
        quizData.forEach((q: any) => cats.add(q.category ?? this.defaultCategoryName));
      }
      this.categories.set(Array.from(cats));

      const current = quizData?.find((q: any) => q.id === this.id());
      if (current && !this.categoryTouched()) {
        this.categorySelection.set(current.category ?? this.defaultCategoryName);
      }
    });

    this.quizzesService.fetchedQuestions$.subscribe((_: any) => {
      this.questions.set(this.quizzesService.getQuizQuestions(this.id()));
      this.quiz.set(this.quizzesService.getQuizByID(this.id()));
      const q = this.quiz();
      if (q && !this.titleDraft()) {
        this.titleDraft.set(q.title ?? '');
      }
    });
  }

  async makeNewQuestion() {
    this.showSavedCheck.set(false);
    await this.quizzesService.newQuestion(this.id(), '', '');
    this.questions.set(this.quizzesService.getQuizQuestions(this.id()));
  }

  deleter(id: number) {
    return () => {
      this.showSavedCheck.set(false);
      this.quizzesService.deleteQuestionFromQuiz(this.id(), id).then(() => {
        this.questions.set(this.quizzesService.getQuizQuestions(this.id()));
      });
    };
  }

  goToSearchScreen(): void {
    this.router.navigate(['/home']);
  }

  async saveTitle() {
    const title = this.titleDraft().trim();
    if (!title) return;
    await this.quizzesService.updateQuizTitle(this.id(), title);
  }

  async saveAll() {
    this.showSavedCheck.set(false);
    const quizId = this.id();
    const title = this.titleDraft().trim();
    const questionIDs = this.questions().map(q => q.id).filter(id => id !== 0);

    const category = this.categorySelection() === '__new__'
      ? (this.newCategoryName().trim() || this.defaultCategoryName)
      : this.categorySelection();

    try {
      if (title) {
        await this.quizzesService.updateQuizTitle(quizId, title);
      }
      await this.quizzesService.updateQuizQuestions(quizId, questionIDs);
      await this.quizzesService.updateQuizCategory(quizId, category);
      this.showSavedCheck.set(true);
    } catch {
      // Intentionally no UI change on failure
    }
  }

  onCategoryChange(value: string) {
    this.categorySelection.set(value);
    this.categoryTouched.set(true);
    this.showSavedCheck.set(false);
  }


  drop(event: CdkDragDrop<any[]>) {
    this.showSavedCheck.set(false);
    const questions = [...this.questions()];
    moveItemInArray(questions, event.previousIndex, event.currentIndex);
    this.questions.set(questions);
    const questionIDs = questions.map(q => q.id);
    this.quizzesService.updateQuizQuestions(this.id(), questionIDs);
  }
}