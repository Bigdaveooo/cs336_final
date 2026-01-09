import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import {
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  Firestore,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from '@angular/fire/firestore';

export interface Question {
  id: number;
  term: string;
  definition: string;
}

export interface Quiz {
  id: number;
  title: string;
  qCount: number;
  questions: number[];
  category?: string;
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
  category?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Quizzes {
  firestore = inject(Firestore);

  fetchedQuizes$: Observable<QuizReq[]>;
  fetchedQuestions$: Observable<QuestionReq[]>;

  quizes = signal<Quiz[]>([]);
  questions = signal<Question[]>([]);
  maxQuestionID = signal<number>(0);

  quizCollection: any;
  questionCollection: any;

  private async getFirstDocIdByField(
    collectionRef: any,
    field: string,
    value: unknown
  ): Promise<string | null> {
    const q = query(collectionRef, where(field, '==', value));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return snapshot.docs[0].id;
  }

  private async getQuizDocIdById(quizId: number): Promise<string | null> {
    return this.getFirstDocIdByField(this.quizCollection, 'id', quizId);
  }

  private async getQuestionDocIdById(questionId: number): Promise<string | null> {
    return this.getFirstDocIdByField(this.questionCollection, 'id', questionId);
  }

  constructor() {
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
        questions: String(quiz.questions ?? '')
          .split(',')
          .map((s) => Number(s.trim()))
          .filter((n) => Number.isFinite(n) && n !== 0),
        category: quiz.category,
      }));
      this.quizes.set(quizzes);
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
    const docId = await this.getQuizDocIdById(quizID);
    if (!docId) return;
    await updateDoc(doc(this.firestore, 'quizes', docId), { title });
  }

  async updateQuizCategory(quizID: number, category: string) {
    const docId = await this.getQuizDocIdById(quizID);
    if (!docId) return;
    await updateDoc(doc(this.firestore, 'quizes', docId), { category });
  }

  async updateQuizQuestions(quizID: number, questions: number[]) {
    questions = questions.filter(q => q !== 0);

    const docId = await this.getQuizDocIdById(quizID);
    if (!docId) return;
    await updateDoc(doc(this.firestore, 'quizes', docId), {
      questions: questions.join(','),
      questionCount: questions.length,
    });
  }

  async updateQuestion(QuestionID: number, question: string, answer: string) {
    const docId = await this.getQuestionDocIdById(QuestionID);
    if (!docId) return;
    await updateDoc(doc(this.firestore, 'questions', docId), { term: question, definition: answer });
  }

  async deleteQuestionFromQuiz(quizID: number, questionID: number) {
    const questionDocId = await this.getQuestionDocIdById(questionID);
    if (questionDocId) {
      await deleteDoc(doc(this.firestore, 'questions', questionDocId));
    }

    // Remove the question from the quiz's questions array
    const quiz = this.getQuizByID(quizID);
    if (quiz) {
      quiz.questions = quiz.questions.filter(id => id !== questionID);
      await this.updateQuizQuestions(quizID, quiz.questions);
    }
  }

  private parseQuestionIds(raw: unknown): number[] {
    return String(raw ?? '')
      .split(',')
      .map((s) => Number(String(s).trim()))
      .filter((n) => Number.isFinite(n) && n !== 0);
  }

  private async deleteQuizDocAndQuestions(docSnap: any) {
    const data: any = docSnap.data?.() ?? {};
    const questionIds = this.parseQuestionIds(data.questions);

    await Promise.all(
      questionIds.map(async (qid) => {
        const qDocId = await this.getQuestionDocIdById(qid);
        if (!qDocId) return;
        await deleteDoc(doc(this.firestore, 'questions', qDocId));
      })
    );

    await deleteDoc(docSnap.ref);
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

  async renameCategory(oldCategory: string, newCategory: string, includeMissing: boolean = false) {
    const from = (oldCategory ?? '').trim();
    const to = (newCategory ?? '').trim();

    if (!from || !to) return;
    if (from === to) return;

    const toUpdate = new Map<string, any>();

    // All docs explicitly in the old category
    const q = query(this.quizCollection, where('category', '==', from));
    const snapshot = await getDocs(q);
    snapshot.docs.forEach((d) => toUpdate.set(d.id, d));

    if (includeMissing) {
      // Also migrate docs with missing/empty category
      const all = await getDocs(this.quizCollection);
      all.docs.forEach((d) => {
        const data: any = d.data();
        const cat = (data?.category ?? '').trim();
        if (!cat) toUpdate.set(d.id, d);
      });
    }

    if (toUpdate.size === 0) return;
    await Promise.all(Array.from(toUpdate.values()).map((docSnap: any) => updateDoc(docSnap.ref, { category: to })));
  }

  async deleteCategory(category: string) {
    const from = (category ?? '').trim();
    if (!from) return;

    const q = query(this.quizCollection, where('category', '==', from));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    await Promise.all(snapshot.docs.map((docSnap) => this.deleteQuizDocAndQuestions(docSnap)));
  }

}