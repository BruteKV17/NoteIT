import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

const potentialPaths = [
  'C:\\Users\\Ramesh Sahu\\Downloads\\noteit-ai-fd7eb-firebase-adminsdk-fbsvc-f3061dd986.json',
  'C:\\Users\\Ramesh Sahu\\Downloads\\noteit-ai-fd7eb-firebase-adminsdk-fbsvc-dd21a9ff26.json',
  path.resolve('noteit-ai-fd7eb-firebase-adminsdk-fbsvc-f3061dd986.json'),
];

let serviceAccountPath = potentialPaths.find(p => fs.existsSync(p));

if (!serviceAccountPath) {
  console.error('Service account JSON file not found.');
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccountPath),
  projectId: 'noteit-ai-fd7eb'
});

const auth = getAuth();
const db = getFirestore();

async function scanAndPurgeFaculty() {
  console.log('--- SCANNING ALL USERS IN FIRESTORE ---');
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  console.log(`Total users in Firestore: ${snapshot.size}`);

  const facultyDocs: any[] = [];
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const uid = docSnap.id;
    const isFaculty = data.role === 'faculty' || data.role === 'teacher' || Boolean(data.teacherCode) || data.isFaculty === true;
    
    console.log(`UID: ${uid} | Email: ${data.email || 'N/A'} | Role: ${data.role || 'student'} | TeacherCode: ${data.teacherCode || 'N/A'}`);
    
    if (isFaculty) {
      facultyDocs.push({ uid, email: data.email });
    }
  }

  console.log(`\nFound ${facultyDocs.length} faculty documents to purge.`);

  for (const item of facultyDocs) {
    console.log(`Purging Faculty doc: ${item.uid} (${item.email})`);
    
    // Delete user subcollections
    const subcollections = ['lectures', 'notes', 'weakTopics', 'chunks', 'doubts', 'quizzes', 'notifications'];
    for (const sub of subcollections) {
      const subRef = usersRef.doc(item.uid).collection(sub);
      const subSnap = await subRef.get();
      for (const sDoc of subSnap.docs) {
        await sDoc.ref.delete();
      }
    }

    // Delete Firestore user document
    await usersRef.doc(item.uid).delete();
    console.log(` -> Deleted Firestore faculty document ${item.uid}`);
  }

  console.log('\n--- SCANNING FIREBASE AUTH FOR FACULTY USERS ---');
  // Check if any auth users are remaining that are faculty
  console.log('Done scanning.');
}

scanAndPurgeFaculty().catch(console.error);
