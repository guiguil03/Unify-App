// src/services/AuthService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/user';
import { 
  auth, 
  db, 
  FirebaseUser 
} from '../config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export class AuthService {
  private static readonly USER_STORAGE_KEY = 'unify_user';
  private static readonly TOKEN_STORAGE_KEY = 'unify_token';

  static async login(email: string, password: string): Promise<User> {
    try {
      console.log(`Tentative de connexion avec l'email: ${email}`);
      
      // Utiliser l'authentification Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      console.log(`Authentification réussie pour l'utilisateur avec UID: ${firebaseUser.uid}`);
      
      // Récupérer les données utilisateur depuis Firestore
      const user = await this.getUserDataFromFirestore(firebaseUser);
      
      // Stocker localement l'utilisateur et son token
      await this.setCurrentUser(user);
      await this.setToken(await firebaseUser.getIdToken());
      
      console.log('Connexion complète et données utilisateur stockées localement');
      return user;
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      console.error('Code d\'erreur Firebase:', error.code);
      console.error('Message d\'erreur:', error.message);
      
      // Vérifier si c'est une erreur liée aux règles de sécurité Firebase
      if (error.code === 'permission-denied') {
        console.error('Problème de permission Firebase. Vérifiez vos règles de sécurité Firestore.');
      }
      
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
      
      // Sauvegarder dans Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), user);
      
      console.log('Document utilisateur créé avec succès dans Firestore');
      
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
      console.log(`Tentative de récupération des données utilisateur depuis Firestore pour l'UID: ${firebaseUser.uid}`);
      
      // Récupérer les données utilisateur depuis Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        // Si le document existe, retourner les données
        console.log('Document utilisateur trouvé dans Firestore');
        return userDoc.data() as User;
      } else {
        // Si le document n'existe pas, créer un utilisateur avec les données de base
        console.log('Aucun document utilisateur trouvé dans Firestore. Création d\'un nouveau document...');
        
        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
          created: new Date().toISOString(),
        };
        
        // Sauvegarder dans Firestore pour la prochaine fois
        console.log('Tentative de sauvegarde du document utilisateur dans Firestore...');
        await setDoc(doc(db, 'users', firebaseUser.uid), user);
        console.log('Document utilisateur créé avec succès dans Firestore');
        
        return user;
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      console.error('Code d\'erreur Firebase:', error.code);
      console.error('Message d\'erreur:', error.message);
      
      // Vérifier si c'est une erreur liée aux règles de sécurité Firebase
      if (error.code === 'permission-denied') {
        console.error('Problème de permission Firebase. Vérifiez vos règles de sécurité Firestore.');
      }
      
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
