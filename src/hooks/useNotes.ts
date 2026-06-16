import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Note } from '../types';

export function useNotes(userId: string | undefined) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setNotes([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const notesRef = collection(db, 'users', userId, 'notes');
    const q = query(notesRef, orderBy('updatedAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notesList: Note[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          notesList.push({
            id: docSnap.id,
            title: data.title || '',
            content: data.content || '',
            lectureId: data.lectureId,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        });
        setNotes(notesList);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching notes:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const addNote = async (title: string, content: string) => {
    if (!userId) throw new Error('User not authenticated');
    const notesRef = collection(db, 'users', userId, 'notes');
    await addDoc(notesRef, {
      title,
      content,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const updateNote = async (id: string, data: { title?: string; content?: string }) => {
    if (!userId) throw new Error('User not authenticated');
    const noteRef = doc(db, 'users', userId, 'notes', id);
    await updateDoc(noteRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteNote = async (id: string) => {
    if (!userId) throw new Error('User not authenticated');
    const noteRef = doc(db, 'users', userId, 'notes', id);
    await deleteDoc(noteRef);
  };

  return { notes, isLoading, error, addNote, updateNote, deleteNote };
}
