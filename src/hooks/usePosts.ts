import { useState, useEffect, useCallback } from 'react';
import { PostsService } from '../services/PostsService';
import { Post } from '../types/post';

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedPosts = await PostsService.getPosts();
      setPosts(fetchedPosts);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des posts');
      console.error('Erreur usePosts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const refreshPosts = useCallback(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleLike = useCallback((postId: string, isLiked: boolean) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              isLiked,
              likesCount: isLiked ? post.likesCount + 1 : post.likesCount - 1,
            }
          : post
      )
    );
  }, []);

  const handleDelete = useCallback((postId: string) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  }, []);

  return {
    posts,
    loading,
    error,
    refetch: refreshPosts,
    handleLike,
    handleDelete,
  };
}
