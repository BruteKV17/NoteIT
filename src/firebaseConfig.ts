import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC4hEF45wNTjCyLiqAuD8cop7w8_bpIMdI",
  authDomain: "noteit-ai-fd7eb.firebaseapp.com",
  projectId: "noteit-ai-fd7eb",
  storageBucket: "noteit-ai-fd7eb.firebasestorage.app",
  messagingSenderId: "875264975258",
  appId: "1:875264975258:web:51c2d690fb1dd3c510da23",
  measurementId: "G-P7SZDHV263"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);