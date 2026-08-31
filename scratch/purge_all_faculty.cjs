const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const potentialPaths = [
  'C:\\Users\\Ramesh Sahu\\Downloads\\noteit-ai-fd7eb-firebase-adminsdk-fbsvc-f3061dd986.json',
  'C:\\Users\\Ramesh Sahu\\Downloads\\noteit-ai-fd7eb-firebase-adminsdk-fbsvc-dd21a9ff26.json'
];

let serviceAccountPath = potentialPaths.find(p => fs.existsSync(p));

if (!serviceAccountPath) {
  console.error('Service account file not found.');
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccountPath),
  projectId: 'noteit-ai-fd7eb'
});

const auth = getAuth();
const db = getFirestore();

async function purgeAllFaculty() {
  console.log('--- PURGING ALL FACULTY ACCOUNTS FROM FIRESTORE ---');
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  let facultyCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const uid = docSnap.id;
    const isFaculty = data.role === 'faculty' || data.role === 'teacher' || Boolean(data.teacherCode) || data.isFaculty === true;

    if (isFaculty) {
      facultyCount++;
      console.log(`[PURGING FACULTY] UID: ${uid} | Email: ${data.email || 'N/A'} | TeacherCode: ${data.teacherCode || 'N/A'}`);

      // Delete subcollections
      const subcollections = ['lectures', 'notes', 'weakTopics', 'chunks', 'doubts', 'quizzes', 'notifications'];
      for (const sub of subcollections) {
        const subRef = usersRef.doc(uid).collection(sub);
        const subSnap = await subRef.get();
        for (const sDoc of subSnap.docs) {
          await sDoc.ref.delete();
        }
      }

      // Delete main Firestore doc
      await usersRef.doc(uid).delete();
      console.log(`  -> Deleted Firestore faculty doc: ${uid}`);
    }
  }

  console.log(`\nPurged total ${facultyCount} faculty documents from Firestore.`);
  console.log('--- PURGE COMPLETE ---');
  process.exit(0);
}

purgeAllFaculty().catch(err => {
  console.error('Error during purge:', err);
  process.exit(1);
});
