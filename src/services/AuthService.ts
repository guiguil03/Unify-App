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
import { handleFirebaseError, showSuccessToast } from '../utils/errorHandler';

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
      
      // Connexion avec Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      console.log(`Connexion Firebase réussie pour l'utilisateur: ${firebaseUser.uid}`);
      
      // Récupérer les données utilisateur depuis Firestore
      let user: User;
      try {
        user = await this.getUserDataFromFirestore(firebaseUser);
      } catch (error: any) {
        // Pas de console.error, juste propager l'erreur
        throw error;
      }
      
      // Stocker localement l'utilisateur et son token 
      await this.setCurrentUser(user);
      await this.setToken(await firebaseUser.getIdToken());
      
      // Afficher un toast de succès
      showSuccessToast('Connexion réussie !');
      
      return user;
    } catch (error: any) {
      // Erreur déjà gérée dans Auth Context
      throw error;
    }
  }

  static async register(name: string, email: string, password: string): Promise<User> {
    try {
      console.log(`Tentative d'inscription avec email: ${email} et nom: ${name}`);
      
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
        
        // Utiliser notre utilitaire pour gérer l'erreur
        handleFirebaseError(firestoreError, 'Problème lors de la création du profil');
        
        // Ne pas arrêter l'inscription si la création du profil échoue
      }
      
      // Stocker localement l'utilisateur et son token
      await this.setCurrentUser(user);
      await this.setToken(await firebaseUser.getIdToken());
      
      // Afficher un toast de succès
      showSuccessToast('Inscription réussie ! Bienvenue !');
      
      console.log('Inscription terminée avec succès');
      return user;
    } catch (error: any) {
      // Erreur déjà gérée dans Auth Context
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
      
      // Afficher un toast de succès
      showSuccessToast('Vous êtes déconnecté');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      
      // Utiliser notre utilitaire pour gérer l'erreur
      handleFirebaseError(error, 'Problème lors de la déconnexion');
      
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
      // Log silencieux en mode production
      if (process.env.NODE_ENV === 'development') {
        console.log('Erreur lors de la récupération du user (info):', error);
      }
      return null;
    }
  }

  private static async getUserDataFromFirestore(firebaseUser: FirebaseUser): Promise<User> {
    try {
      console.log(`Récupération des données utilisateur depuis Firestore pour ${firebaseUser.uid}`);
      
      // Récupérer le document
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        console.log('Document utilisateur trouvé dans Firestore');
        return userDoc.data() as User;
      } else {
        console.log(`Document utilisateur non trouvé dans Firestore pour l'UID: ${firebaseUser.uid}`);
        
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
      // Réduire les logs d'erreur
      if (process.env.NODE_ENV === 'development') {
        console.log('Problème avec Firestore (info):', error.code);
      }
      
      // Créer un utilisateur minimal à partir des informations Firebase
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Anonymous',
        created: new Date().toISOString(),
      };
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
