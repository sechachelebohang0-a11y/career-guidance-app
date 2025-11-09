import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration for career-platform-22039
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCXVUU69J3hKE3CSVJORO4sBNqG53RnKm8",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "career-platform-22039.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "career-platform-22039",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "career-platform-22039.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "146293686737",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:146293686737:web:b3361913505c88271460f0",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-CR4E123HF2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;