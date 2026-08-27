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

const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'sub-def-1', name: 'Data Structures', code: 'CS201', professor: 'Prof. Kishan Verma', teacherCode: 'CS201', color: '#3B82F6' },
  { id: 'sub-def-2', name: 'Operating Systems', code: 'CS301', professor: 'Prof. Sharma', teacherCode: 'CS301', color: '#10B981' },
  { id: 'sub-def-3', name: 'Computer Networks', code: 'CS302', professor: 'Prof. Gupta', teacherCode: 'CS302', color: '#8B5CF6' },
  { id: 'sub-def-4', name: 'Database Management', code: 'CS303', professor: 'Prof. Roy', teacherCode: 'CS303', color: '#F59E0B' },
  { id: 'sub-def-5', name: 'Machine Learning', code: 'CS401', professor: 'Prof. Mehta', teacherCode: 'CS401', color: '#EC4899' },
];

export function useSubjects(userId: string | undefined) {
  const [subjects, setSubjects] = useState<Subject[]>(DEFAULT_SUBJECTS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setSubjects(DEFAULT_SUBJECTS);
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
          setSubjects(DEFAULT_SUBJECTS);
        } else {
          const subjectList: Subject[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            subjectList.push({
              id: docSnap.id,
              name: data.name || 'Untitled Subject',
              code: data.code || '',
              professor: data.professor || data.teacherCode || '',
              teacherCode: data.teacherCode || data.professor || '',
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
        setSubjects(DEFAULT_SUBJECTS);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const addSubject = async (subjectData: {
    name: string;
    code?: string;
    professor?: string;
    teacherCode?: string;
    color?: string;
  }) => {
    if (subjects.filter(s => !s.archived).length >= 5) {
      throw new Error('Maximum limit of 5 active subjects reached. Please delete or archive a subject first.');
    }

    const tCode = subjectData.teacherCode || subjectData.professor || '';

    if (!userId) {
      const newSub: Subject = {
        id: `sub-local-${Date.now()}`,
        name: subjectData.name,
        code: subjectData.code || '',
        professor: tCode,
        teacherCode: tCode,
        color: subjectData.color || '#3B82F6',
      };
      setSubjects(prev => [newSub, ...prev].slice(0, 5));
      return newSub.id;
    }

    try {
      const subjectsRef = collection(db, 'users', userId, 'subjects');
      const docRef = await addDoc(subjectsRef, {
        ...subjectData,
        professor: tCode,
        teacherCode: tCode,
        createdAt: serverTimestamp(),
        archived: false
      });
      return docRef.id;
    } catch (err) {
      console.warn('Firestore error creating subject, falling back to local state:', err);
      const newSub: Subject = {
        id: `sub-local-${Date.now()}`,
        name: subjectData.name,
        code: subjectData.code || '',
        professor: tCode,
        teacherCode: tCode,
        color: subjectData.color || '#3B82F6',
      };
      setSubjects(prev => [newSub, ...prev].slice(0, 5));
      return newSub.id;
    }
  };

  const updateSubject = async (id: string, data: Partial<Subject>) => {
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    if (!userId) return;
    try {
      const docRef = doc(db, 'users', userId, 'subjects', id);
      await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
    } catch (err) {
      console.warn('Firestore error updating subject:', err);
    }
  };

  const deleteSubject = async (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    if (!userId) return;
    try {
      const docRef = doc(db, 'users', userId, 'subjects', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore error deleting subject:', err);
    }
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
