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
import { Lecture } from '../types';
import { getAzureUploadSasUrl, uploadBlobToAzure } from '../services/azure';

export function useLectures(userId: string | undefined) {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLectures([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const lecturesRef = collection(db, 'users', userId, 'lectures');
    const q = query(lecturesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lectureList: Lecture[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          let formattedAddedAt = 'Just now';
          if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            const date = data.createdAt.toDate();
            formattedAddedAt = date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
          } else if (data.addedAt) {
            formattedAddedAt = data.addedAt;
          }

          lectureList.push({
            id: docSnap.id,
            ...data,
            title: data.title || '',
            subject: data.subject || '',
            status: data.status || 'transcribing',
            type: data.type || 'recording',
            addedAt: formattedAddedAt,
          });
        });
        setLectures(lectureList);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching lectures:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const addLecture = async (lectureData: {
    title: string;
    subject: string;
    duration?: string;
    type: 'recording' | 'pdf' | 'ppt' | 'text';
    status: Lecture['status'];
    pages?: number;
    addedAt?: string;
  }) => {
    if (!userId) throw new Error('User not authenticated');
    const lecturesRef = collection(db, 'users', userId, 'lectures');
    const docRef = await addDoc(lecturesRef, {
      ...lectureData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  };

  const updateLecture = async (id: string, data: Partial<Lecture>) => {
    if (!userId) throw new Error('User not authenticated');
    const lectureRef = doc(db, 'users', userId, 'lectures', id);
    await updateDoc(lectureRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteLecture = async (id: string) => {
    if (!userId) throw new Error('User not authenticated');
    const lectureRef = doc(db, 'users', userId, 'lectures', id);
    await deleteDoc(lectureRef);
  };

  const uploadLectureAudio = async (
    lectureId: string, 
    audioBlob: Blob, 
    onProgress: (progress: number) => void
  ): Promise<string> => {
    if (!userId) throw new Error('User not authenticated');

    const timestamp = Math.floor(Date.now() / 1000);
    const fileName = `${timestamp}.webm`;

    // 1. Get Azure SAS URL from Express Backend
    const sasData = await getAzureUploadSasUrl(fileName);

    // 2. Upload file directly to Azure Blob Storage
    await uploadBlobToAzure(sasData.uploadUrl, audioBlob, onProgress);

    // 3. Update the Firestore lecture document
    await updateLecture(lectureId, {
      status: 'uploaded',
      audioUrl: sasData.audioUrl,
      blobPath: sasData.blobPath,
      storageProvider: 'azure',
      storageVersion: 1,
      uploadedAt: serverTimestamp()
    });

    return sasData.audioUrl;
  };

  const uploadLectureDocument = async (
    lectureId: string, 
    file: File, 
    onProgress: (progress: number) => void
  ): Promise<{ audioUrl: string; blobPath: string }> => {
    if (!userId) throw new Error('User not authenticated');

    const timestamp = Math.floor(Date.now() / 1000);
    const fileExtension = file.name.split('.').pop() || 'pdf';
    const fileName = `${timestamp}.${fileExtension}`;

    // 1. Get Azure SAS URL from Express Backend
    const sasData = await getAzureUploadSasUrl(fileName);

    // 2. Upload file directly to Azure Blob Storage
    await uploadBlobToAzure(sasData.uploadUrl, file, onProgress);

    // 3. Update the Firestore lecture document
    await updateLecture(lectureId, {
      status: 'uploaded',
      audioUrl: sasData.audioUrl,
      blobPath: sasData.blobPath,
      storageProvider: 'azure',
      storageVersion: 1,
      uploadedAt: serverTimestamp()
    });

    return { audioUrl: sasData.audioUrl, blobPath: sasData.blobPath };
  };

  return { 
    lectures, 
    isLoading, 
    error, 
    addLecture, 
    updateLecture, 
    deleteLecture, 
    uploadLectureAudio,
    uploadLectureDocument
  };
}
