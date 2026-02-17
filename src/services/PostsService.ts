// src/services/PostsService.ts
import { supabase } from '../config/supabase';
import { getCurrentUserFromDB } from '../utils/supabaseHelpers';
import { Post, CreatePostData, Comment, CreateCommentData } from '../types/post';

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
        // S'assurer que l'avatar est une chaîne valide ou undefined
        const avatar = user?.avatar && typeof user.avatar === 'string' && user.avatar.trim() !== '' 
          ? user.avatar.trim() 
          : undefined;
        // S'assurer que l'imageUrl est une chaîne valide, n'est pas une URL locale (file://), et est une URL Supabase
        let imageUrl: string | undefined = undefined;
        if (post.image_url && typeof post.image_url === 'string') {
          const trimmedUrl = post.image_url.trim();
          // Ignorer les URLs locales (file://) et ne garder que les URLs HTTP/HTTPS valides
          if (trimmedUrl !== '' && !trimmedUrl.startsWith('file://') && (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://'))) {
            imageUrl = trimmedUrl;
          }
        }
        
        return {
          id: post.id,
          userId: post.user_id,
          userName: user?.name || 'Utilisateur inconnu',
          userAvatar: avatar,
          content: post.content,
          imageUrl: imageUrl,
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

      // S'assurer que l'avatar est une chaîne valide ou undefined
      const avatar = (user?.avatar || currentUser.avatar) && typeof (user?.avatar || currentUser.avatar) === 'string' && (user?.avatar || currentUser.avatar).trim() !== '' 
        ? (user?.avatar || currentUser.avatar).trim() 
        : undefined;
      // S'assurer que l'imageUrl est une chaîne valide, n'est pas une URL locale (file://), et est une URL Supabase
      let imageUrl: string | undefined = undefined;
      if (post.image_url && typeof post.image_url === 'string') {
        const trimmedUrl = post.image_url.trim();
        // Ignorer les URLs locales (file://) et ne garder que les URLs HTTP/HTTPS valides
        if (trimmedUrl !== '' && !trimmedUrl.startsWith('file://') && (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://'))) {
          imageUrl = trimmedUrl;
        }
      }
      
      return {
        id: post.id,
        userId: post.user_id,
        userName: user?.name || currentUser.name || 'Utilisateur inconnu',
        userAvatar: avatar,
        content: post.content,
        imageUrl: imageUrl,
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

      return (posts || []).map((post: any) => {
        // S'assurer que l'avatar est une chaîne valide ou undefined
        const avatar = user?.avatar && typeof user.avatar === 'string' && user.avatar.trim() !== '' 
          ? user.avatar.trim() 
          : undefined;
        // S'assurer que l'imageUrl est une chaîne valide, n'est pas une URL locale (file://), et est une URL Supabase
        let imageUrl: string | undefined = undefined;
        if (post.image_url && typeof post.image_url === 'string') {
          const trimmedUrl = post.image_url.trim();
          // Ignorer les URLs locales (file://) et ne garder que les URLs HTTP/HTTPS valides
          if (trimmedUrl !== '' && !trimmedUrl.startsWith('file://') && (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://'))) {
            imageUrl = trimmedUrl;
          }
        }
        
        return {
          id: post.id,
          userId: post.user_id,
          userName: user?.name || 'Utilisateur inconnu',
          userAvatar: avatar,
          content: post.content,
          imageUrl: imageUrl,
          createdAt: post.created_at,
          likesCount: post.likes_count || 0,
          commentsCount: post.comments_count || 0,
          isLiked: likedPostIds.has(post.id),
        };
      });
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

  /**
   * Récupère les commentaires d'un post
   */
  static async getPostComments(postId: string): Promise<Comment[]> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      const { data: comments, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Récupérer les informations des utilisateurs
      const userIds = [...new Set((comments || []).map((c: any) => c.user_id))];
      const { data: users } = await supabase
        .from('users')
        .select('id, name, avatar')
        .in('id', userIds);

      const usersMap = new Map((users || []).map((u: any) => [u.id, u]));

      return (comments || []).map((comment: any) => {
        const user = usersMap.get(comment.user_id);
        return {
          id: comment.id,
          postId: comment.post_id,
          userId: comment.user_id,
          userName: user?.name || 'Utilisateur inconnu',
          userAvatar: user?.avatar,
          content: comment.content,
          createdAt: comment.created_at,
        };
      });
    } catch (error: any) {
      console.error('Erreur lors de la récupération des commentaires:', error);
      throw error;
    }
  }

  /**
   * Ajoute un commentaire à un post
   */
  static async addComment(postId: string, commentData: CreateCommentData): Promise<Comment> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      if (!commentData.content.trim()) {
        throw new Error('Le contenu du commentaire est requis');
      }

      const { data: comment, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: currentUser.id,
          content: commentData.content.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Mettre à jour le compteur de commentaires
      const { data: postData } = await supabase
        .from('posts')
        .select('comments_count')
        .eq('id', postId)
        .single();
      
      if (postData) {
        await supabase
          .from('posts')
          .update({ comments_count: (postData.comments_count || 0) + 1 })
          .eq('id', postId);
      }

      return {
        id: comment.id,
        postId: comment.post_id,
        userId: comment.user_id,
        userName: currentUser.name || 'Utilisateur inconnu',
        userAvatar: currentUser.avatar,
        content: comment.content,
        createdAt: comment.created_at,
      };
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
      throw error;
    }
  }
}
