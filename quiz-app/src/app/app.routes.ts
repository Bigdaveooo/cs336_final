import { Routes } from '@angular/router';
import { SearchScreen } from './components/search-screen';
import { TakeQuiz } from './components/take-quiz.component';
import { EditScreen } from './components/edit-screen';

export const routes: Routes = [
    { path: 'home', component: SearchScreen },
    { path: 'test/:id', component: TakeQuiz },
    { path: 'edit/:id', component: EditScreen },
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: '**', redirectTo: 'home' },
];
