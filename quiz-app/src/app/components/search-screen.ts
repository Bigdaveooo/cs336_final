import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Quizzes } from '../quizzes';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-search-screen',
  imports: [],
  template: /*html*/`
    <div class="app-container">
      <header class="header">
        <h1 class="title">Kwiz</h1>
        <button class="create-btn" (click)="popupNewQuizCreation()">Create New +</button>
      </header>

      <div class="layout">
        <aside class="sidebar" aria-label="Quiz navigation">
          <details class="sidebar-root">
            <summary class="sidebar-root-summary">
              <span class="sidebar-root-title">My Quizzes</span>
              <span class="sidebar-chevron">▼</span>
            </summary>

            <div class="sidebar-content">
              @for (category of categories(); track category) {
                <details class="sidebar-category">
                  <summary class="sidebar-category-summary">
                    <span class="sidebar-category-title">{{ category }}</span>
                    <span class="sidebar-category-right">
                      <button
                        type="button"
                        class="category-edit-btn"
                        (click)="$event.preventDefault(); $event.stopPropagation(); editCategory(category)">
                        <i class="fa-solid fa-pen"></i>
                        <span class="sr-only">Rename category</span>
                      </button>
                      <span class="sidebar-category-meta">{{ filteredQuizesForCategory(category).length }}</span>
                    </span>
                  </summary>

                  <div class="sidebar-quiz-list" role="list">
                    @if (filteredQuizesForCategory(category).length === 0) {
                      <div class="sidebar-empty">No quizzes</div>
                    } @else {
                      @for (quiz of filteredQuizesForCategory(category); track quiz.id) {
                        <button
                          type="button"
                          role="listitem"
                          class="sidebar-quiz-item"
                          [class.active]="selectedQuizId() === quiz.id"
                          (click)="selectQuiz(quiz.id)">
                          <span class="sidebar-quiz-title">{{ quiz.title }}</span>
                          <span class="sidebar-quiz-count">{{ quiz.questionCount ?? 0 }}</span>
                        </button>
                      }
                    }
                  </div>
                </details>
              }
            </div>
          </details>
        </aside>

        <main class="main-panel" aria-label="Selected quiz">
          @if (selectedQuiz()) {
            <div class="quiz-card selected-quiz-card">
              <h2 class="selected-quiz-title">{{ selectedQuiz()!.title }}</h2>
              <p class="selected-quiz-meta">
                Category: {{ selectedQuiz()!.category ?? defaultCategoryName() }}
                · Questions: {{ selectedQuiz()!.questionCount ?? 0 }}
              </p>
              <div class="quiz-actions">
                <button class="take-quiz-btn" (click)="goToTakeQuiz(selectedQuiz()!.id)">Take Quiz</button>
                <button class="edit-quiz-btn" (click)="goToEditQuiz(selectedQuiz()!.id)">Edit Quiz</button>
              </div>
            </div>
          } @else {
            <div class="empty-panel">
              <h2>Select a quiz</h2>
              <p>Use the menu on the left to choose a category and quiz.</p>
            </div>
          }
        </main>
      </div>

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
                  @for (category of categories(); track category) {
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
    :host {
      --app-header-height: 4rem;
      --sidebar-width: 18.75rem;
      --sidebar-gap: 1.125rem;
    }

    .app-container {
      min-height: 100vh;
      color: var(--text-color-main);
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
      height: var(--app-header-height);
      padding: 0 1.75rem;
      background: var(--header-bg-color);
      backdrop-filter: blur(0.625rem);
      border-bottom: 0.03125rem solid rgba(15, 23, 42, 0.10);
      z-index: 100;
      box-shadow: 0 0.5rem 1.5rem rgba(2, 6, 23, 0.05);
      box-sizing: border-box;
    }

    .title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-color-main);
      margin: 0;
      letter-spacing: -0.02em;
    }

    .create-btn {
      background-color: var(--accent-color);
      color: #ffffff;
      border: 1px solid transparent;
      border-radius: 0.75rem;
      padding: 0.75rem 1.125rem;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      transition: background-color 160ms ease, box-shadow 160ms ease, transform 120ms ease;
    }

    .create-btn:hover {
      background-color: var(--accent-color-hover);
      box-shadow: 0 0.625rem 1.375rem rgba(2, 132, 199, 0.22);
      transform: translateY(-1px);
    }

    .layout {
      padding: var(--app-header-height) 1.75rem 1.75rem calc(var(--sidebar-width) + var(--sidebar-gap));
      display: block;
      min-height: calc(100vh - var(--app-header-height));
      box-sizing: border-box;
    }

    .sidebar {
      position: fixed;
      top: var(--app-header-height);
      left: 0;
      bottom: 0;
      width: var(--sidebar-width);
      overflow: auto;
      border: 1px solid var(--card-border-color);
      border-left: none;
      border-radius: 0rem;
      background: var(--sidebar-bg-color);
      backdrop-filter: blur(0.625rem);
      box-shadow: var(--card-shadow);
    }

    .sidebar-root,
    .sidebar-category {
      border-bottom: 1px solid rgba(15, 23, 42, 0.08);
    }

    .sidebar-root:last-child,
    .sidebar-category:last-child {
      border-bottom: none;
    }

    .sidebar-root-summary,
    .sidebar-category-summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.625rem;
      padding: 0.875rem 1rem;
      cursor: pointer;
      list-style: none;
      user-select: none;
    }

    .sidebar-root-summary::-webkit-details-marker,
    .sidebar-category-summary::-webkit-details-marker {
      display: none;
    }

    .sidebar-root-title {
      font-size: 1.05rem;
      font-weight: 800;
      letter-spacing: -0.01em;
    }

    .sidebar-chevron {
      color: var(--muted-text);
      transition: transform 0.2s ease;
    }

    .sidebar-root[open] .sidebar-chevron {
      transform: rotate(180deg);
    }

    .sidebar-content {
      padding: 0.375rem 0;
    }

    .sidebar-category {
      margin: 0 0.625rem 0.625rem;
      border: 1px solid rgba(15, 23, 42, 0.10);
      border-radius: 0.875rem;
      background: rgba(255, 255, 255, 0.78);
      overflow: hidden;
    }

    .sidebar-category-summary {
      padding: 0.75rem 0.875rem;
    }

    .main-panel {
      min-width: 0;
    }

    @media (max-width < 56.25rem) {
      .layout {
        padding: calc(var(--app-header-height) + 0.875rem) 0.875rem 1.375rem;
      }

      .sidebar {
        position: static;
        width: auto;
        height: auto;
        border-left: 1px solid var(--card-border-color);
        border-radius: 0;
      }
    }

    .quiz-card {
      background-color: var(--card-bg-color);
      border: 1px solid var(--card-border-color);
      border-radius: 1.125rem;
      padding: 1.25rem;
      box-shadow: var(--card-shadow);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .quiz-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--card-shadow-hover);
    }

    .quiz-actions {
      display: flex;
      gap: 0.75rem;
    }

    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(15, 23, 42, 0.35);
      backdrop-filter: blur(0.5rem);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-card {
      background-color: #ffffff;
      border: 1px solid var(--card-border-color);
      border-radius: 1.125rem;
      padding: 2rem;
      min-width: 25rem;
      max-width: 31.25rem;
      box-shadow: var(--card-shadow-hover);
    }

    .modal-card h3 {
      color: var(--text-color-main);
      font-size: 1.5rem;
      font-weight: 800;
      margin: 0 0 1.5rem 0;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-group label {
      display: block;
      color: rgba(15, 23, 42, 0.78);
      font-weight: 700;
      margin-bottom: 0.375rem;
    }

    .form-group input,
    .form-group select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid rgba(15, 23, 42, 0.14);
      border-radius: 0.75rem;
      font-size: 1rem;
      background-color: #ffffff;
      box-sizing: border-box;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: rgba(14, 165, 233, 0.55);
      box-shadow: 0 0 0 0.25rem var(--focus-ring);
    }

    .actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    .primary-btn {
      background-color: var(--accent-color);
      color: white;
      border: none;
      border-radius: 12px;
      padding: 12px 24px;
      font-size: 1rem;
      font-weight: 800;
      cursor: pointer;
      flex: 1;
      transition: background-color 160ms ease, box-shadow 160ms ease, transform 120ms ease;
    }

    .primary-btn:hover {
      background-color: var(--accent-color-hover);
      box-shadow: 0 10px 22px rgba(2, 132, 199, 0.18);
      transform: translateY(-1px);
    }

    .secondary-btn {
      background-color: rgba(15, 23, 42, 0.04);
      color: rgba(15, 23, 42, 0.80);
      border: 1px solid rgba(15, 23, 42, 0.12);
      border-radius: 12px;
      padding: 12px 24px;
      font-size: 1rem;
      font-weight: 800;
      cursor: pointer;
      flex: 1;
      transition: background-color 0.2s ease, border-color 0.2s ease;
    }

    .secondary-btn:hover {
      background-color: rgba(15, 23, 42, 0.06);
      border-color: rgba(15, 23, 42, 0.18);
    }
  `,
})
export class SearchScreen {
  private router = inject(Router);
  quizzesService = inject(Quizzes);
  quizes = toSignal(this.quizzesService.fetchedQuizes$, { initialValue: [] as any[] });

  // Editable default category name (NOT the root menu label). Seeded to "My Quizzes".
  defaultCategoryName = signal<string>(window.localStorage.getItem('defaultCategoryName') ?? 'My Quizzes');

  selectedQuizId = signal<number | null>(null);
  selectedQuiz = computed(() => {
    const id = this.selectedQuizId();
    if (id == null) return null;
    return this.quizes().find((q: any) => q.id === id) ?? null;
  });

  categories = computed(() => {
    const defaultCategory = this.defaultCategoryName();
    const cats = new Set<string>();
    // Ensure there is always a default user category shown.
    cats.add(defaultCategory);
    for (const q of this.quizes()) {
      cats.add((q.category ?? defaultCategory) as string);
    }
    return Array.from(cats);
  });

  filteredQuizesForCategory(category: string) {
    const defaultCategory = this.defaultCategoryName();
    return this.quizes().filter((quiz: any) =>
      (quiz.category ?? defaultCategory) === category
    );
  }

  async renameCategory(category: string) {
    const currentDefault = this.defaultCategoryName();

    const next = window.prompt('Rename category:', category);
    if (next == null) return;
    const trimmed = next.trim();
    if (!trimmed) return;
    if (trimmed === category) return;

    const existing = new Set(this.categories());
    if (existing.has(trimmed)) {
      const ok = window.confirm(
        `Category "${trimmed}" already exists. Move all quizzes from "${category}" into "${trimmed}"?`
      );
      if (!ok) return;
    }

    try {
      const includeMissing = category === currentDefault;
      if (includeMissing) {
        this.defaultCategoryName.set(trimmed);
        window.localStorage.setItem('defaultCategoryName', trimmed);
        if (this.selectedCategory() === currentDefault) {
          this.selectedCategory.set(trimmed);
        }
      }
      await this.quizzesService.renameCategory(category, trimmed, includeMissing);
    } catch {
      window.alert('Failed to rename category. Please try again.');
    }
  }

  async deleteCategory(category: string) {
    const currentDefault = this.defaultCategoryName();
    if (category === currentDefault) {
      window.alert('You can’t delete the default category. Rename it instead.');
      return;
    }

    const count = this.filteredQuizesForCategory(category).length;
    const ok = window.confirm(
      `Delete category "${category}"?\n\nThis will permanently delete ${count} quiz(es) in this category.`
    );
    if (!ok) return;

    try {
      await this.quizzesService.deleteCategory(category);
    } catch {
      window.alert('Failed to delete category. Please try again.');
    }
  }

  async editCategory(category: string) {
    const doDelete = window.confirm(
      `Edit category "${category}":\n\nOK = Delete category\nCancel = Rename category`
    );
    if (doDelete) {
      await this.deleteCategory(category);
    } else {
      await this.renameCategory(category);
    }
  }

  selectQuiz(id: number) {
    this.selectedQuizId.set(id);
  }

  // Form state
  newQuizTitle = signal('');
  selectedCategory = signal(this.defaultCategoryName());
  newCategoryName = signal('');
  showCreate = signal(false);

  async onCreateQuiz() {
    const title = this.newQuizTitle().trim();
    if (!title) return;

    const chosenCategory = this.selectedCategory() === '__new__'
      ? (this.newCategoryName().trim() || this.defaultCategoryName())
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
    this.selectedCategory.set(this.defaultCategoryName());
    this.newCategoryName.set('');
  }

  popupNewQuizCreation() {
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