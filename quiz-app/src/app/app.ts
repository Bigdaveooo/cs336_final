import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: /*html*/`
    <router-outlet></router-outlet>
  `,
})
export class App {

}