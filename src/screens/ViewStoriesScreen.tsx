import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StoriesService, Story } from '../services/StoriesService';
import { MessagesService } from '../services/MessagesService';
import { RootStackParamList } from '../types/navigation';
import { showSuccessToast, showErrorToast } from '../utils/errorHandler';
import { COLORS } from '../constants/colors';

type ViewStoriesRouteProp = RouteProp<RootStackParamList, 'ViewStories'>;

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 secondes par story

export default function ViewStoriesScreen() {
  const navigation = useNavigation();
  const route = useRoute<ViewStoriesRouteProp>();
  const { userId } = route.params;

  const [stories, setStories] = useState<Story[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [showReactionModal, setShowReactionModal] = useState(false);
  const [reactionText, setReactionText] = useState('');
  const [isSendingReaction, setIsSendingReaction] = useState(false);

  const progressAnims = useRef<Animated.Value[]>([]);
  const progressTimers = useRef<NodeJS.Timeout[]>([]);

  // Charger les stories de l'utilisateur
  useEffect(() => {
    loadStories();
  }, [userId]);

  const loadStories = async () => {
    try {
      setLoading(true);
      const userStories = await StoriesService.getUserStories(userId);
      setStories(userStories);
      
      // Initialiser les animations de progression
      progressAnims.current = userStories.map(() => new Animated.Value(0));
    } catch (error) {
      if (__DEV__) console.error('Story loading failed:', error);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Gérer la progression automatique
  useEffect(() => {
    if (stories.length === 0 || paused || loading || !progressAnims.current[currentIndex]) return;

    // Marquer la story comme vue
    StoriesService.markStoryAsViewed(stories[currentIndex].id);

    // Animer la barre de progression
    Animated.timing(progressAnims.current[currentIndex], {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        handleNext();
      }
    });

    return () => {
      if (progressAnims.current[currentIndex]) {
        progressAnims.current[currentIndex].stopAnimation();
      }
    };
  }, [currentIndex, paused, stories.length, loading]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      if (progressAnims.current[currentIndex]) {
        progressAnims.current[currentIndex].setValue(1); // Compléter la barre actuelle
      }
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.goBack();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      if (progressAnims.current[currentIndex]) {
        progressAnims.current[currentIndex].setValue(0); // Réinitialiser la barre actuelle
      }
      setCurrentIndex(currentIndex - 1);
      if (progressAnims.current[currentIndex - 1]) {
        progressAnims.current[currentIndex - 1].setValue(0); // Réinitialiser la barre précédente
      }
    }
  };

  const handlePressLeft = () => {
    handlePrevious();
  };

  const handlePressRight = () => {
    handleNext();
  };

  const handleLongPressIn = () => {
    setPaused(true);
    if (progressAnims.current[currentIndex]) {
      progressAnims.current[currentIndex].stopAnimation();
    }
  };

  const handleLongPressOut = () => {
    setPaused(false);
  };

  const handleReaction = () => {
    setShowReactionModal(true);
    setPaused(true);
  };

  const handleSendReaction = async () => {
    if (!reactionText.trim() || isSendingReaction) return;

    const currentStory = stories[currentIndex];
    if (!currentStory) return;

    setIsSendingReaction(true);
    try {
      await MessagesService.sendMessage(
        currentStory.userId,
        `Réaction à votre story: ${reactionText.trim()}`
      );
      showSuccessToast('Réaction envoyée !');
      setShowReactionModal(false);
      setReactionText('');
      setPaused(false);
    } catch (error) {
      showErrorToast('Erreur lors de l\'envoi de la réaction');
      setPaused(false);
    } finally {
      setIsSendingReaction(false);
    }
  };

  const handleCloseReactionModal = () => {
    setShowReactionModal(false);
    setReactionText('');
    setPaused(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (stories.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Aucune story disponible</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStory = stories[currentIndex];

  return (
    <View style={styles.container}>
      {/* Image de fond */}
      <Image
        source={{ uri: currentStory.imageUrl || currentStory.videoUrl }}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Overlay sombre */}
      <View style={styles.overlay} />

      {/* Barres de progression */}
      <View style={styles.progressContainer}>
        {stories.map((_, index) => (
          <View key={index} style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: progressAnims.current[index] ? progressAnims.current[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }) : '0%',
                    backgroundColor: index < currentIndex ? '#fff' : '#fff',
                    opacity: index < currentIndex ? 1 : index === currentIndex ? 1 : 0.5,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>

      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {currentStory.userAvatar ? (
            <Image source={{ uri: currentStory.userAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <MaterialCommunityIcons name="account" size={20} color="#999" />
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{currentStory.userName}</Text>
            <Text style={styles.timestamp}>
              {getTimeAgo(currentStory.createdAt)}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Légende */}
      {currentStory.caption && (
        <View style={styles.captionContainer}>
          <Text style={styles.caption}>{currentStory.caption}</Text>
        </View>
      )}

      {/* Zones de tap */}
      <View style={styles.tapContainer}>
        <TouchableOpacity
          style={styles.tapLeft}
          onPress={handlePressLeft}
          onLongPress={handleLongPressIn}
          onPressOut={handleLongPressOut}
          activeOpacity={1}
        />
        <TouchableOpacity
          style={styles.tapRight}
          onPress={handlePressRight}
          onLongPress={handleLongPressIn}
          onPressOut={handleLongPressOut}
          activeOpacity={1}
        />
      </View>

      {/* Compteur de vues */}
      <View style={styles.viewsContainer}>
        <MaterialCommunityIcons name="eye" size={16} color="#fff" />
        <Text style={styles.viewsText}>{currentStory.viewCount} vues</Text>
      </View>

      {/* Bouton de réaction */}
      <TouchableOpacity style={styles.reactionButton} onPress={handleReaction}>
        <MaterialCommunityIcons name="message-outline" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Modal de réaction */}
      <Modal
        visible={showReactionModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseReactionModal}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Réagir à la story</Text>
                <TouchableOpacity onPress={handleCloseReactionModal}>
                  <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.modalInput}
                placeholder="Écrivez votre réaction..."
                placeholderTextColor={COLORS.textLight}
                value={reactionText}
                onChangeText={setReactionText}
                multiline
                textAlignVertical="top"
                maxLength={200}
                autoFocus
              />

              <TouchableOpacity
                style={[
                  styles.modalSendButton,
                  (!reactionText.trim() || isSendingReaction) && styles.modalSendButtonDisabled
                ]}
                onPress={handleSendReaction}
                disabled={!reactionText.trim() || isSendingReaction}
              >
                {isSendingReaction ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="send" size={20} color="#fff" />
                    <Text style={styles.modalSendButtonText}>Envoyer</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'À l\'instant';
  if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)}min`;
  if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`;
  return `Il y a ${Math.floor(seconds / 86400)}j`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  backButton: {
    color: '#7D80F4',
    fontSize: 16,
    fontWeight: '600',
  },
  backgroundImage: {
    width: width,
    height: height,
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 50,
    gap: 4,
  },
  progressBarContainer: {
    flex: 1,
  },
  progressBarBackground: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  userDetails: {
    gap: 2,
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  captionContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  caption: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  tapContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  tapLeft: {
    flex: 1,
  },
  tapRight: {
    flex: 1,
  },
  viewsContainer: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewsText: {
    color: '#fff',
    fontSize: 14,
  },
  reactionButton: {
    position: 'absolute',
    bottom: 30,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(125, 128, 244, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalInput: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 120,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalSendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  modalSendButtonDisabled: {
    backgroundColor: COLORS.border,
    opacity: 0.6,
  },
  modalSendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

