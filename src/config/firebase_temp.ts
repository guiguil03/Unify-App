// Import the functions you need from the SDKs you need
import { initializeApp, FirebaseError } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User as FirebaseUser } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB9CjV4LDkFGhA2CY25ddVpqjCM-Lc_cAo",
  authDomain: "unify-app-6c69c.firebaseapp.com",
  projectId: "unify-app-6c69c",
  storageBucket: "unify-app-6c69c.firebasestorage.app",
  messagingSenderId: "953125718195",
  appId: "1:953125718195:web:f8de81cb219571fa53c8c6",
  measurementId: "G-9LE2GE83TH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, analytics, FirebaseError };
export { FirebaseUser };
