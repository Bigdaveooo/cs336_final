import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [],
  template: `<div style="background: red; color: white; padding: 20px; font-size: 24px; min-height: 100vh;">ANGULAR IS WORKING - TEST 2</div>`,
  styles: []
})
export class App {
  constructor() {
    console.log('App component loaded successfully!');
  }
}
