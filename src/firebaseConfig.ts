import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== "your-api-key" ? import.meta.env.VITE_FIREBASE_API_KEY : "AIzaSyC4hEF45wNTjCyLiqAuD8cop7w8_bpIMdI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN && import.meta.env.VITE_FIREBASE_AUTH_DOMAIN !== "your-auth-domain-here.firebaseapp.com" ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN : "noteit-ai-fd7eb.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID && import.meta.env.VITE_FIREBASE_PROJECT_ID !== "your-project-id" ? import.meta.env.VITE_FIREBASE_PROJECT_ID : "noteit-ai-fd7eb",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET && import.meta.env.VITE_FIREBASE_STORAGE_BUCKET !== "your-project-id.appspot.com" ? import.meta.env.VITE_FIREBASE_STORAGE_BUCKET : "noteit-ai-fd7eb.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID && import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID !== "your-sender-id" ? import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID : "875264975258",
  appId: import.meta.env.VITE_FIREBASE_APP_ID && import.meta.env.VITE_FIREBASE_APP_ID !== "your-app-id" ? import.meta.env.VITE_FIREBASE_APP_ID : "1:875264975258:web:51c2d690fb1dd3c510da23",
  measurementId: "G-P7SZDHV263"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);