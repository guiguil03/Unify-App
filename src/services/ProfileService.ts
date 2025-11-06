// src/services/ProfileService.ts
import { Profile } from '../types/profile';
import { supabase } from '../config/supabase';
import { getCurrentUserFromDB } from '../utils/supabaseHelpers';

export class ProfileService {
  /**
   * Récupère le profil de l'utilisateur actuel avec ses statistiques
   */
  static async getProfile(): Promise<Profile> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      // Récupérer les statistiques depuis la table users
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (userError || !user) {
        throw new Error('Profil non trouvé');
      }

      return {
        id: user.id,
        name: user.name,
        avatar: user.avatar || '',
        bio: user.bio || '',
        stats: {
          totalDistance: Number(user.total_distance || 0),
          totalTime: user.total_time || '0 min',
          sessions: user.sessions || 0,
          averagePace: user.average_pace || '0:00 min/km',
        },
      };
    } catch (error: any) {
      // Ne pas logger les erreurs d'authentification
      if (!error?.message?.includes('Utilisateur non authentifié')) {
        console.error('Erreur dans getProfile:', error);
      }
      throw error;
    }
  }

  /**
   * Met à jour le profil de l'utilisateur
   */
  static async updateProfile(profileData: {
    name?: string;
    avatar?: string;
    bio?: string;
    level?: string;
    goal?: string;
    preferredTime?: string;
    preferredTerrain?: string;
    groupPreference?: string;
  }): Promise<Profile> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Ajouter les champs seulement s'ils sont définis
      if (profileData.name !== undefined) updateData.name = profileData.name;
      if (profileData.avatar !== undefined) updateData.avatar = profileData.avatar;
      if (profileData.bio !== undefined) updateData.bio = profileData.bio;
      if (profileData.level !== undefined) updateData.level = profileData.level;
      if (profileData.goal !== undefined) updateData.goal = profileData.goal;
      if (profileData.preferredTime !== undefined) updateData.preferred_time = profileData.preferredTime;
      if (profileData.preferredTerrain !== undefined) updateData.preferred_terrain = profileData.preferredTerrain;
      if (profileData.groupPreference !== undefined) updateData.group_preference = profileData.groupPreference;

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', currentUser.id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        avatar: data.avatar || '',
        bio: data.bio || '',
        level: data.level,
        goal: data.goal,
        preferredTime: data.preferred_time,
        preferredTerrain: data.preferred_terrain,
        groupPreference: data.group_preference,
        memberSince: data.member_since || data.created_at,
        stats: {
          totalDistance: Number(data.total_distance || 0),
          totalTime: data.total_time || '0 min',
          sessions: data.sessions || 0,
          averagePace: data.average_pace || '0:00 min/km',
        },
      };
    } catch (error) {
      console.error('Erreur dans updateProfile:', error);
      throw error;
    }
  }

  /**
   * Récupère le profil d'un autre utilisateur (public)
   */
  static async getProfileById(userId: string): Promise<Profile> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !user) {
        throw new Error('Profil non trouvé');
      }

      return {
        id: user.id,
        name: user.name,
        avatar: user.avatar || '',
        bio: user.bio || '',
        level: user.level,
        goal: user.goal,
        preferredTime: user.preferred_time,
        preferredTerrain: user.preferred_terrain,
        groupPreference: user.group_preference,
        memberSince: user.member_since || user.created_at,
        stats: {
          totalDistance: Number(user.total_distance || 0),
          totalTime: user.total_time || '0 min',
          sessions: user.sessions || 0,
          averagePace: user.average_pace || '0:00 min/km',
        },
      };
    } catch (error) {
      console.error('Erreur dans getProfileById:', error);
      throw error;
    }
  }
}