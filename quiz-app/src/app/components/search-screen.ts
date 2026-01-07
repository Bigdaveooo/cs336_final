import { Component, inject, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { map, Observable } from 'rxjs';
import { Quizzes } from '../quizzes';
import { QuestionDisplay } from './question-display';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-search-screen',
  imports: [AsyncPipe],
  template: /*html*/`
    <div class="app-container">
      <header class="header">
        <h1 class="title">Welcome to the Quiz Maker</h1>
        <button class="create-btn" (click)="popupNewQuizCreation()">Create New +</button>
      </header>

      <main class="main-content">
        @if (filterstr()) {
          <div class="search-section">
            <h2 class="section-title">Search Results</h2>
            <div class="quiz-grid">
              @for (quiz of filteredQuizes(); track $index) {
                <div class="quiz-card">
                  <h3 class="quiz-title">{{ quiz.title }}</h3>
                  <p class="quiz-meta">Number of Questions: {{ quiz.questionCount ?? 0 }}</p>
                  <div class="quiz-actions">
                    <button class="take-quiz-btn" (click)="goToTakeQuiz(quiz.id)">Take Quiz</button>
                    <button class="edit-quiz-btn" (click)="goToEditQuiz(quiz.id)">Edit Quiz</button>
                  </div>
                </div>
              }
            </div>
          </div>
        } @else {
          @for (category of (categories$ | async); track $index) {
            <details class="category-section" open>
              <summary class="category-header">
                <span class="category-title">{{ category }}</span>
                <span class="category-arrow">▼</span>
              </summary>
              <div class="quiz-grid">
                @for (quiz of filteredQuizesForCategory(category); track $index) {
                  <div class="quiz-card">
                    <h3 class="quiz-title">{{ quiz.title }}</h3>
                    <p class="quiz-meta">Number of Questions: {{ quiz.questionCount ?? 0 }}</p>
                    <div class="quiz-actions">
                      <button class="take-quiz-btn" (click)="goToTakeQuiz(quiz.id)">Take Quiz</button>
                      <button class="edit-quiz-btn" (click)="goToEditQuiz(quiz.id)">Edit Quiz</button>
                    </div>
                  </div>
                }
              </div>
            </details>
          }
        }
      </main>

      @if (showCreate()) {
        <div class="modal-backdrop" (click)="closeCreate()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <h3>Create a New Quiz</h3>
            <form (submit)="onCreateQuiz(); $event.preventDefault()">
              <div class="form-group">
                <label for="title">Title</label>
                <input id="title" name="title" [value]="newQuizTitle()" (input)="newQuizTitle.set($any($event.target).value)" placeholder="e.g., Web Dev" required />
              </div>
              <div class="form-group">
                <label for="category">Category</label>
                <select id="category" name="category" [value]="selectedCategory()" (change)="selectedCategory.set($any($event.target).value)">
                  @for (category of (categories$ | async); track $index) {
                    <option [value]="category">{{ category }}</option>
                  }
                  <option value="__new__">Create new category…</option>
                </select>
              </div>
              @if (selectedCategory() === '__new__') {
                <div class="form-group">
                  <label for="newCat">New Category Name</label>
                  <input id="newCat" name="newCat" [value]="newCategoryName()" (input)="newCategoryName.set($any($event.target).value)" placeholder="e.g., Frontend" />
                </div>
              }
              <div class="actions">
                <button type="submit" class="primary-btn">Add Quiz</button>
                <button type="button" class="secondary-btn" (click)="closeCreate()">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: /*css*/`
    .app-container {
      min-height: 100vh;

      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 40px;
      background-color: #334155;
      z-index: 100;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      box-sizing: border-box;
    }

    .title {
      font-size: 2rem;
      font-weight: 500;
      color: white;
      margin: 0;
    }

    .create-btn {
      background-color: #4F46E5;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 12px 24px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .create-btn:hover {
      background-color: #4338CA;
    }

    .main-content {
      padding: 100px 40px 40px 40px;
    }

    .category-section {
      margin-bottom: 32px;
      border: 1px solid #475569;
      border-radius: 12px;
    }

    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      cursor: pointer;
      list-style: none;
      background-color: #475569;
      border-radius: 12px;
    }

    .category-header::-webkit-details-marker {
      display: none;
    }

    .category-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: white;
    }

    .category-arrow {
      color: white;
      font-size: 1rem;
      transition: transform 0.2s ease;
    }

    .category-section[open] .category-arrow {
      transform: rotate(180deg);
    }

    .category-section[open] .category-header {
      border-radius: 12px 12px 0 0;
    }

    .quiz-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
      padding: 20px;
      background-color: #334155;
      border-radius: 0 0 12px 12px;
    }

    .quiz-card {
      background-color: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .quiz-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .quiz-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #1F2937;
      margin: 0 0 8px 0;
      line-height: 1.3;
    }

    .quiz-meta {
      font-size: 0.9rem;
      color: #243b5cff;
      margin: 0 0 16px 0;
    }

    .quiz-actions {
      display: flex;
      gap: 12px;
    }

    .take-quiz-btn {
      background-color: #4F46E5;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 8px 16px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      flex: 1;
      transition: background-color 0.2s ease;
    }

    .take-quiz-btn:hover {
      background-color: #4338CA;
    }

    .edit-quiz-btn {
      background-color: #F3F4F6;
      color: #4B5563;
      border: 1px solid #D1D5DB;
      border-radius: 8px;
      padding: 8px 16px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      flex: 1;
      transition: background-color 0.2s ease, border-color 0.2s ease;
    }

    .edit-quiz-btn:hover {
      background-color: #E5E7EB;
      border-color: #9CA3AF;
    }

    .search-section {
      margin-bottom: 32px;
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: white;
      margin-bottom: 20px;
    }

    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-card {
      background-color: white;
      border-radius: 16px;
      padding: 32px;
      min-width: 400px;
      max-width: 500px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .modal-card h3 {
      color: #1F2937;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 24px 0;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      color: #374151;
      font-weight: 500;
      margin-bottom: 6px;
    }

    .form-group input,
    .form-group select {
      width: 100%;
      padding: 12px;
      border: 1px solid #D1D5DB;
      border-radius: 8px;
      font-size: 1rem;
      background-color: white;
      box-sizing: border-box;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #4F46E5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    .actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    .primary-btn {
      background-color: #4F46E5;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 12px 24px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      flex: 1;
      transition: background-color 0.2s ease;
    }

    .primary-btn:hover {
      background-color: #4338CA;
    }

    .secondary-btn {
      background-color: white;
      color: #374151;
      border: 1px solid #D1D5DB;
      border-radius: 8px;
      padding: 12px 24px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      flex: 1;
      transition: background-color 0.2s ease, border-color 0.2s ease;
    }

    .secondary-btn:hover {
      background-color: #F9FAFB;
      border-color: #9CA3AF;
    }
  `,
})
export class SearchScreen {
  private router = inject(Router);
  quizzesService = inject(Quizzes);
  quizes = toSignal(this.quizzesService.fetchedQuizes$, { initialValue: [] as any[] });
  filterstr = signal('');
  
  // Derived categories from quiz data, defaulting to "My Quizzes" when missing
  categories$: Observable<string[]> = this.quizzesService.fetchedQuizes$.pipe(
    map((list: any) => {
      const cats = new Set<string>();
      cats.add('My Quizzes');
      if (list && list.length > 0) {
        list.forEach((q: any) => cats.add(q.category ?? 'My Quizzes'));
      }
      return Array.from(cats);
    })
  );

  filteredQuizes = computed(() => {
    const filter = this.filterstr().toLowerCase();
    return this.quizes().filter((quiz: any) => 
      quiz.title.toLowerCase().includes(filter)
    );
  });

  filteredQuizesForCategory(category: string) {
    return this.filteredQuizes().filter((quiz: any) => 
      (quiz.category ?? 'My Quizzes') === category
    );
  }

  // Form state
  newQuizTitle = signal('');
  selectedCategory = signal('My Quizzes');
  newCategoryName = signal('');
  showCreate = signal(false);

  async onCreateQuiz() {
    const title = this.newQuizTitle().trim();
    if (!title) return;

    const chosenCategory = this.selectedCategory() === '__new__'
      ? (this.newCategoryName().trim() || 'My Quizzes')
      : this.selectedCategory();

    try {
      await this.quizzesService.addQuiz(title, chosenCategory);
      this.resetForm();
      this.closeCreate();
    } catch (error) {
      console.error('Error creating quiz:', error);
    }
  }

  resetForm() {
    this.newQuizTitle.set('');
    this.selectedCategory.set('My Quizzes');
    this.newCategoryName.set('');
  }

  popupNewQuizCreation() {
    this.showCreate.set(true);
  }

  openCreate() {
    this.showCreate.set(true);
  }

  closeCreate() {
    this.showCreate.set(false);
  }

  goToEditQuiz(id: number) {
    this.router.navigate(['/edit', id]);
  }

  goToTakeQuiz(id: number) {
    this.router.navigate(['/test', id]);
  }
}