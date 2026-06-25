import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';

const serviceAccountPath = path.resolve('noteit-ai-fd7eb-firebase-adminsdk-fbsvc-f3061dd986.json');

console.log('Initializing Firebase Admin...');
initializeApp({
  credential: cert(serviceAccountPath),
  projectId: 'noteit-ai-fd7eb'
});

const auth = getAuth();
const db = getFirestore();

async function purgeAuthUsers() {
  console.log('Fetching Firebase Auth users...');
  let nextPageToken: string | undefined = undefined;
  let totalUsers = 0;

  do {
    const listUsersResult = await auth.listUsers(1000, nextPageToken);
    const uids = listUsersResult.users.map((user) => user.uid);
    
    if (uids.length > 0) {
      console.log(`Deleting batch of ${uids.length} users...`);
      const deleteResult = await auth.deleteUsers(uids);
      totalUsers += deleteResult.successCount;
      console.log(`Deleted ${deleteResult.successCount} users. Failures: ${deleteResult.failureCount}`);
    }
    
    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);

  console.log(`Auth Purge Complete. Total users deleted: ${totalUsers}`);
}

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

async function purgeFirestore() {
  console.log('Purging Firestore collections...');
  
  // Get all documents in 'users' collection
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  
  console.log(`Found ${snapshot.size} root user documents to purge recursively.`);
  
  for (const docSnap of snapshot.docs) {
    const userId = docSnap.id;
    console.log(`Purging subcollections for user: ${userId}`);
    
    // Subcollections commonly used: 'lectures', 'notes', 'weakTopics', 'chunks'
    const subcollections = ['lectures', 'notes', 'weakTopics', 'chunks'];
    for (const sub of subcollections) {
      const subRef = usersRef.doc(userId).collection(sub);
      
      // Chunks are subcollections under lectures too: users/{uid}/lectures/{lid}/chunks
      if (sub === 'lectures') {
        const lecturesSnapshot = await subRef.get();
        for (const lectureDoc of lecturesSnapshot.docs) {
          const chunksRef = subRef.doc(lectureDoc.id).collection('chunks');
          await deleteCollection(chunksRef);
        }
      }
      
      await deleteCollection(subRef);
    }
    
    // Delete the user document itself
    await usersRef.doc(userId).delete();
  }
  
  console.log('Firestore Purge Complete.');
}

async function main() {
  try {
    await purgeAuthUsers();
    await purgeFirestore();
    console.log('--- PURGE COMPLETE ---');
  } catch (error) {
    console.error('Purge failed:', error);
  }
}

main();
