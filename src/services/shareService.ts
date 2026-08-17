/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { Lecture } from '../types';

/**
 * Shares a lecture note with another student using NoteIT AI by recipient email.
 * If the student exists, writes directly to their lectures collection.
 * If not yet registered, stores in pendingShares for automatic claim on registration.
 */
export async function shareLectureWithEmail(lecture: Lecture, recipientEmail: string): Promise<{ success: boolean; recipientFound: boolean }> {
  const cleanEmail = recipientEmail.trim().toLowerCase();
  if (!cleanEmail) throw new Error('Recipient email is required');

  const currentUser = auth.currentUser;
  const senderEmail = currentUser?.email || 'peer@noteit.ai';
  const senderName = currentUser?.displayName || senderEmail.split('@')[0] || 'Peer Scholar';

  const sharedLecturePayload = {
    title: lecture.title,
    subject: lecture.subject || 'General',
    subjectId: lecture.subjectId || '',
    duration: lecture.duration || '45m',
    type: lecture.type || 'text',
    status: 'completed',
    transcript: lecture.transcript || '',
    cleanTranscript: lecture.cleanTranscript || lecture.transcript || '',
    summary: lecture.summary || '',
    notes: lecture.notes || null,
    flashcards: lecture.flashcards || [],
    quiz: lecture.quiz || [],
    isShared: true,
    sharedByEmail: senderEmail,
    sharedByName: senderName,
    sharedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  // 1. Search for recipient in 'users' collection or user profiles
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', cleanEmail));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const recipientDoc = querySnapshot.docs[0];
      const recipientLecturesRef = collection(db, 'users', recipientDoc.id, 'lectures');
      await addDoc(recipientLecturesRef, sharedLecturePayload);
      return { success: true, recipientFound: true };
    }
  } catch (err) {
    console.warn("Could not query users directly, staging to pendingShares:", err);
  }

  // 2. Stage to pendingShares so recipient receives notes when logging in
  const pendingRef = collection(db, 'pendingShares');
  await addDoc(pendingRef, {
    ...sharedLecturePayload,
    recipientEmail: cleanEmail
  });

  return { success: true, recipientFound: false };
}
