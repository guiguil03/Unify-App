// src/hooks/useFirestoreWithOffline.ts
import { useState, useEffect, useCallback } from 'react';
import { FirestoreError } from 'firebase/firestore';
import { FirestoreOfflineHandler } from '../utils/FirestoreOfflineHandler';
import { connectivityManager } from '../utils/ConnectivityManager';

/**
 * Hook pour gérer les opérations Firestore avec une gestion optimisée du mode hors ligne
 */
export function useFirestoreWithOffline<T>(
  fetchFn: () => Promise<T>,
  initialValue: T,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  // Fonction pour exécuter l'opération Firestore de manière sécurisée
  const executeFetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Utiliser FirestoreOfflineHandler pour gérer les erreurs de connectivité
      const result = await FirestoreOfflineHandler.executeWithOfflineHandling(
        fetchFn,
        isOffline ? data : undefined, // Utiliser les données actuelles comme fallback en mode hors ligne
        2 // Nombre de tentatives
      );

      setData(result);
      setIsOffline(false);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des données Firestore:', err);
      
      // Vérifier si c'est une erreur de connectivité
      if (FirestoreOfflineHandler.isOfflineError(err)) {
        setIsOffline(true);
        // Ne pas définir d'erreur pour les problèmes de connectivité si nous avons déjà des données
        if (!data || data === initialValue) {
          setError(new Error(FirestoreOfflineHandler.getErrorMessage(err as FirestoreError)));
        }
      } else {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFn, data, isOffline, ...dependencies]);

  // Surveiller les changements de connectivité
  useEffect(() => {
    const unsubscribe = connectivityManager.addConnectionListener((status) => {
      // Si nous venons de récupérer la connexion et que nous étions hors ligne, refaire la requête
      if (status.isConnected && isOffline) {
        executeFetch();
      }
      
      // Mettre à jour l'état hors ligne
      setIsOffline(!status.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, [executeFetch, isOffline]);

  // Exécuter la requête initiale et lorsque les dépendances changent
  useEffect(() => {
    executeFetch();
  }, [executeFetch]);

  // Fonction pour forcer un rechargement
  const refresh = useCallback(() => {
    return executeFetch();
  }, [executeFetch]);

  return { data, loading, error, isOffline, refresh };
}

export default useFirestoreWithOffline;
