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

export function useFolders(userId: string | undefined) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper to load local folders
  const getLocalFolders = (): Folder[] => {
    const savedLocal = localStorage.getItem('noteit_local_folders');
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        return parsed.filter((f: Folder) => !['f-core', 'f-exam', 'f-lab'].includes(f.id));
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  useEffect(() => {
    if (!userId) {
      setFolders(getLocalFolders());
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
          if (['f-core', 'f-exam', 'f-lab'].includes(docSnap.id)) return;
          folderList.push({
            id: docSnap.id,
            name: data.name || 'Untitled Folder',
            color: data.color || '#2F6BFF',
            icon: data.icon || 'folder',
            createdAt: data.createdAt
          });
        });
        
        // Also merge any local fallback folders if needed
        const localFolders = getLocalFolders();
        const mergedMap = new Map<string, Folder>();
        folderList.forEach(f => mergedMap.set(f.id, f));
        localFolders.forEach(f => {
          if (!mergedMap.has(f.id)) mergedMap.set(f.id, f);
        });

        setFolders(Array.from(mergedMap.values()));
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching folders from Firestore, using local storage fallback:', err);
        setFolders(getLocalFolders());
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const addFolder = async (name: string, color: string = '#2F6BFF') => {
    const cleanName = name.trim();
    if (!cleanName) return null;

    const newLocalFolder: Folder = {
      id: 'f_' + Date.now(),
      name: cleanName,
      color,
      createdAt: new Date().toISOString()
    };

    if (!userId) {
      setFolders(prev => {
        const updated = [newLocalFolder, ...prev.filter(f => f.id !== newLocalFolder.id)];
        localStorage.setItem('noteit_local_folders', JSON.stringify(updated));
        return updated;
      });
      return newLocalFolder.id;
    }

    try {
      const foldersRef = collection(db, 'users', userId, 'folders');
      const docRef = await addDoc(foldersRef, {
        name: cleanName,
        color,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (err) {
      console.error('Error adding folder to Firestore, saving locally:', err);
      setFolders(prev => {
        const updated = [newLocalFolder, ...prev.filter(f => f.id !== newLocalFolder.id)];
        localStorage.setItem('noteit_local_folders', JSON.stringify(updated));
        return updated;
      });
      return newLocalFolder.id;
    }
  };

  const deleteFolder = async (folderId: string) => {
    setFolders(prev => {
      const updated = prev.filter(f => f.id !== folderId);
      localStorage.setItem('noteit_local_folders', JSON.stringify(updated));
      return updated;
    });

    if (!userId || folderId.startsWith('f_')) {
      return;
    }

    try {
      const folderRef = doc(db, 'users', userId, 'folders', folderId);
      await deleteDoc(folderRef);
    } catch (err) {
      console.error('Error deleting folder from Firestore:', err);
    }
  };

  const renameFolder = async (folderId: string, newName: string) => {
    const cleanName = newName.trim();
    if (!cleanName) return;

    setFolders(prev => {
      const updated = prev.map(f => f.id === folderId ? { ...f, name: cleanName } : f);
      localStorage.setItem('noteit_local_folders', JSON.stringify(updated));
      return updated;
    });

    if (!userId || folderId.startsWith('f_')) {
      return;
    }

    try {
      const folderRef = doc(db, 'users', userId, 'folders', folderId);
      await updateDoc(folderRef, {
        name: cleanName,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error renaming folder in Firestore:', err);
    }
  };

  return {
    folders,
    isLoading,
    addFolder,
    deleteFolder,
    renameFolder
  };
}

