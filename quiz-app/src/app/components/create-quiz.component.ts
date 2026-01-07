import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Quiz, Category } from '../models';
import { QuizService } from '../quiz.service';

@Component({
  selector: 'app-create-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="modal-content" style="position: static; max-width: 600px; margin: 2rem auto;">
        <h2 class="modal-title">Create New Quiz</h2>
        
        <div class="form-group">
          <label class="form-label">Quiz Name</label>
          <input 
            type="text" 
            class="form-input" 
            [(ngModel)]="newQuizName"
            placeholder="Enter quiz name"
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">Category</label>
          <select class="form-select" [(ngModel)]="selectedCategoryId">
            <option value="">Create New Category</option>
            @for (category of categories(); track category.id) {
              <option [value]="category.id">{{ category.name }}</option>
            }
          </select>
        </div>
        
        @if (selectedCategoryId === '') {
          <div class="form-group">
            <label class="form-label">New Category Name</label>
            <input 
              type="text" 
              class="form-input" 
              [(ngModel)]="newCategoryName"
              placeholder="Enter category name"
            />
          </div>
        }
        
        <div class="modal-buttons">
          <button class="modal-button secondary-button" (click)="cancel()">
            Cancel
          </button>
          <button class="modal-button primary-button" (click)="createQuiz()" [disabled]="!canCreate()">
            Create Quiz
          </button>
        </div>
      </div>
    </div>
  `
})
export class CreateQuizComponent {
  private router = inject(Router);
  private quizService = inject(QuizService);

  categories = signal<Category[]>([]);
  newQuizName = '';
  selectedCategoryId = '';
  newCategoryName = '';

  async ngOnInit() {
    // Load categories
    this.categories.set([
      { id: '1', name: 'My Quizzes', isExpanded: true, createdAt: new Date() },
      { id: '2', name: 'Test', isExpanded: true, createdAt: new Date() }
    ]);
  }

  canCreate(): boolean {
    if (!this.newQuizName.trim()) return false;
    if (this.selectedCategoryId === '' && !this.newCategoryName.trim()) return false;
    return true;
  }

  async createQuiz() {
    if (!this.canCreate()) return;

    try {
      let categoryId = this.selectedCategoryId;

      // Create new category if needed
      if (!categoryId && this.newCategoryName.trim()) {
        // For now, just create a local ID
        categoryId = Date.now().toString();
        
        const newCategory: Category = {
          id: categoryId,
          name: this.newCategoryName.trim(),
          isExpanded: true,
          createdAt: new Date()
        };
        
        this.categories.update(cats => [...cats, newCategory]);
      }

      if (!categoryId) return;

      // Create new quiz
      const newQuiz: Quiz = {
        id: Date.now().toString(),
        name: this.newQuizName.trim(),
        categoryId,
        questions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Quiz created:', newQuiz);
      
      // Navigate to edit the new quiz
      this.router.navigate(['/edit', newQuiz.id]);
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('Error creating quiz. Please try again.');
    }
  }

  cancel() {
    this.router.navigate(['/']);
  }
}