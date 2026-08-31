import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';
import fs from 'fs';

const serviceAccountPath = 'C:\\Users\\Ramesh Sahu\\Downloads\\noteit-ai-fd7eb-firebase-adminsdk-fbsvc-f3061dd986.json';

if (!fs.existsSync(serviceAccountPath)) {
  console.error('Service account JSON file not found at:', serviceAccountPath);
  process.exit(1);
}

console.log('Initializing Firebase Admin SDK with service account...');
initializeApp({
  credential: cert(serviceAccountPath),
  projectId: 'noteit-ai-fd7eb'
});

const auth = getAuth();
const db = getFirestore();

async function deleteCollection(collectionRef: any) {
  const query = collectionRef.limit(100);
  return new Promise<void>((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(db: any, query: any, resolve: any) {
  const snapshot = await query.get();
  const batchSize = snapshot.size;
  if (batchSize === 0) {
    resolve();
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc: any) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  process.nextTick(() => {
    deleteQueryBatch(db, query, resolve);
  });
}

async function purgeTeachers() {
  console.log('\n--- SCANNING FIRESTORE USERS FOR TEACHERS/FACULTY ---');
  
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  
  console.log(`Total user documents in Firestore: ${snapshot.size}`);

  const teacherUids: string[] = [];
  const teacherEmails: string[] = [];

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const uid = docSnap.id;
    
    // Check if this document represents a teacher/faculty
    const isTeacher = 
      data.role === 'faculty' || 
      data.role === 'teacher' || 
      Boolean(data.teacherCode) || 
      data.isFaculty === true ||
      Array.isArray(data.subjects) ||
      Boolean(data.department);

    if (isTeacher) {
      teacherUids.push(uid);
      teacherEmails.push(data.email || 'no-email');
      console.log(`[TEACHER FOUND] UID: ${uid} | Email: ${data.email || 'N/A'} | Role: ${data.role || 'N/A'} | Code: ${data.teacherCode || 'N/A'}`);
    } else {
      console.log(`[STUDENT/OTHER] UID: ${uid} | Email: ${data.email || 'N/A'} | Role: ${data.role || 'student'}`);
    }
  }

  console.log(`\nIdentified ${teacherUids.length} teacher/faculty user account(s).`);

  if (teacherUids.length === 0) {
    console.log('No teacher accounts found in Firestore.');
  } else {
    console.log('\n--- PURGING TEACHER DATA FROM FIRESTORE AND FIREBASE AUTH ---');

    for (let i = 0; i < teacherUids.length; i++) {
      const uid = teacherUids[i];
      const email = teacherEmails[i];

      console.log(`\nProcessing deletion for Teacher: ${email} (UID: ${uid})`);

      // 1. Delete user subcollections in Firestore
      const subcollections = ['lectures', 'notes', 'weakTopics', 'chunks', 'doubts', 'quizzes', 'notifications'];
      for (const sub of subcollections) {
        const subRef = usersRef.doc(uid).collection(sub);
        if (sub === 'lectures') {
          const lecturesSnapshot = await subRef.get();
          for (const lectureDoc of lecturesSnapshot.docs) {
            const chunksRef = subRef.doc(lectureDoc.id).collection('chunks');
            await deleteCollection(chunksRef);
          }
        }
        await deleteCollection(subRef);
      }

      // 2. Delete root Firestore user document
      await usersRef.doc(uid).delete();
      console.log(`  -> Deleted Firestore user document: ${uid}`);

      // 3. Revoke/Delete user from Firebase Auth
      try {
        await auth.deleteUser(uid);
        console.log(`  -> Revoked login & deleted Firebase Auth account: ${uid} (${email})`);
      } catch (authErr: any) {
        if (authErr.code === 'auth/user-not-found') {
          console.log(`  -> User not found in Firebase Auth (already removed): ${uid}`);
        } else {
          console.error(`  -> Failed to delete Firebase Auth user ${uid}:`, authErr.message);
        }
      }
    }
  }

  // Also check Firebase Auth directly for any remaining accounts with teacher emails or custom claims
  console.log('\n--- CHECKING FIREBASE AUTH FOR ALL USERS ---');
  let nextPageToken: string | undefined = undefined;
  do {
    const listUsersResult = await auth.listUsers(1000, nextPageToken);
    for (const userRecord of listUsersResult.users) {
      if (!teacherUids.includes(userRecord.uid)) {
        console.log(`[AUTH USER] UID: ${userRecord.uid} | Email: ${userRecord.email || 'N/A'}`);
      }
    }
    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);

  console.log('\n========================================');
  console.log('PURGE TEACHERS COMPLETED SUCCESSFULLY');
  console.log('========================================\n');
}

purgeTeachers().catch((err) => {
  console.error('Fatal error in purgeTeachers script:', err);
  process.exit(1);
});
