// Import Firebase
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getDatabase, Database } from 'firebase/database';
import Constants from 'expo-constants';

// Obtenir les variables d'environnement d'Expo
const expoConstants = Constants.expoConfig?.extra || {};

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDIJyjyh2j9pUzgRhUZLeRlzj23FDHQBiw",
  authDomain: "millecoeurs-ba7a7.firebaseapp.com",
  databaseURL: "https://millecoeurs-ba7a7-default-rtdb.firebaseio.com",
  projectId: "millecoeurs-ba7a7",
  storageBucket: "millecoeurs-ba7a7.firebasestorage.app",
  messagingSenderId: "397224772460",
  appId: "1:397224772460:web:b994c9511b12b9329a2949",
  measurementId: "G-3BY2NJZWC4"
};

// Vérifier si la configuration est valide
const isValidConfig = (config: any) => {
  return Object.values(config).every(value => 
    value && typeof value === 'string' && !value.includes("YOUR_")
  );
};

if (!isValidConfig(firebaseConfig)) {
  console.error("⚠️ CONFIGURATION FIREBASE INVALIDE:", 
    Object.entries(firebaseConfig)
      .filter(([_, value]) => !value || typeof value !== 'string' || value.includes("YOUR_"))
      .map(([key]) => key)
      .join(", ")
  );
}

console.log("Initialisation de Firebase avec la configuration:", JSON.stringify(firebaseConfig, null, 2));

// Initialize Firebase
let app: FirebaseApp, 
    auth: Auth, 
    db: Firestore, 
    storage: FirebaseStorage, 
    analytics: Analytics | undefined, 
    rtdb: Database;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  rtdb = getDatabase(app);
  
  // Initialiser Analytics uniquement sur les plateformes qui le supportent
  try {
    analytics = getAnalytics(app);
    console.log("✅ Firebase Analytics initialisé avec succès!");
  } catch (analyticsError) {
    console.log("ℹ️ Firebase Analytics non initialisé - peut ne pas être supporté sur cette plateforme");
  }
  
  console.log("✅ Firebase initialisé avec succès!");
} catch (error) {
  console.error("❌ ERREUR lors de l'initialisation de Firebase:", error);
  throw error;
}

export { app, auth, db, storage, analytics, rtdb, FirebaseUser };
