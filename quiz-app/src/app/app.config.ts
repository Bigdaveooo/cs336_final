import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() =>
      initializeApp({
        apiKey: 'AIzaSyAfBSnbyf5hg8XczVTxIOdBylcIY0G1lcg',
        authDomain: 'cs336-quiz-app.firebaseapp.com',
        projectId: 'cs336-quiz-app',
        storageBucket: 'cs336-quiz-app.firebasestorage.app',
        messagingSenderId: '169922618986',
        appId: '1:169922618986:web:52249d8b48c7cffe544c13',
      })
    ),
    provideFirestore(() => getFirestore()),
  ],
};
