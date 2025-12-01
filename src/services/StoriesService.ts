// src/services/StoriesService.ts
import { supabase } from '../config/supabase';
import { getCurrentUserFromDB } from '../utils/supabaseHelpers';

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  imageUrl?: string;
  videoUrl?: string;
  caption?: string;
  createdAt: string;
  expiresAt: string;
  viewCount: number;
  hasViewed?: boolean;
}

export class StoriesService {
  private static async getFriendIds(userId: string): Promise<string[]> {
    const friendIds = new Set<string>();

    const [sentResult, receivedResult] = await Promise.all([
      supabase
        .from('contacts')
        .select('contact_id')
        .eq('user_id', userId)
        .eq('status', 'accepted'),
      supabase
        .from('contacts')
        .select('user_id')
        .eq('contact_id', userId)
        .eq('status', 'accepted'),
    ]);

    if (sentResult.error) {
      throw sentResult.error;
    }

    if (receivedResult.error) {
      throw receivedResult.error;
    }

    sentResult.data?.forEach((relation: any) => {
      if (relation?.contact_id) {
        friendIds.add(relation.contact_id);
      }
    });

    receivedResult.data?.forEach((relation: any) => {
      if (relation?.user_id) {
        friendIds.add(relation.user_id);
      }
    });

    return Array.from(friendIds);
  }

  /**
   * Récupère toutes les stories actives (non expirées)
   */
  static async getActiveStories(): Promise<Story[]> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      const friendIds = await this.getFriendIds(currentUser.id);
      const allowedUserIds = [currentUser.id, ...friendIds];

      if (allowedUserIds.length === 0) {
        return [];
      }

      // Récupérer les stories non expirées des amis (ou de soi) avec les infos utilisateur
      const { data, error } = await supabase
        .from('stories')
        .select(`
          id,
          user_id,
          image_url,
          video_url,
          caption,
          view_count,
          created_at,
          expires_at,
          users:user_id (
            id,
            name,
            avatar
          )
        `)
        .in('user_id', allowedUserIds)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Vérifier si l'utilisateur actuel a vu chaque story
      const storyIds = data?.map((s: any) => s.id) || [];
      const { data: views } = await supabase
        .from('story_views')
        .select('story_id')
        .in('story_id', storyIds)
        .eq('viewer_id', currentUser.id);

      const viewedStoryIds = new Set(views?.map((v: any) => v.story_id) || []);

      // Formater les données
      const stories: Story[] = data?.map((story: any) => ({
        id: story.id,
        userId: story.user_id,
        userName: story.users?.name || 'Utilisateur',
        userAvatar: story.users?.avatar,
        imageUrl: story.image_url,
        videoUrl: story.video_url,
        caption: story.caption,
        createdAt: story.created_at,
        expiresAt: story.expires_at,
        viewCount: story.view_count || 0,
        hasViewed: viewedStoryIds.has(story.id),
      })) || [];

      return stories;
    } catch (error) {
      console.error('Erreur dans getActiveStories:', error);
      throw error;
    }
  }

  /**
   * Récupère les stories d'un utilisateur spécifique
   */
  static async getUserStories(userId: string): Promise<Story[]> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      if (userId !== currentUser.id) {
        const friendIds = await this.getFriendIds(currentUser.id);
        if (!friendIds.includes(userId)) {
          return [];
        }
      }

      const { data, error } = await supabase
        .from('stories')
        .select(`
          id,
          user_id,
          image_url,
          video_url,
          caption,
          view_count,
          created_at,
          expires_at,
          users:user_id (
            id,
            name,
            avatar
          )
        `)
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Vérifier les vues
      const storyIds = data?.map((s: any) => s.id) || [];
      const { data: views } = await supabase
        .from('story_views')
        .select('story_id')
        .in('story_id', storyIds)
        .eq('viewer_id', currentUser.id);

      const viewedStoryIds = new Set(views?.map((v: any) => v.story_id) || []);

      return data?.map((story: any) => ({
        id: story.id,
        userId: story.user_id,
        userName: story.users?.name || 'Utilisateur',
        userAvatar: story.users?.avatar,
        imageUrl: story.image_url,
        videoUrl: story.video_url,
        caption: story.caption,
        createdAt: story.created_at,
        expiresAt: story.expires_at,
        viewCount: story.view_count || 0,
        hasViewed: viewedStoryIds.has(story.id),
      })) || [];
    } catch (error) {
      console.error('Erreur dans getUserStories:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle story
   */
  static async createStory(data: {
    imageUrl?: string;
    videoUrl?: string;
    caption?: string;
  }): Promise<Story> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      if (!data.imageUrl && !data.videoUrl) {
        throw new Error('Une story doit contenir une image ou une vidéo');
      }

      const { data: story, error } = await supabase
        .from('stories')
        .insert({
          user_id: currentUser.id,
          image_url: data.imageUrl,
          video_url: data.videoUrl,
          caption: data.caption,
          created_at: new Date().toISOString(),
          // Les stories expirent après 24 heures
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .select(`
          id,
          user_id,
          image_url,
          video_url,
          caption,
          view_count,
          created_at,
          expires_at
        `)
        .single();

      if (error) throw error;

      return {
        id: story.id,
        userId: story.user_id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        imageUrl: story.image_url,
        videoUrl: story.video_url,
        caption: story.caption,
        createdAt: story.created_at,
        expiresAt: story.expires_at,
        viewCount: 0,
        hasViewed: false,
      };
    } catch (error) {
      console.error('Erreur dans createStory:', error);
      throw error;
    }
  }

  /**
   * Marque une story comme vue
   */
  static async markStoryAsViewed(storyId: string): Promise<void> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) return;

      // Insérer une vue (la fonction trigger incrementera automatiquement le compteur)
      const { error } = await supabase
        .from('story_views')
        .insert({
          story_id: storyId,
          viewer_id: currentUser.id,
          viewed_at: new Date().toISOString(),
        });

      // Ignorer l'erreur si la vue existe déjà
      if (error && !error.message.includes('duplicate')) {
        throw error;
      }
    } catch (error) {
      console.error('Erreur dans markStoryAsViewed:', error);
      // Ne pas bloquer si la vue échoue
    }
  }

  /**
   * Supprime une story
   */
  static async deleteStory(storyId: string): Promise<void> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)
        .eq('user_id', currentUser.id);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur dans deleteStory:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les stories d'un utilisateur (y compris expirées) pour l'historique
   */
  static async getUserStoriesHistory(userId: string): Promise<Story[]> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      // Si ce n'est pas l'utilisateur actuel, vérifier qu'ils sont amis
      if (userId !== currentUser.id) {
        const friendIds = await this.getFriendIds(currentUser.id);
        if (!friendIds.includes(userId)) {
          return [];
        }
      }

      // Récupérer toutes les stories (y compris expirées)
      const { data, error } = await supabase
        .from('stories')
        .select(`
          id,
          user_id,
          image_url,
          video_url,
          caption,
          view_count,
          created_at,
          expires_at,
          users:user_id (
            id,
            name,
            avatar
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Vérifier les vues
      const storyIds = data?.map((s: any) => s.id) || [];
      const { data: views } = await supabase
        .from('story_views')
        .select('story_id')
        .in('story_id', storyIds)
        .eq('viewer_id', currentUser.id);

      const viewedStoryIds = new Set(views?.map((v: any) => v.story_id) || []);

      return data?.map((story: any) => ({
        id: story.id,
        userId: story.user_id,
        userName: story.users?.name || 'Utilisateur',
        userAvatar: story.users?.avatar,
        imageUrl: story.image_url,
        videoUrl: story.video_url,
        caption: story.caption,
        createdAt: story.created_at,
        expiresAt: story.expires_at,
        viewCount: story.view_count || 0,
        hasViewed: viewedStoryIds.has(story.id),
      })) || [];
    } catch (error) {
      console.error('Erreur dans getUserStoriesHistory:', error);
      throw error;
    }
  }

  /**
   * Récupère les viewers d'une story
   */
  static async getStoryViewers(storyId: string): Promise<Array<{
    id: string;
    name: string;
    avatar?: string;
    viewedAt: string;
  }>> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      const { data, error } = await supabase
        .from('story_views')
        .select(`
          viewer_id,
          viewed_at,
          users:viewer_id (
            id,
            name,
            avatar
          )
        `)
        .eq('story_id', storyId)
        .order('viewed_at', { ascending: false });

      if (error) throw error;

      return data?.map((view: any) => ({
        id: view.users?.id || view.viewer_id,
        name: view.users?.name || 'Utilisateur',
        avatar: view.users?.avatar,
        viewedAt: view.viewed_at,
      })) || [];
    } catch (error) {
      console.error('Erreur dans getStoryViewers:', error);
      throw error;
    }
  }
}

