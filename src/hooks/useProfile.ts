// src/hooks/useProfile.ts
import { useState, useEffect, useCallback } from 'react';
import { Profile } from '../types/profile';
import { ProfileService } from '../services/ProfileService';
import { useAuth } from '../contexts/AuthContext';

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchProfile = useCallback(async () => {
    // Si l'utilisateur n'est pas authentifié, retourner null
    if (!user) {
      setLoading(false);
      setProfile(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const fetchedProfile = await ProfileService.getProfile();
      setProfile(fetchedProfile);
    } catch (err: any) {
      // Gérer silencieusement les erreurs d'authentification
      if (err?.message?.includes('Utilisateur non authentifié')) {
        setProfile(null);
        setError(null);
      } else {
        setError('Unable to fetch profile');
        if (!err?.message?.includes('Utilisateur non authentifié')) {
          console.error('Error fetching profile:', err);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
};