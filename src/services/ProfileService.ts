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
        level: user.level,
        goal: user.goal,
        preferredTime: user.preferred_time,
        preferredTerrain: user.preferred_terrain,
        groupPreference: user.group_preference,
        gender: user.gender,
        birthDate: user.birth_date,
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
    gender?: 'male' | 'female' | 'other';
    birthDate?: string;
    traits?: string;
  }): Promise<Profile> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Ajouter les champs seulement s'ils sont définis (même si vides, on les met à jour)
      if (profileData.name !== undefined) {
        updateData.name = profileData.name;
      }
      if (profileData.avatar !== undefined) {
        updateData.avatar = profileData.avatar || null;
      }
      if (profileData.bio !== undefined) {
        updateData.bio = profileData.bio || null;
      }
      if (profileData.level !== undefined) {
        updateData.level = profileData.level || null;
      }
      if (profileData.goal !== undefined) {
        updateData.goal = profileData.goal || null;
      }
      if (profileData.preferredTime !== undefined) {
        updateData.preferred_time = profileData.preferredTime || null;
      }
      if (profileData.preferredTerrain !== undefined) {
        updateData.preferred_terrain = profileData.preferredTerrain || null;
      }
      if (profileData.groupPreference !== undefined) {
        updateData.group_preference = profileData.groupPreference || null;
      }
      if (profileData.gender !== undefined) {
        updateData.gender = profileData.gender || null;
      }
      if (profileData.birthDate !== undefined) {
        updateData.birth_date = profileData.birthDate || null;
      }
      // Stocker les traits dans bio si pas déjà défini, sinon les ajouter
      if (profileData.traits !== undefined) {
        const traitsText = `Traits: ${profileData.traits}`;
        updateData.bio = profileData.bio ? `${profileData.bio}\n${traitsText}` : traitsText;
      }

      console.log('📤 Mise à jour du profil avec les données:', updateData);
      console.log('👤 ID utilisateur:', currentUser.id);

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', currentUser.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur Supabase lors de la mise à jour:', error);
        throw error;
      }

      if (!data) {
        console.error('❌ Aucune donnée retournée après la mise à jour');
        throw new Error('Aucune donnée retournée après la mise à jour');
      }

      console.log('✅ Profil mis à jour avec succès:', data);

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