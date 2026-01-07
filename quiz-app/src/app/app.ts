import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: /*html*/`
    <router-outlet />
  `,
  styles: [],
})
export class App {
  
}
