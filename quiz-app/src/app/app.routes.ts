import { Routes } from '@angular/router';
import { TakeQuizComponent } from './components/take-quiz.component';
import { DashboardComponent } from './components/dashboard.component';
import { EditQuizComponent } from './components/edit-quiz.component';
import { CreateQuizComponent } from './components/create-quiz.component';

export const routes: Routes = [
    { path: 'home', component: DashboardComponent },
    { path: 'create', component: CreateQuizComponent },
    { path: 'test/:id', component: TakeQuizComponent },
    { path: 'edit/:id', component: EditQuizComponent },
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: '**', redirectTo: 'home' },
];
