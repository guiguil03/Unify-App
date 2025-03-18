// Import Firebase
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, User as FirebaseUser } from 'firebase/auth';
import { 
  getFirestore, 
  Firestore, 
  initializeFirestore, 
  CACHE_SIZE_UNLIMITED,
  enableIndexedDbPersistence,
  disableNetwork,
  enableNetwork
} from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getDatabase, Database } from 'firebase/database';
import Constants from 'expo-constants';

// Obtenir les variables d'environnement d'Expo
const expoConstants = Constants.expoConfig?.extra || {};

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB9CjV4LDkFGhA2CY25ddVpqjCM-Lc_cAo",
  authDomain: "unify-app-6c69c.firebaseapp.com",
  projectId: "unify-app-6c69c",
  storageBucket: "unify-app-6c69c.firebasestorage.app",
  messagingSenderId: "953125718195",
  appId: "1:953125718195:web:f8de81cb219571fa53c8c6",
  measurementId: "G-9LE2GE83TH"
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
  
  // Utiliser initializeFirestore avec configuration optimisée pour la connexion
  db = initializeFirestore(app, {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    experimentalForceLongPolling: true, // Utiliser le long polling au lieu de WebChannels
  });
  
  // Activer la persistance des données pour le mode hors ligne
  enableIndexedDbPersistence(db)
    .then(() => {
      console.log("✅ Persistance Firestore activée avec succès!");
    })
    .catch((err) => {
      console.warn("⚠️ Erreur lors de l'activation de la persistance Firestore:", err);
      if (err.code === 'failed-precondition') {
        console.warn("La persistance ne peut fonctionner qu'avec un seul onglet ouvert à la fois");
      } else if (err.code === 'unimplemented') {
        console.warn("Le navigateur actuel ne prend pas en charge la persistance");
      }
    });
  
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

// Fonctions utilitaires pour gérer la connectivité
export const toggleFirestoreNetwork = async (enable: boolean) => {
  try {
    if (enable) {
      await enableNetwork(db);
      console.log("✅ Réseau Firestore activé");
    } else {
      await disableNetwork(db);
      console.log("✅ Réseau Firestore désactivé");
    }
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de ${enable ? 'l\'activation' : 'la désactivation'} du réseau:`, error);
    return false;
  }
};

export { app, auth, db, storage, analytics, rtdb, FirebaseUser };
