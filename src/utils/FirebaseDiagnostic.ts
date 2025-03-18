// src/utils/FirebaseDiagnostic.ts
import { auth, db } from '../config/firebase';
import { getAuth, fetchSignInMethodsForEmail } from 'firebase/auth';
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';

/**
 * Classe utilitaire pour diagnostiquer les problèmes Firebase
 */
export class FirebaseDiagnostic {
  /**
   * Vérifie l'état global de Firebase
   */
  static async checkFirebaseStatus() {
    console.group('Diagnostic Firebase');
    
    // Vérifier l'initialisation Firebase Auth
    console.log('1. Firebase Auth:', auth ? 'Initialisé ✅' : 'Non initialisé ❌');
    if (auth) {
      console.log('   - API Key:', auth.app.options.apiKey ? 'Configuré ✅' : 'Non configuré ❌');
      console.log('   - Project ID:', auth.app.options.projectId);
      console.log('   - Auth Domain:', auth.app.options.authDomain);
    }
    
    // Vérifier l'état d'authentification actuel
    console.log('2. État d\'authentification:');
    console.log('   - Utilisateur connecté:', auth.currentUser ? 'Oui ✅' : 'Non ❌');
    if (auth.currentUser) {
      console.log('   - UID:', auth.currentUser.uid);
      console.log('   - Email:', auth.currentUser.email);
      console.log('   - Email vérifié:', auth.currentUser.emailVerified ? 'Oui ✅' : 'Non ❌');
    }
    
    // Vérifier Firestore
    console.log('3. Firestore:');
    console.log('   - Initialisé:', db ? 'Oui ✅' : 'Non ❌');
    
    if (db) {
      try {
        // Tenter de lire la collection users
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        console.log('   - Nombre d\'utilisateurs dans Firestore:', querySnapshot.size);
        console.log('   - Accès à Firestore:', 'Réussi ✅');
      } catch (error: any) {
        console.log('   - Accès à Firestore:', 'Échoué ❌');
        console.log('   - Erreur Firestore:', error.code, error.message);
        
        if (error.code === 'permission-denied') {
          console.log('   - Problème de règles de sécurité détecté. Vérifiez vos règles Firestore.');
        }
      }
    }
    
    console.groupEnd();
    return 'Diagnostic terminé. Vérifiez la console pour les détails.';
  }
  
  /**
   * Vérifie si un email est déjà enregistré
   */
  static async checkEmailExists(email: string) {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      return methods.length > 0;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'email:', error);
      return false;
    }
  }
  
  /**
   * Vérifie si un utilisateur existe dans Firestore
   */
  static async checkUserInFirestore(uid: string) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      return {
        exists: userDoc.exists(),
        data: userDoc.data()
      };
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'utilisateur dans Firestore:', error);
      return {
        exists: false,
        error
      };
    }
  }
}

// Exposer une fonction globale pour les tests rapides dans la console
// @ts-ignore
global.diagnoseFirebase = FirebaseDiagnostic.checkFirebaseStatus;
