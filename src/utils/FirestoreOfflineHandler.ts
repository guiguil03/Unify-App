// src/utils/FirestoreOfflineHandler.ts
import { FirestoreError } from 'firebase/firestore';
import { connectivityManager } from './ConnectivityManager';

/**
 * Utilitaire pour gérer les opérations Firestore avec une meilleure gestion du mode hors ligne
 */
export class FirestoreOfflineHandler {
  /**
   * Vérifie si une erreur Firestore est liée à un problème de connectivité
   */
  static isOfflineError(error: any): boolean {
    // Liste étendue des codes d'erreur liés à la connectivité
    const offlineErrorCodes = [
      'unavailable', 
      'failed-precondition',
      'resource-exhausted',
      'deadline-exceeded',
      'cancelled'
    ];
    
    // Liste des messages d'erreur courants liés à la connectivité
    const offlineErrorMessages = [
      'offline', 
      'network error', 
      'failed to get document because the client is offline',
      'internal error', 
      'timeout', 
      'connection'
    ];
    
    // Vérifier si l'erreur est liée à un problème de connexion
    return (
      offlineErrorCodes.includes(error.code) || 
      offlineErrorMessages.some(msg => error.message?.toLowerCase().includes(msg))
    );
  }

  /**
   * Exécute une opération Firestore avec gestion optimisée du mode hors ligne
   * @param operation La fonction Firestore à exécuter
   * @param fallback Valeur à retourner en cas d'erreur liée au mode hors ligne (optionnel)
   * @param retryCount Nombre de tentatives (défaut: 1)
   */
  static async executeWithOfflineHandling<T>(
    operation: () => Promise<T>,
    fallback?: T,
    retryCount: number = 1
  ): Promise<T> {
    try {
      // Vérifier la connexion avant d'essayer
      const connectivityStatus = connectivityManager.getStatus();
      
      // Si on sait qu'on est hors ligne et qu'un fallback est fourni, retourner directement le fallback
      if (!connectivityStatus.isConnected && fallback !== undefined) {
        console.log('📱 Mode hors ligne détecté, utilisation des données de secours');
        return fallback;
      }
      
      // Tenter l'opération
      return await operation();
    } catch (error: any) {
      console.warn('⚠️ Erreur lors de l\'opération Firestore:', error.code || error.message);
      
      // Si c'est une erreur de connectivité
      if (this.isOfflineError(error)) {
        console.log('📡 Erreur de connectivité détectée lors de l\'accès à Firestore');
        
        // Tenter une reconnexion en arrière-plan
        connectivityManager.forceReconnect();
        
        // Si un fallback est fourni, le retourner
        if (fallback !== undefined) {
          console.log('📱 Utilisation des données de secours en mode hors ligne');
          return fallback;
        }
        
        // Sinon, si on a encore des tentatives, attendre et réessayer
        if (retryCount > 0) {
          console.log(`🔄 Nouvelle tentative (${retryCount} restante(s))...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1s
          return this.executeWithOfflineHandling(operation, fallback, retryCount - 1);
        }
      }
      
      // Si ce n'est pas une erreur de connectivité ou si on a épuisé les tentatives, propager l'erreur
      throw error;
    }
  }

  /**
   * Crée un message d'erreur plus convivial pour les erreurs Firestore
   */
  static getErrorMessage(error: FirestoreError): string {
    if (this.isOfflineError(error)) {
      return "Impossible d'accéder aux données. Vérifiez votre connexion Internet et réessayez.";
    }
    
    // Messages personnalisés pour les erreurs Firestore courantes
    switch(error.code) {
      case 'permission-denied':
        return "Vous n'avez pas les permissions nécessaires pour accéder à ces données.";
      case 'not-found':
        return "Les données demandées n'existent pas.";
      case 'already-exists':
        return "Ces données existent déjà.";
      default:
        return error.message;
    }
  }
}
