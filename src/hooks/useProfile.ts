// src/hooks/useProfile.ts
import { useState, useEffect } from 'react';
import { Profile } from '../types/profile';
import { ProfileService } from '../services/ProfileService';

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedProfile = await ProfileService.getProfile();
        setProfile(fetchedProfile);
      } catch (err) {
        setError('Unable to fetch profile');
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return { profile, loading, error };
};