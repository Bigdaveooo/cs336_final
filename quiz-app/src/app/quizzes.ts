import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { Timestamp, query, orderBy, collectionData, addDoc, collection, Firestore, serverTimestamp, where, updateDoc, doc, getDocs, deleteDoc } from '@angular/fire/firestore';
import { CollectionReference, DocumentData } from '@angular/fire/compat/firestore';



export interface Question {
  id: number;
  term: string; // actually ends up being more like "question" and "answer", tough to change now
  definition: string;
}

export interface Quiz {
  id: number;
  title: string;
  qCount: number;
  questions: number[];
}

export interface User {
  username: string;
  password: string;
  quizes: number[];
}



export interface QuestionReq {
  id: number;
  term: string;
  definition: string;
}

export interface QuizReq {
  id: number;
  title: string;
  questionCount: number;
  questions: string;
  category?: string; // optional for existing docs
}

export interface UserReq {
  username: string;
  password: string;
  quizes: string;
}



@Injectable({
  providedIn: 'root',
})
export class Quizes {
  firestore = inject(Firestore);

  fetchedQuizes$: Observable<QuizReq[]>;
  fetchedQuestions$: Observable<QuestionReq[]>;

  quizes = signal<Quiz[]>([]);
  questions = signal<Question[]>([]);
  maxQuizID = signal<number>(0);
  maxQuestionID = signal<number>(0);

  userCollection: any;
  quizCollection: any;
  questionCollection: any;

  constructor() {
    this.userCollection = collection(this.firestore, 'users');
    this.quizCollection = collection(this.firestore, 'quizes');
    this.questionCollection = collection(this.firestore, 'questions');
    
    const quizQuery = query(this.quizCollection, orderBy('id', 'asc'));
    this.fetchedQuizes$ = collectionData(quizQuery) as Observable<QuizReq[]>;
    
    const questionQuery = query(this.questionCollection, orderBy('id', 'asc'));
    this.fetchedQuestions$ = collectionData(questionQuery) as Observable<QuestionReq[]>;



    this.fetchedQuizes$.subscribe((quizData) => {
      const quizzes: Quiz[] = quizData.map(quiz => ({
        id: quiz.id,
        title: quiz.title,
        qCount: quiz.questionCount,
        questions: quiz.questions.split(',').map(Number),
      }));
      this.quizes.set(quizzes);
      const maxId = quizzes.reduce((max, quiz) => quiz.id > max ? quiz.id : max, 0);
      this.maxQuizID.set(maxId);
    });

    this.fetchedQuestions$.subscribe((questionData) => {
      const questions: Question[] = questionData.map(question => ({
        id: question.id,
        term: question.term,
        definition: question.definition,
      }));
      this.questions.set(questions);
      const maxId = questions.reduce((max, question) => question.id > max ? question.id : max, 0);
      this.maxQuestionID.set(maxId);
    });

  }



  getQuizQuestions(quizID: number): Question[] {
    const quiz = this.getQuizByID(quizID);
    if (!quiz) {
      return [];
    }

    const quizQuestions: Question[] = [];
    for (const questionID of quiz.questions) {
      const question = this.getQuestionByID(questionID);
      if (question) {
        quizQuestions.push(question);
      }
    }

    return quizQuestions;
  }



  getQuizByID(quizID: number): Quiz | undefined {
    return this.quizes().find(q => q.id === quizID);
  }

  getQuestionByID(questionID: number): Question | undefined {
    return this.questions().find(q => q.id === questionID);
  }




  newQuiz(title: string) {
    const newQuizID = this.maxQuizID() + 1;
    this.maxQuizID.set(newQuizID);
    const newQuiz: Quiz = {
      id: newQuizID,
      title: title,
      qCount: 0,
      questions: [],
    };
    addDoc(this.quizCollection, {id: newQuiz.id, title: newQuiz.title, questionCount: newQuiz.qCount, questions: newQuiz.questions.join(',')});
  }


  async newQuestion(ownedByID: number, term: string, definition: string) {
    const newQuestionID = this.maxQuestionID() + 1;
    this.maxQuestionID.set(newQuestionID);
    const newQuestion: Question = {
      id: newQuestionID,
      term: term,
      definition: definition,
    };
    await addDoc(this.questionCollection, {id: newQuestion.id, term: newQuestion.term, definition: newQuestion.definition});

    const quiz = this.getQuizByID(ownedByID);
    if (quiz) {
      quiz.questions.push(newQuestionID);
      await this.updateQuizQuestions(ownedByID, quiz.questions);
    }
  }


  async updateQuizTitle(quizID: number, title: string) {
    // Find the quiz document in Firestore
    const quizQuery = query(this.quizCollection, where('id', '==', quizID));
    const querySnapshot = await getDocs(quizQuery);
    
    // Update the document if found
    if (!querySnapshot.empty) {
      const quizDoc = querySnapshot.docs[0];
      const quizDocRef = doc(this.firestore, 'quizes', quizDoc.id);
      await updateDoc(quizDocRef, { title: title });
    }
  }


  async updateQuizQuestions(quizID: number, questions: number[]) {
    // somehow a 0 gets in the questions list sometimes, even though there never was a question
    // with ID 0. But why address the root issue when you can just:
    questions = questions.filter(q => q !== 0)

    // Find the quiz document in Firestore
    const quizQuery = query(this.quizCollection, where('id', '==', quizID));
    const querySnapshot = await getDocs(quizQuery);
    
    // Update the document if found
    if (!querySnapshot.empty) {
      const quizDoc = querySnapshot.docs[0];
      const quizDocRef = doc(this.firestore, 'quizes', quizDoc.id);
      await updateDoc(quizDocRef, { questions: questions.join(','), questionCount: questions.length });
    }
  }



  async updateQuestion(QuestionID: number, question: string, answer: string) {
    // Find the question document in Firestore
    const questionQuery = query(this.questionCollection, where('id', '==', QuestionID));
    const querySnapshot = await getDocs(questionQuery);
    
    // Update the document if found
    if (!querySnapshot.empty) {
      const questionDoc = querySnapshot.docs[0];
      const questionDocRef = doc(this.firestore, 'questions', questionDoc.id);
      await updateDoc(questionDocRef, { term: question, definition: answer });
    }
  }

  async deleteQuestionFromQuiz(quizID: number, questionID: number) {
    // Find and delete the question document from Firestore
    const questionQuery = query(this.questionCollection, where('id', '==', questionID));
    const questionSnapshot = await getDocs(questionQuery);
    
    if (!questionSnapshot.empty) {
      const questionDoc = questionSnapshot.docs[0];
      const questionDocRef = doc(this.firestore, 'questions', questionDoc.id);
      await deleteDoc(questionDocRef);
    }

    // Remove the question from the quiz's questions array
    const quiz = this.getQuizByID(quizID);
    if (quiz) {
      quiz.questions = quiz.questions.filter(id => id !== questionID);
      await this.updateQuizQuestions(quizID, quiz.questions);
    }
  }

  async addQuiz(title: string, category: string) {
    const id = Date.now();
    const payload: QuizReq = {
      id,
      title,
      questionCount: 0,
      questions: '',
      category,
    };
    await addDoc(this.quizCollection, payload);
  }

}