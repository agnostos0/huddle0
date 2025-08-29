// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBNpmJTV_rfI3OGe9M4c3tYlewEFWEsh-c",
  authDomain: "huddle-e6492.firebaseapp.com",
  projectId: "huddle-e6492",
  storageBucket: "huddle-e6492.firebasestorage.app",
  messagingSenderId: "372177575034",
  appId: "1:372177575034:web:71e1469e4e22348c62efc3",
  measurementId: "G-0WB9FSR984"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { app, analytics, auth, db, storage, googleProvider };
export default app;
