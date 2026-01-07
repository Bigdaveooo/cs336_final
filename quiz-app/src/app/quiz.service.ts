import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy } from '@angular/fire/firestore';
import { Quiz, Category } from './models';

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  constructor(private firestore: Firestore) {}

  // Categories
  async getCategories(): Promise<Category[]> {
    try {
      const categoriesRef = collection(this.firestore, 'categories');
      const q = query(categoriesRef, orderBy('createdAt', 'asc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()['createdAt']?.toDate() || new Date(),
      })) as Category[];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  async createCategory(category: Omit<Category, 'id'>): Promise<string> {
    try {
      const categoriesRef = collection(this.firestore, 'categories');
      const docRef = await addDoc(categoriesRef, {
        ...category,
        createdAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  async updateCategory(categoryId: string, updates: Partial<Category>): Promise<void> {
    try {
      const categoryRef = doc(this.firestore, 'categories', categoryId);
      await updateDoc(categoryRef, updates);
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  async deleteCategory(categoryId: string): Promise<void> {
    try {
      const categoryRef = doc(this.firestore, 'categories', categoryId);
      await deleteDoc(categoryRef);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  // Quizzes
  async getQuizzes(): Promise<Quiz[]> {
    try {
      const quizzesRef = collection(this.firestore, 'quizzes');
      const q = query(quizzesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()['createdAt']?.toDate() || new Date(),
        updatedAt: doc.data()['updatedAt']?.toDate() || new Date(),
      })) as Quiz[];
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      return [];
    }
  }

  async createQuiz(quiz: Omit<Quiz, 'id'>): Promise<string> {
    try {
      const quizzesRef = collection(this.firestore, 'quizzes');
      const docRef = await addDoc(quizzesRef, {
        ...quiz,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating quiz:', error);
      throw error;
    }
  }

  async updateQuiz(quizId: string, updates: Partial<Quiz>): Promise<void> {
    try {
      const quizRef = doc(this.firestore, 'quizzes', quizId);
      await updateDoc(quizRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating quiz:', error);
      throw error;
    }
  }

  async deleteQuiz(quizId: string): Promise<void> {
    try {
      const quizRef = doc(this.firestore, 'quizzes', quizId);
      await deleteDoc(quizRef);
    } catch (error) {
      console.error('Error deleting quiz:', error);
      throw error;
    }
  }

  async getQuizzesByCategory(categoryId: string): Promise<Quiz[]> {
    try {
      const quizzesRef = collection(this.firestore, 'quizzes');
      const q = query(
        quizzesRef, 
        where('categoryId', '==', categoryId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()['createdAt']?.toDate() || new Date(),
        updatedAt: doc.data()['updatedAt']?.toDate() || new Date(),
      })) as Quiz[];
    } catch (error) {
      console.error('Error fetching quizzes by category:', error);
      return [];
    }
  }
}