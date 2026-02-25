import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Post, Comment } from '../../types/post';
import { COLORS } from '../../constants/colors';
import { PostsService } from '../../services/PostsService';
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler';
import { useAuth } from '../../contexts/AuthContext';
import { NavigationProp } from '../../types/navigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PostCardProps {
  post: Post;
  onLike?: (postId: string, isLiked: boolean) => void;
  onDelete?: (postId: string) => void;
  isOwnPost?: boolean;
}

export const PostCard = React.memo(function PostCard({ post, onLike, onDelete, isOwnPost }: PostCardProps) {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [isLiked, setIsLiked] = React.useState(post.isLiked || false);
  const [likesCount, setLikesCount] = React.useState(post.likesCount);
  const [isToggling, setIsToggling] = React.useState(false);
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [showComments, setShowComments] = React.useState(false);
  const [commentText, setCommentText] = React.useState('');
  const [isLoadingComments, setIsLoadingComments] = React.useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false);
  const [commentsCount, setCommentsCount] = React.useState(post.commentsCount);
  const [captionExpanded, setCaptionExpanded] = React.useState(false);

  const heartScale = React.useRef(new Animated.Value(1)).current;
  const isUserPost = isOwnPost !== undefined ? isOwnPost : post.userId === user?.id;

  const animateHeart = () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.5, useNativeDriver: true, tension: 200, friction: 4 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 6 }),
    ]).start();
  };

  const handleLike = async () => {
    if (isToggling) return;
    setIsToggling(true);
    const previousLiked = isLiked;
    const previousCount = likesCount;

    setIsLiked(!isLiked);
    setLikesCount(previousLiked ? likesCount - 1 : likesCount + 1);
    if (!isLiked) animateHeart();

    try {
      const newLikedState = await PostsService.toggleLike(post.id);
      setIsLiked(newLikedState);
      setLikesCount(newLikedState ? previousCount + 1 : previousCount - 1);
      if (onLike) onLike(post.id, newLikedState);
    } catch {
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
    } catch {
      showErrorToast('Erreur lors de la suppression');
    }
  };

  React.useEffect(() => {
    if (showComments && comments.length === 0 && !isLoadingComments) {
      setIsLoadingComments(true);
      PostsService.getPostComments(post.id)
        .then(setComments)
        .catch(() => showErrorToast('Erreur chargement commentaires'))
        .finally(() => setIsLoadingComments(false));
    }
  }, [showComments]);

  const handleAddComment = async () => {
    if (!commentText.trim() || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      const newComment = await PostsService.addComment(post.id, { content: commentText });
      setComments([...comments, newComment]);
      setCommentsCount(commentsCount + 1);
      setCommentText('');
    } catch {
      showErrorToast("Erreur lors de l'ajout du commentaire");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 1) return "À l'instant";
    if (m < 60) return `Il y a ${m} min`;
    if (h < 24) return `Il y a ${h}h`;
    if (d < 7) return `Il y a ${d}j`;
    return new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userRow}
          onPress={() => {
            if (post.userId === user?.id) navigation.navigate('Profile');
            else if (post.userId) navigation.navigate('UserProfile', { userId: post.userId });
          }}
          activeOpacity={0.7}
        >
          {post.userAvatar?.trim() ? (
            <Image source={{ uri: post.userAvatar }} style={styles.avatar} onError={() => {}} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="account" size={20} color={COLORS.textLight} />
            </View>
          )}
          <View>
            <Text style={styles.userName}>{post.userName}</Text>
          </View>
        </TouchableOpacity>

        {isUserPost ? (
          <TouchableOpacity onPress={handleDelete} hitSlop={8}>
            <MaterialCommunityIcons name="delete-outline" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity hitSlop={8}>
            <MaterialCommunityIcons name="dots-horizontal" size={22} color="#1a1a1a" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Image ── */}
      {post.imageUrl?.trim() && !post.imageUrl.startsWith('file://') && (
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.image}
          resizeMode="cover"
          onError={() => {}}
        />
      )}

      {/* ── Actions ── */}
      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity onPress={handleLike} disabled={isToggling} style={styles.actionBtn} activeOpacity={0.7}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <MaterialCommunityIcons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={28}
                color={isLiked ? '#ED4956' : '#1a1a1a'}
              />
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowComments(!showComments)} style={styles.actionBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="comment-outline" size={26} color="#1a1a1a" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="send-outline" size={26} color="#1a1a1a" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity activeOpacity={0.7}>
          <MaterialCommunityIcons name="bookmark-outline" size={26} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      {/* ── Likes ── */}
      {likesCount > 0 && (
        <Text style={styles.likesCount}>{likesCount.toLocaleString('fr-FR')} j'aime</Text>
      )}

      {/* ── Caption ── */}
      {post.content ? (
        <View style={styles.captionRow}>
          <Text style={styles.caption} numberOfLines={captionExpanded ? undefined : 2}>
            <Text style={styles.captionUser}>{post.userName} </Text>
            {post.content}
          </Text>
          {post.content.length > 100 && !captionExpanded && (
            <TouchableOpacity onPress={() => setCaptionExpanded(true)}>
              <Text style={styles.moreText}>plus</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      {/* ── Voir commentaires ── */}
      {commentsCount > 0 && (
        <TouchableOpacity onPress={() => setShowComments(!showComments)} style={styles.commentsLink}>
          <Text style={styles.commentsLinkText}>
            Voir les {commentsCount} commentaire{commentsCount > 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      )}

      {/* ── Section commentaires ── */}
      {showComments && (
        <View style={styles.commentsSection}>
          {isLoadingComments ? (
            <Text style={styles.commentMeta}>Chargement…</Text>
          ) : comments.length === 0 ? (
            <Text style={styles.commentMeta}>Aucun commentaire</Text>
          ) : (
            <ScrollView style={styles.commentsList} nestedScrollEnabled>
              {comments.map((c) => (
                <View key={c.id} style={styles.commentItem}>
                  {c.userAvatar?.trim() ? (
                    <Image source={{ uri: c.userAvatar }} style={styles.commentAvatar} onError={() => {}} />
                  ) : (
                    <View style={[styles.commentAvatar, styles.commentAvatarPlaceholder]}>
                      <MaterialCommunityIcons name="account" size={13} color={COLORS.textLight} />
                    </View>
                  )}
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentText}>
                      <Text style={styles.commentUser}>{c.userName} </Text>
                      {c.content}
                    </Text>
                    <Text style={styles.commentMeta}>{formatDate(c.createdAt)}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.commentInput}>
            {user?.avatar?.trim() ? (
              <Image source={{ uri: user.avatar }} style={styles.commentAvatar} />
            ) : (
              <View style={[styles.commentAvatar, styles.commentAvatarPlaceholder]}>
                <MaterialCommunityIcons name="account" size={13} color={COLORS.textLight} />
              </View>
            )}
            <TextInput
              style={styles.commentField}
              placeholder="Ajouter un commentaire…"
              placeholderTextColor={COLORS.textLight}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              editable={!isSubmittingComment}
            />
            {commentText.trim() ? (
              <TouchableOpacity onPress={handleAddComment} disabled={isSubmittingComment}>
                <Text style={styles.postBtn}>Publier</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      )}

      {/* ── Timestamp ── */}
      <Text style={styles.timestamp}>{formatDate(post.createdAt)}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginBottom: 10,
    borderRadius: 12,
    shadowColor: '#7D80F4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
  },
  avatarPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  // Image
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    padding: 4,
  },

  // Likes & caption
  likesCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  captionRow: {
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  caption: {
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  captionUser: {
    fontWeight: '700',
  },
  moreText: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },

  // Comments link
  commentsLink: {
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  commentsLinkText: {
    fontSize: 14,
    color: COLORS.textLight,
  },

  // Comments section
  commentsSection: {
    paddingHorizontal: 14,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EBEBEB',
    marginTop: 4,
  },
  commentsList: {
    maxHeight: 180,
    marginVertical: 8,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 8,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    flexShrink: 0,
  },
  commentAvatarPlaceholder: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentBubble: {
    flex: 1,
  },
  commentText: {
    fontSize: 13,
    color: '#1a1a1a',
    lineHeight: 18,
  },
  commentUser: {
    fontWeight: '700',
  },
  commentMeta: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EBEBEB',
  },
  commentField: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
    paddingVertical: 4,
    maxHeight: 80,
  },
  postBtn: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Timestamp
  timestamp: {
    fontSize: 11,
    color: COLORS.textLight,
    paddingHorizontal: 14,
    paddingBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
