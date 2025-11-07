// src/utils/NetworkDiagnostic.ts
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

/**
 * Classe utilitaire pour diagnostiquer les problèmes réseau
 */
export class NetworkDiagnostic {
  /**
   * Vérifie la connectivité réseau de base
   */
  static async checkNetworkConnectivity() {
    try {
      // Vérifier la connectivité réseau générale
      const networkState = await NetInfo.fetch();
      
      return {
        isConnected: networkState.isConnected || false,
        type: networkState.type,
        platform: Platform.OS,
        version: Platform.Version,
      };
    } catch (error) {
      console.error('Erreur lors du diagnostic réseau:', error);
      return {
        isConnected: false,
        type: 'unknown',
        platform: Platform.OS,
        version: Platform.Version,
      };
    }
  }
}
