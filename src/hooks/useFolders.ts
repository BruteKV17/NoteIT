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
import { Folder } from '../types';

const DEFAULT_FOLDERS: Folder[] = [];

export function useFolders(userId: string | undefined) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId) {
      const savedLocal = localStorage.getItem('noteit_local_folders');
      if (savedLocal) {
        try {
          const parsed = JSON.parse(savedLocal);
          // Filter out legacy dummy folders if present
          const clean = parsed.filter((f: Folder) => !['f-core', 'f-exam', 'f-lab'].includes(f.id));
          setFolders(clean);
        } catch (e) {
          setFolders([]);
        }
      } else {
        setFolders([]);
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const foldersRef = collection(db, 'users', userId, 'folders');
    const q = query(foldersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const folderList: Folder[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          // Skip legacy default IDs
          if (['f-core', 'f-exam', 'f-lab'].includes(docSnap.id)) return;
          folderList.push({
            id: docSnap.id,
            name: data.name || 'Untitled Folder',
            color: data.color || '#2F6BFF',
            icon: data.icon || 'folder',
            createdAt: data.createdAt
          });
        });
        
        setFolders(folderList);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching folders:', err);
        setFolders([]);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const addFolder = async (name: string, color: string = '#2F6BFF') => {
    const cleanName = name.trim();
    if (!cleanName) return;

    if (!userId) {
      const newFolder: Folder = {
        id: 'f_' + Date.now(),
        name: cleanName,
        color,
        createdAt: new Date().toISOString()
      };
      const updated = [newFolder, ...folders];
      setFolders(updated);
      localStorage.setItem('noteit_local_folders', JSON.stringify(updated));
      return newFolder.id;
    }

    const foldersRef = collection(db, 'users', userId, 'folders');
    const docRef = await addDoc(foldersRef, {
      name: cleanName,
      color,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  };

  const deleteFolder = async (folderId: string) => {
    if (!userId) {
      const updated = folders.filter(f => f.id !== folderId);
      setFolders(updated);
      localStorage.setItem('noteit_local_folders', JSON.stringify(updated));
      return;
    }

    // Only delete custom Firestore folders
    if (!folderId.startsWith('f-')) {
      const folderRef = doc(db, 'users', userId, 'folders', folderId);
      await deleteDoc(folderRef);
    } else {
      setFolders(prev => prev.filter(f => f.id !== folderId));
    }
  };

  const renameFolder = async (folderId: string, newName: string) => {
    const cleanName = newName.trim();
    if (!cleanName) return;

    if (!userId || folderId.startsWith('f-')) {
      setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name: cleanName } : f));
      return;
    }

    const folderRef = doc(db, 'users', userId, 'folders', folderId);
    await updateDoc(folderRef, {
      name: cleanName,
      updatedAt: serverTimestamp()
    });
  };

  return {
    folders,
    isLoading,
    addFolder,
    deleteFolder,
    renameFolder
  };
}
