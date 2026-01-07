import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); min-height: 100vh; padding: 20px;">
      <h1 style="color: white; text-align: center; margin-bottom: 2rem;">Welcome to the Quiz Maker</h1>
      <p style="color: white; text-align: center; font-size: 1.2rem;">Dashboard component loaded successfully!</p>
      
      <button style="background: #4CAF50; color: white; padding: 15px 30px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; display: block; margin: 20px auto;">
        Create New Quiz +
      </button>

      <div style="color: white; padding: 2rem; text-align: center;">
        <h2>Available Quizzes</h2>
        <p>No quizzes created yet. Click "Create New Quiz +" to get started!</p>
      </div>
    </div>
  `,
  styles: []
})
export class DashboardComponent {
  constructor() {
    console.log('Dashboard component loaded');
  }
}