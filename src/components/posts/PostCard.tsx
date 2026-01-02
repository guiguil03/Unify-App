import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Post, Comment } from '../../types/post';
import { COLORS } from '../../constants/colors';
import { PostsService } from '../../services/PostsService';
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler';
import { useAuth } from '../../contexts/AuthContext';

interface PostCardProps {
  post: Post;
  onLike?: (postId: string, isLiked: boolean) => void;
  onDelete?: (postId: string) => void;
  isOwnPost?: boolean;
}

export function PostCard({ post, onLike, onDelete, isOwnPost }: PostCardProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = React.useState(post.isLiked || false);
  const [likesCount, setLikesCount] = React.useState(post.likesCount);
  const [isToggling, setIsToggling] = React.useState(false);
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [showComments, setShowComments] = React.useState(false);
  const [commentText, setCommentText] = React.useState('');
  const [isLoadingComments, setIsLoadingComments] = React.useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false);
  const [commentsCount, setCommentsCount] = React.useState(post.commentsCount);
  
  // Vérifier si c'est le post de l'utilisateur actuel
  const isUserPost = isOwnPost !== undefined ? isOwnPost : post.userId === user?.id;

  const handleLike = async () => {
    if (isToggling) return;
    
    setIsToggling(true);
    const previousLiked = isLiked;
    const previousCount = likesCount;
    
    // Optimistic update
    setIsLiked(!isLiked);
    setLikesCount(previousLiked ? likesCount - 1 : likesCount + 1);

    try {
      const newLikedState = await PostsService.toggleLike(post.id);
      setIsLiked(newLikedState);
      setLikesCount(newLikedState ? likesCount + 1 : likesCount - 1);
      if (onLike) {
        onLike(post.id, newLikedState);
      }
    } catch (error) {
      // Revert on error
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      showErrorToast('Erreur lors du like');
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    try {
      await PostsService.deletePost(post.id);
      onDelete(post.id);
    } catch (error) {
      showErrorToast('Erreur lors de la suppression');
    }
  };

  const loadComments = async () => {
    if (showComments && comments.length === 0 && !isLoadingComments) {
      setIsLoadingComments(true);
      try {
        const postComments = await PostsService.getPostComments(post.id);
        setComments(postComments);
      } catch (error) {
        showErrorToast('Erreur lors du chargement des commentaires');
      } finally {
        setIsLoadingComments(false);
      }
    }
  };

  React.useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments]);

  const handleToggleComments = () => {
    setShowComments(!showComments);
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const newComment = await PostsService.addComment(post.id, { content: commentText });
      setComments([...comments, newComment]);
      setCommentsCount(commentsCount + 1);
      setCommentText('');
      showSuccessToast('Commentaire ajouté');
    } catch (error) {
      showErrorToast('Erreur lors de l\'ajout du commentaire');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <View style={styles.container}>
      {/* Header du post */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {post.userAvatar ? (
            <Image source={{ uri: post.userAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="account" size={24} color={COLORS.textLight} />
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{post.userName}</Text>
            <Text style={styles.timestamp}>{formatDate(post.createdAt)}</Text>
          </View>
        </View>
        {isUserPost && (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <MaterialCommunityIcons name="delete-outline" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Contenu du post */}
      <Text style={styles.content}>{post.content}</Text>

      {/* Image si présente */}
      {post.imageUrl && (
        <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLike}
          disabled={isToggling}
        >
          <MaterialCommunityIcons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={24}
            color={isLiked ? COLORS.primary : COLORS.textLight}
          />
          <Text style={[styles.actionText, isLiked && styles.actionTextLiked]}>
            {likesCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleToggleComments}
        >
          <MaterialCommunityIcons 
            name={showComments ? "comment" : "comment-outline"} 
            size={24} 
            color={showComments ? COLORS.primary : COLORS.textLight} 
          />
          <Text style={[styles.actionText, showComments && styles.actionTextLiked]}>
            {commentsCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <MaterialCommunityIcons name="share-outline" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
      </View>

      {/* Section des commentaires */}
      {showComments && (
        <View style={styles.commentsSection}>
          <ScrollView style={styles.commentsList} nestedScrollEnabled>
            {isLoadingComments ? (
              <Text style={styles.commentPlaceholder}>Chargement des commentaires...</Text>
            ) : comments.length === 0 ? (
              <Text style={styles.commentPlaceholder}>Aucun commentaire</Text>
            ) : (
              comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  {comment.userAvatar ? (
                    <Image source={{ uri: comment.userAvatar }} style={styles.commentAvatar} />
                  ) : (
                    <View style={[styles.commentAvatar, styles.commentAvatarPlaceholder]}>
                      <MaterialCommunityIcons name="account" size={16} color={COLORS.textLight} />
                    </View>
                  )}
                  <View style={styles.commentContent}>
                    <Text style={styles.commentUserName}>{comment.userName}</Text>
                    <Text style={styles.commentText}>{comment.content}</Text>
                    <Text style={styles.commentTime}>{formatDate(comment.createdAt)}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Input pour ajouter un commentaire */}
          <View style={styles.commentInputContainer}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.commentInputAvatar} />
            ) : (
              <View style={[styles.commentInputAvatar, styles.commentInputAvatarPlaceholder]}>
                <MaterialCommunityIcons name="account" size={16} color={COLORS.textLight} />
              </View>
            )}
            <TextInput
              style={styles.commentInput}
              placeholder="Ajouter un commentaire..."
              placeholderTextColor={COLORS.textLight}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              editable={!isSubmittingComment}
            />
            <TouchableOpacity
              onPress={handleAddComment}
              disabled={!commentText.trim() || isSubmittingComment}
              style={[
                styles.commentSendButton,
                (!commentText.trim() || isSubmittingComment) && styles.commentSendButtonDisabled
              ]}
            >
              <MaterialCommunityIcons
                name="send"
                size={20}
                color={commentText.trim() && !isSubmittingComment ? COLORS.primary : COLORS.textLight}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  deleteButton: {
    padding: 4,
  },
  content: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  actionTextLiked: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  commentsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    maxHeight: 300,
  },
  commentsList: {
    maxHeight: 200,
    marginBottom: 12,
  },
  commentPlaceholder: {
    color: COLORS.textLight,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 12,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  commentAvatarPlaceholder: {
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentContent: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  commentInputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  commentInputAvatarPlaceholder: {
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.text,
    maxHeight: 100,
  },
  commentSendButton: {
    marginLeft: 8,
    padding: 8,
  },
  commentSendButtonDisabled: {
    opacity: 0.5,
  },
});
