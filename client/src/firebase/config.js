import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration for career-platform-22039
const firebaseConfig = {
  apiKey: "AIzaSyCXVUU69J3hKE3CSVJORO4sBNqG53RnKm8",
  authDomain: "career-platform-22039.firebaseapp.com",
  projectId: "career-platform-22039",
  storageBucket: "career-platform-22039.firebasestorage.app",
  messagingSenderId: "146293686737",
  appId: "1:146293686737:web:b3361913505c88271460f0",
  measurementId: "G-CR4E123HF2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Analytics (optional)
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

export default app;