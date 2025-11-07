import { useEffect, useRef } from 'react';
import { RunnersService } from '../services/RunnersService';
import { Location } from '../types/location';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeRunnersProps {
  location: Location | null;
  searchRadius: number;
  selectedLocation: Location | null;
  onRunnersUpdate: () => void;
  enabled?: boolean;
}

/**
 * Hook pour gérer la synchronisation en temps réel des coureurs
 */
export const useRealtimeRunners = ({
  location,
  searchRadius,
  selectedLocation,
  onRunnersUpdate,
  enabled = true,
}: UseRealtimeRunnersProps) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Ne pas s'abonner si pas de location ou si désactivé
    if (!location || !enabled) {
      return;
    }

    console.log('🔔 [useRealtimeRunners] Activation de la synchronisation en temps réel');
    
    // S'abonner aux changements
    channelRef.current = RunnersService.subscribeToRunners(() => {
      console.log('🔔 [useRealtimeRunners] Changement détecté, rechargement des coureurs');
      onRunnersUpdate();
    });

    // Cleanup : se désabonner quand le composant se démonte
    return () => {
      if (channelRef.current) {
        console.log('🔕 [useRealtimeRunners] Désactivation de la synchronisation en temps réel');
        RunnersService.unsubscribeFromRunners(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [location, enabled, onRunnersUpdate]);

  return {
    isSubscribed: enabled && channelRef.current !== null,
  };
};

