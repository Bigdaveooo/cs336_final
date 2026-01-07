import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Quiz, Question } from '../models';
import { QuizService } from '../quiz.service';

@Component({
  selector: 'app-edit-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      @if (quiz()) {
        <div class="modal-content" style="position: static; max-width: 800px; margin: 2rem auto;">
          <h2 class="modal-title">Edit Quiz: {{ quiz()!.name }}</h2>
          
          <div class="form-group">
            <label class="form-label">Quiz Name</label>
            <input 
              type="text" 
              class="form-input" 
              [(ngModel)]="quiz()!.name"
              placeholder="Enter quiz name"
            />
          </div>
          
          <div class="form-group">
            <label class="form-label">Questions</label>
            @for (question of quiz()!.questions; track question.id; let i = $index) {
              <div style="border: 1px solid #dadce0; border-radius: 6px; padding: 1rem; margin-bottom: 1rem;">
                <div class="form-group">
                  <label class="form-label">Question {{ i + 1 }}</label>
                  <input 
                    type="text" 
                    class="form-input" 
                    [(ngModel)]="question.question"
                    placeholder="Enter question"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Answer</label>
                  <input 
                    type="text" 
                    class="form-input" 
                    [(ngModel)]="question.answer"
                    placeholder="Enter answer"
                  />
                </div>
                <button 
                  class="modal-button secondary-button" 
                  (click)="removeQuestion(question.id)"
                  style="margin-top: 0.5rem;"
                >
                  Remove Question
                </button>
              </div>
            } @empty {
              <p style="color: #666; font-style: italic; text-align: center; padding: 2rem;">
                No questions yet. Click "Add Question" to get started!
              </p>
            }
            
            <button class="modal-button primary-button" (click)="addQuestion()">
              Add Question
            </button>
          </div>
          
          <div class="modal-buttons">
            <button class="modal-button secondary-button" (click)="cancel()">
              Back to Dashboard
            </button>
            <button class="modal-button primary-button" (click)="saveChanges()">
              Save Changes
            </button>
          </div>
        </div>
      } @else {
        <div style="text-align: center; padding: 2rem;">
          <h2>Quiz not found</h2>
          <button class="modal-button primary-button" (click)="cancel()">
            Back to Dashboard
          </button>
        </div>
      }
    </div>
  `
})
export class EditQuizComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private quizService = inject(QuizService);

  quiz = signal<Quiz | null>(null);

  async ngOnInit() {
    const quizId = this.route.snapshot.params['id'];
    console.log('Editing quiz ID:', quizId);
    
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
      // Add more sample quizzes as needed
    ];

    const foundQuiz = sampleQuizzes.find(q => q.id === quizId);
    if (foundQuiz) {
      // Create a copy to avoid mutating the original
      this.quiz.set({ ...foundQuiz, questions: [...foundQuiz.questions] });
    }
  }

  addQuestion() {
    const currentQuiz = this.quiz();
    if (!currentQuiz) return;
    
    const newQuestion: Question = {
      id: Date.now().toString(),
      question: '',
      answer: ''
    };
    
    this.quiz.update(quiz => quiz ? {
      ...quiz,
      questions: [...quiz.questions, newQuestion]
    } : null);
  }

  removeQuestion(questionId: string) {
    this.quiz.update(quiz => quiz ? {
      ...quiz,
      questions: quiz.questions.filter(q => q.id !== questionId)
    } : null);
  }

  async saveChanges() {
    const currentQuiz = this.quiz();
    if (!currentQuiz) return;

    try {
      // Validate that all questions have content
      const invalidQuestions = currentQuiz.questions.filter(q => 
        !q.question.trim() || !q.answer.trim()
      );
      
      if (invalidQuestions.length > 0) {
        alert('Please fill in all question and answer fields before saving.');
        return;
      }

      console.log('Saving quiz:', currentQuiz);
      
      // TODO: Save to Firebase
      // await this.quizService.updateQuiz(currentQuiz.id, currentQuiz);
      
      alert('Quiz saved successfully!');
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Error saving quiz:', error);
      alert('Error saving quiz. Please try again.');
    }
  }

  cancel() {
    this.router.navigate(['/']);
  }
}