// src/services/AuthService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/user';
import { 
  auth, 
  db,
  toggleFirestoreNetwork
} from '../config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { connectivityManager } from '../utils/ConnectivityManager';
import { FirestoreOfflineHandler } from '../utils/FirestoreOfflineHandler';

// Logs pour vérifier l'état de Firebase
console.log('AuthService - Firebase Auth:', auth ? 'Initialized' : 'Not Initialized');
console.log('AuthService - Firestore DB:', db ? 'Initialized' : 'Not Initialized');
console.log('AuthService - Current User:', auth?.currentUser?.uid || 'No user logged in');

export class AuthService {
  private static readonly USER_STORAGE_KEY = 'unify_user';
  private static readonly TOKEN_STORAGE_KEY = 'unify_token';

  static async login(email: string, password: string): Promise<User> {
    try {
      console.log(`Tentative de connexion avec email: ${email}`);
      
      // Vérifier la connectivité avant de tenter une connexion
      const connectivityStatus = connectivityManager.getStatus();
      if (!connectivityStatus.isConnected) {
        console.warn('Tentative de connexion en mode hors ligne');
        // Tenter une reconnexion
        await connectivityManager.forceReconnect();
      }
      
      // Connexion avec Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      console.log(`Connexion Firebase réussie pour l'utilisateur: ${firebaseUser.uid}`);
      
      // Récupérer les données utilisateur depuis Firestore avec gestion du mode hors ligne
      let user: User;
      try {
        user = await this.getUserDataFromFirestore(firebaseUser);
      } catch (error: any) {
        console.error('Erreur lors de la récupération des données utilisateur:', error);
        
        // Afficher un message d'erreur plus convivial
        const errorMessage = FirestoreOfflineHandler.getErrorMessage(error);
        error.message = errorMessage;
        throw error;
      }
      
      // Stocker localement l'utilisateur et son token 
      await this.setCurrentUser(user);
      await this.setToken(await firebaseUser.getIdToken());
      
      return user;
    } catch (error: any) {
      console.error('Erreur lors de la connexion:', error);
      console.error('Code d\'erreur Firebase:', error.code);
      console.error('Message d\'erreur:', error.message);
      
      // Vérifier si c'est une erreur liée aux règles de sécurité Firebase
      if (error.code === 'permission-denied') {
        console.error('Problème de permission Firebase. Vérifiez vos règles de sécurité Firestore.');
      }
      
      // Ajouter un message plus convivial pour les erreurs de connexion
      if (error.code === 'unavailable' || error.message?.includes('offline')) {
        error.message = "Impossible de se connecter au serveur. Vérifiez votre connexion Internet et réessayez.";
      }
      
      throw error;
    }
  }

  static async register(name: string, email: string, password: string): Promise<User> {
    try {
      console.log(`Tentative d'inscription avec email: ${email} et nom: ${name}`);
      
      // Vérifier la connectivité avant de tenter une inscription
      const connectivityStatus = connectivityManager.getStatus();
      if (!connectivityStatus.isConnected) {
        throw new Error("Vous devez être connecté à Internet pour créer un compte.");
      }
      
      // Créer un nouvel utilisateur avec Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      console.log(`Utilisateur créé avec succès dans Firebase Auth. UID: ${firebaseUser.uid}`);
      
      // Mise à jour du profil avec le nom d'utilisateur
      await updateProfile(firebaseUser, {
        displayName: name
      });
      
      console.log('Profil mis à jour avec le nom d\'utilisateur');
      
      // Créer un document utilisateur dans Firestore
      const user: User = {
        id: firebaseUser.uid,
        email: email,
        name: name,
        created: new Date().toISOString(),
      };
      
      console.log('Tentative de sauvegarde du document utilisateur dans Firestore...');
      console.log('Données à sauvegarder:', JSON.stringify(user));
      
      try {
        // Sauvegarder dans Firestore
        await setDoc(doc(db, 'users', firebaseUser.uid), user);
        console.log('Document utilisateur créé avec succès dans Firestore');
      } catch (firestoreError: any) {
        console.error('ERREUR CRITIQUE lors de l\'écriture dans Firestore:', firestoreError);
        console.error('Code d\'erreur Firestore:', firestoreError.code);
        console.error('Message d\'erreur Firestore:', firestoreError.message);
        
        if (firestoreError.code === 'permission-denied') {
          console.error(`
          !!!! PROBLÈME DE PERMISSIONS FIRESTORE !!!!
          Vérifiez vos règles de sécurité dans la console Firebase.
          
          Règles recommandées pour test:
          rules_version = '2';
          service cloud.firestore {
            match /databases/{database}/documents {
              match /users/{userId} {
                allow read, write: if request.auth != null;
              }
            }
          }
          `);
        } else if (firestoreError.code === 'unavailable' || firestoreError.message?.includes('offline')) {
          console.error(`
          !!!! PROBLÈME DE CONNEXION RÉSEAU !!!!
          L'utilisateur a été créé dans Firebase Auth mais n'a pas pu être enregistré dans Firestore.
          Les données seront synchronisées lorsque la connexion sera rétablie.
          `);
          
          // Tenter une reconnexion
          connectivityManager.forceReconnect();
        }
      }
      
      // Même si l'écriture dans Firestore échoue, continuons pour que l'utilisateur puisse se connecter
      // Stocker localement l'utilisateur et son token
      await this.setCurrentUser(user);
      await this.setToken(await firebaseUser.getIdToken());
      
      console.log('Inscription terminée avec succès');
      return user;
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error);
      console.error('Code d\'erreur Firebase:', error.code);
      console.error('Message d\'erreur:', error.message);
      
      // Vérifier si c'est une erreur liée aux règles de sécurité Firebase
      if (error.code === 'permission-denied') {
        console.error('Problème de permission Firebase. Vérifiez vos règles de sécurité Firestore.');
      }
      
      // Ajouter un message plus convivial pour les erreurs de connexion
      if (error.code === 'unavailable' || error.message?.includes('offline')) {
        error.message = "Impossible de se connecter au serveur. Vérifiez votre connexion Internet et réessayez.";
      }
      
      throw error;
    }
  }

  static async logout(): Promise<void> {
    try {
      // Déconnexion de Firebase
      await firebaseSignOut(auth);
      
      // Supprimer les données locales
      await AsyncStorage.removeItem(this.USER_STORAGE_KEY);
      await AsyncStorage.removeItem(this.TOKEN_STORAGE_KEY);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      throw error;
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      // Vérifier d'abord si un utilisateur Firebase est connecté
      const firebaseUser = auth.currentUser;
      
      if (firebaseUser) {
        // Si l'utilisateur Firebase est connecté, récupérer ses données depuis Firestore
        return this.getUserDataFromFirestore(firebaseUser);
      }
      
      // Sinon, essayer de récupérer depuis le stockage local
      const userJson = await AsyncStorage.getItem(this.USER_STORAGE_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Erreur lors de la récupération du user:', error);
      return null;
    }
  }

  private static async getUserDataFromFirestore(firebaseUser: FirebaseUser): Promise<User> {
    try {
      console.log(`Récupération des données utilisateur depuis Firestore pour ${firebaseUser.uid}`);
      
      // Utiliser FirestoreOfflineHandler pour récupérer le document
      const userDoc = await FirestoreOfflineHandler.executeWithOfflineHandling(
        async () => await getDoc(doc(db, 'users', firebaseUser.uid)),
        undefined, // Pas de fallback, on veut gérer l'erreur nous-mêmes
        2 // Nombre de tentatives
      );
      
      if (userDoc.exists()) {
        console.log('Document utilisateur trouvé dans Firestore');
        return userDoc.data() as User;
      } else {
        console.warn(`Document utilisateur non trouvé dans Firestore pour l'UID: ${firebaseUser.uid}`);
        
        // Créer un utilisateur par défaut en cas de document manquant
        const defaultUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Anonymous',
          created: new Date().toISOString(),
        };
        
        return defaultUser;
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      
      // Vérifier si c'est une erreur de connectivité
      if (FirestoreOfflineHandler.isOfflineError(error)) {
        console.warn('Erreur de connectivité, génération d\'un utilisateur à partir des données Firebase Auth');
        
        // Créer un utilisateur minimal à partir des informations Firebase
        return {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Anonymous',
          created: new Date().toISOString(),
        };
      }
      
      // Pour les autres erreurs, les propager
      throw error;
    }
  }

  static async setCurrentUser(user: User): Promise<void> {
    await AsyncStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(user));
  }

  static async getToken(): Promise<string | null> {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      // Si l'utilisateur est connecté, obtenir un token frais
      return firebaseUser.getIdToken();
    }
    // Sinon, essayer de récupérer depuis le stockage local
    return AsyncStorage.getItem(this.TOKEN_STORAGE_KEY);
  }

  static async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(this.TOKEN_STORAGE_KEY, token);
  }

  static async isAuthenticated(): Promise<boolean> {
    return auth.currentUser !== null;
  }
}
