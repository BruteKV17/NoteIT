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
import { Subject } from '../types';

const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'sub-ds',
    name: 'Data Structures',
    code: 'CS201',
    professor: 'Dr. Alan Turing',
    color: '#3B82F6',
  },
  {
    id: 'sub-os',
    name: 'Operating Systems',
    code: 'CS302',
    professor: 'Dr. Grace Hopper',
    color: '#10B981',
  },
  {
    id: 'sub-la',
    name: 'Linear Algebra',
    code: 'MATH210',
    professor: 'Dr. Gilbert Strang',
    color: '#8B5CF6',
  }
];

export function useSubjects(userId: string | undefined) {
  const [subjects, setSubjects] = useState<Subject[]>(INITIAL_SUBJECTS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setSubjects(INITIAL_SUBJECTS);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const subjectsRef = collection(db, 'users', userId, 'subjects');
    const q = query(subjectsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          setSubjects(INITIAL_SUBJECTS);
        } else {
          const subjectList: Subject[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            subjectList.push({
              id: docSnap.id,
              name: data.name || 'Untitled Subject',
              code: data.code || '',
              professor: data.professor || '',
              color: data.color || '#3B82F6',
              createdAt: data.createdAt,
              archived: !!data.archived,
            });
          });
          setSubjects(subjectList.slice(0, 5));
        }
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching subjects from Firestore:', err);
        setError(err);
        setSubjects(INITIAL_SUBJECTS);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const addSubject = async (subjectData: {
    name: string;
    code?: string;
    professor?: string;
    color?: string;
  }) => {
    if (subjects.filter(s => !s.archived).length >= 5) {
      throw new Error('Maximum limit of 5 active subjects reached. Please delete or archive a subject first.');
    }

    if (!userId) {
      const newSub: Subject = {
        id: `sub-local-${Date.now()}`,
        name: subjectData.name,
        code: subjectData.code || '',
        professor: subjectData.professor || '',
        color: subjectData.color || '#3B82F6',
      };
      setSubjects(prev => [newSub, ...prev].slice(0, 5));
      return newSub.id;
    }

    const subjectsRef = collection(db, 'users', userId, 'subjects');
    const docRef = await addDoc(subjectsRef, {
      ...subjectData,
      createdAt: serverTimestamp(),
      archived: false
    });
    return docRef.id;
  };

  const updateSubject = async (id: string, data: Partial<Subject>) => {
    if (!userId) {
      setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
      return;
    }
    const docRef = doc(db, 'users', userId, 'subjects', id);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
  };

  const deleteSubject = async (id: string) => {
    if (!userId) {
      setSubjects(prev => prev.filter(s => s.id !== id));
      return;
    }
    const docRef = doc(db, 'users', userId, 'subjects', id);
    await deleteDoc(docRef);
  };

  return {
    subjects,
    isLoading,
    error,
    addSubject,
    updateSubject,
    deleteSubject,
  };
}
