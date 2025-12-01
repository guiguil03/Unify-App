// src/services/PostsService.ts
import { supabase } from '../config/supabase';
import { getCurrentUserFromDB } from '../utils/supabaseHelpers';
import { Post, CreatePostData } from '../types/post';

export class PostsService {
  /**
   * Récupère tous les posts (feed)
   */
  static async getPosts(): Promise<Post[]> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      // Récupérer les posts
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Récupérer les likes de l'utilisateur actuel
      const { data: userLikes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', currentUser.id);

      const likedPostIds = new Set(userLikes?.map(like => like.post_id) || []);

      // Récupérer les informations des utilisateurs pour chaque post
      const userIds = [...new Set((posts || []).map((p: any) => p.user_id))];
      const { data: users } = await supabase
        .from('users')
        .select('id, name, avatar')
        .in('id', userIds);

      const usersMap = new Map((users || []).map((u: any) => [u.id, u]));

      return (posts || []).map((post: any) => {
        const user = usersMap.get(post.user_id);
        return {
          id: post.id,
          userId: post.user_id,
          userName: user?.name || 'Utilisateur inconnu',
          userAvatar: user?.avatar,
          content: post.content,
          imageUrl: post.image_url,
          createdAt: post.created_at,
          likesCount: post.likes_count || 0,
          commentsCount: post.comments_count || 0,
          isLiked: likedPostIds.has(post.id),
        };
      });
    } catch (error: any) {
      console.error('Erreur lors de la récupération des posts:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau post
   */
  static async createPost(postData: CreatePostData): Promise<Post> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      if (!postData.content.trim()) {
        throw new Error('Le contenu du post est requis');
      }

      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          user_id: currentUser.id,
          content: postData.content.trim(),
          image_url: postData.imageUrl || null,
        })
        .select('*')
        .single();

      if (error) throw error;

      // Récupérer les informations de l'utilisateur
      const { data: user } = await supabase
        .from('users')
        .select('id, name, avatar')
        .eq('id', currentUser.id)
        .single();

      return {
        id: post.id,
        userId: post.user_id,
        userName: user?.name || currentUser.name || 'Utilisateur inconnu',
        userAvatar: user?.avatar || currentUser.avatar,
        content: post.content,
        imageUrl: post.image_url,
        createdAt: post.created_at,
        likesCount: post.likes_count || 0,
        commentsCount: post.comments_count || 0,
        isLiked: false,
      };
    } catch (error: any) {
      console.error('Erreur lors de la création du post:', error);
      throw error;
    }
  }

  /**
   * Like ou unlike un post
   */
  static async toggleLike(postId: string): Promise<boolean> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      // Vérifier si l'utilisateur a déjà liké ce post
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', currentUser.id)
        .single();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUser.id);

        if (error) throw error;
        return false;
      } else {
        // Like
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: currentUser.id,
          });

        if (error) throw error;
        return true;
      }
    } catch (error: any) {
      console.error('Erreur lors du like/unlike:', error);
      throw error;
    }
  }

  /**
   * Récupère les posts d'un utilisateur spécifique
   */
  static async getUserPosts(userId: string): Promise<Post[]> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      // Récupérer les posts de l'utilisateur
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Récupérer les likes de l'utilisateur actuel
      const { data: userLikes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', currentUser.id);

      const likedPostIds = new Set(userLikes?.map(like => like.post_id) || []);

      // Récupérer les informations de l'utilisateur
      const { data: user } = await supabase
        .from('users')
        .select('id, name, avatar')
        .eq('id', userId)
        .single();

      return (posts || []).map((post: any) => ({
        id: post.id,
        userId: post.user_id,
        userName: user?.name || 'Utilisateur inconnu',
        userAvatar: user?.avatar,
        content: post.content,
        imageUrl: post.image_url,
        createdAt: post.created_at,
        likesCount: post.likes_count || 0,
        commentsCount: post.comments_count || 0,
        isLiked: likedPostIds.has(post.id),
      }));
    } catch (error: any) {
      console.error('Erreur lors de la récupération des posts utilisateur:', error);
      throw error;
    }
  }

  /**
   * Supprime un post
   */
  static async deletePost(postId: string): Promise<void> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      // Vérifier que le post appartient à l'utilisateur
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (!post || post.user_id !== currentUser.id) {
        throw new Error('Vous ne pouvez pas supprimer ce post');
      }

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Erreur lors de la suppression du post:', error);
      throw error;
    }
  }
}
