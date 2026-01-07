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
      <input
        class="title-input"
        [value]="titleDraft()"
        (input)="titleDraft.set($any($event.target).value); showSavedCheck.set(false)"
        (blur)="saveTitle()"
        placeholder="Quiz title"
      />
    </div>
    <div class="example-list questions-container" (cdkDropListDropped)="drop($event)" cdkDropList>
      @for (question of questions(); track $index) {
        <div class="question-display" cdkDrag>
          <question-display [questionId]="question.id" [delete]="deleter(question.id)" [question]="question.term" [answer]="question.definition"></question-display>
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
      left: 10px;
      top: 10px;
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .title-row {
      width: 60%;
      margin: 70px auto 10px auto;
    }

    .title-input {
      width: 100%;
      font-size: 2rem;
      font-weight: 600;
      padding: 10px 12px;
      border-radius: 12px;
      border: 2px solid black;
      box-sizing: border-box;
    }

    .questions-container {
      width: 60%;
      margin: 0 auto;
      padding: 20px;
      border: 4px solid black;
      border-radius: 15px;
      background-color: #f0f0f0;
      max-height: 80vh;
      overflow-y: auto;
      scrollbar-color: gray transparent; /* make sure the scrollbar track doesnt clip the border */
    }

    .question-display {
      display: block;
      padding: 0;
      margin: 10px;
    }



    .new-question-button {
      margin: 10px;
      padding: 10px;
      border-radius: 10px;
    }


    #back-button, #save-button {
      border-radius: 10px;
      gap: 8px;
    }

    .saved-check {
      color: var(--success-color);
      font-size: 0.95em;
    }


    .cdk-drag-preview {
      box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
                  0 8px 10px 1px rgba(0, 0, 0, 0.14),
                  0 3px 14px 2px rgba(0, 0, 0, 0.12);
      border-radius: 10px;
      padding: 0px;
      margin: 0px;
    }

    .cdk-drag-placeholder {
      opacity: 0;
    }

    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .question-display:last-child {
      border: none;
    }

    .cdk-drop-list-dragging .question-display:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

  `,
})
export class EditScreen {
  id = signal(0);

  quizzesService = inject(Quizzes);
  private router = inject(Router);
  questions = signal<any[]>([]);
  quiz = signal<any>(null);
  titleDraft = signal('');
  showSavedCheck = signal(false);
  
  private activatedRoute = inject(ActivatedRoute);

  constructor() {
    this.activatedRoute.params.subscribe((params) => {
      this.id.set(parseInt(params['id']));
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

    try {
      if (title) {
        await this.quizzesService.updateQuizTitle(quizId, title);
      }
      await this.quizzesService.updateQuizQuestions(quizId, questionIDs);
      this.showSavedCheck.set(true);
    } catch {
      // Intentionally no UI change on failure
    }
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