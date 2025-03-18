// src/utils/NetworkDiagnostic.ts
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { auth, db } from '../config/firebase';
import { getDocs, collection, query, limit } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

/**
 * Classe utilitaire pour diagnostiquer les problèmes réseau avec Firebase
 */
export class NetworkDiagnostic {
  /**
   * Vérifie la connectivité réseau de base
   */
  static async checkNetworkConnectivity() {
    console.group('Diagnostic Réseau');
    
    try {
      // 1. Vérifier la connectivité réseau générale
      const networkState = await NetInfo.fetch();
      console.log('1. État du réseau:');
      console.log('   - Connecté:', networkState.isConnected ? 'Oui ✅' : 'Non ❌');
      console.log('   - Type de connexion:', networkState.type);
      
      if (networkState.isConnected) {
        // 2. Tester la connexion à Firestore
        console.log('2. Test de connexion à Firestore:');
        try {
          // Essayer de récupérer un document quelconque (avec une limite de 1)
          const testQuery = query(collection(db, 'users'), limit(1));
          await getDocs(testQuery);
          console.log('   - Connexion à Firestore:', 'Réussie ✅');
        } catch (firestoreError: any) {
          console.log('   - Connexion à Firestore:', 'Échouée ❌');
          console.log('   - Code d\'erreur Firestore:', firestoreError.code);
          console.log('   - Message d\'erreur:', firestoreError.message);
          
          // Vérifier si c'est un problème d'accès réseau
          if (firestoreError.code?.includes('unavailable') || 
              firestoreError.message?.includes('network') ||
              firestoreError.message?.includes('transport')) {
            console.log('   ⚠️ PROBLÈME DE CONNEXION RÉSEAU DÉTECTÉ');
            console.log('   Vérifiez votre connexion Internet et les restrictions réseau.');
          }
          
          // Vérifier si c'est un problème de permissions
          if (firestoreError.code === 'permission-denied') {
            console.log('   ⚠️ PROBLÈME DE PERMISSIONS DÉTECTÉ');
            console.log('   Vérifiez vos règles de sécurité Firestore.');
          }
        }
        
        // 3. Tester l'auth Firebase avec une connexion anonyme
        console.log('3. Test de connexion à Firebase Auth:');
        try {
          // Obtenir une référence à l'auth
          const authInstance = getAuth();
          
          // Essayer une authentification anonyme temporaire pour tester
          await signInAnonymously(authInstance);
          console.log('   - Connexion à Firebase Auth:', 'Réussie ✅');
          
          // Se déconnecter immédiatement
          if (authInstance.currentUser) {
            await authInstance.currentUser.delete();
          }
        } catch (authError: any) {
          console.log('   - Connexion à Firebase Auth:', 'Échouée ❌');
          console.log('   - Code d\'erreur Auth:', authError.code);
          console.log('   - Message d\'erreur:', authError.message);
          
          if (authError.code?.includes('network') || 
              authError.message?.includes('network')) {
            console.log('   ⚠️ PROBLÈME DE CONNEXION RÉSEAU DÉTECTÉ');
          }
        }
        
        // 4. Vérifier la configuration du projet
        console.log('4. Configuration du projet:');
        console.log('   - API Key:', auth.app.options.apiKey ? 'Définie ✅' : 'Non définie ❌');
        console.log('   - Project ID:', auth.app.options.projectId);
        console.log('   - Auth Domain:', auth.app.options.authDomain);
        
        // 5. Environnement d'exécution
        console.log('5. Environnement:');
        console.log('   - Plateforme:', Platform.OS);
        console.log('   - Version:', Platform.Version);
      } else {
        console.log('⚠️ PAS DE CONNEXION INTERNET DÉTECTÉE');
        console.log('Veuillez vous connecter à Internet pour utiliser Firebase.');
      }
    } catch (error) {
      console.error('Erreur lors du diagnostic réseau:', error);
    }
    
    console.groupEnd();
    return 'Diagnostic réseau terminé. Vérifiez la console pour les détails.';
  }
  
  /**
   * Tente de se connecter à Firestore avec un délai de tentative plus long
   */
  static async testFirestoreWithTimeout(timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout lors de la connexion à Firestore'));
      }, timeoutMs);
      
      getDocs(query(collection(db, 'users'), limit(1)))
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }
}

// Exposer une fonction globale pour les tests rapides
// @ts-ignore
global.checkNetwork = NetworkDiagnostic.checkNetworkConnectivity;
