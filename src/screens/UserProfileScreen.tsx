import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, Image, FlatList, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ProfileService } from '../services/ProfileService';
import { PostsService } from '../services/PostsService';
import { StoriesService, Story } from '../services/StoriesService';
import { ContactsService } from '../services/ContactsService';
import { Profile } from '../types/profile';
import { Post } from '../types/post';
import { ProfileStats } from '../components/profile/ProfileStats';
import { ProfileInfo } from '../components/profile/ProfileInfo';
import { COLORS } from '../constants/colors';
import { NavigationProp } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { showErrorToast, showSuccessToast, showInfoToast } from '../utils/errorHandler';

export default function UserProfileScreen() {
  const route = useRoute();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const userId = (route.params as any)?.userId;
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingStories, setLoadingStories] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'stories'>('posts');
  const [contactStatus, setContactStatus] = useState<'none' | 'friends' | 'pending' | 'incoming'>('none');
  const [loadingContact, setLoadingContact] = useState(false);

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (userId) {
      loadProfile();
      loadUserContent();
      if (!isOwnProfile) {
        checkContactStatus();
      }
    }
  }, [userId, isOwnProfile]);

  const loadProfile = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      const userProfile = await ProfileService.getProfileById(userId);
      setProfile(userProfile);
    } catch (err: any) {
      console.error('Erreur chargement profil:', err);
      setError(err.message || 'Impossible de charger le profil');
      showErrorToast(err.message || 'Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  };

  const loadUserContent = async () => {
    if (!userId) return;

    try {
      setLoadingPosts(true);
      setLoadingStories(true);

      const [posts, stories] = await Promise.all([
        PostsService.getUserPosts(userId),
        StoriesService.getUserStoriesHistory(userId),
      ]);

      setUserPosts(posts);
      setUserStories(stories);
    } catch (err) {
      console.error('Erreur lors du chargement du contenu:', err);
    } finally {
      setLoadingPosts(false);
      setLoadingStories(false);
    }
  };

  const checkContactStatus = async () => {
    if (!userId || !user?.id || isOwnProfile) return;

    try {
      const relationships = await ContactsService.getRelationshipsMap();
      const status = relationships[userId];
      
      if (status === 'friends') {
        setContactStatus('friends');
      } else if (status === 'pending') {
        setContactStatus('pending');
      } else if (status === 'incoming') {
        setContactStatus('incoming');
      } else {
        setContactStatus('none');
      }
    } catch (err) {
      console.error('Erreur lors de la vérification du statut de contact:', err);
      setContactStatus('none');
    }
  };

  const handleAddContact = async () => {
    if (!userId) return;

    try {
      setLoadingContact(true);
      await ContactsService.addContact(userId);
      setContactStatus('pending');
      showSuccessToast('Demande d\'ami envoyée ! 🎉');
    } catch (err: any) {
      if (err.message === 'ALREADY_FRIENDS') {
        setContactStatus('friends');
        showInfoToast('Vous êtes déjà amis.');
      } else if (err.message === 'REQUEST_ALREADY_SENT') {
        setContactStatus('pending');
        showInfoToast('Vous avez déjà envoyé une demande.');
      } else if (err.message === 'REQUEST_PENDING_FROM_CONTACT') {
        setContactStatus('incoming');
        showInfoToast('Cette personne vous a déjà envoyé une demande.');
      } else {
        showErrorToast('Impossible d\'envoyer la demande');
      }
    } finally {
      setLoadingContact(false);
    }
  };

  const handleSendMessage = () => {
    if (!profile) return;
    navigation.navigate('Chat', {
      contactId: userId,
      contactName: profile.name,
    });
  };

  const handleViewStory = (story: Story) => {
    navigation.navigate('ViewStories', { userId });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadProfile(), 
      loadUserContent(),
      !isOwnProfile ? checkContactStatus() : Promise.resolve()
    ]);
    setRefreshing(false);
  };

  const renderPostItem = ({ item }: { item: Post }) => (
    <TouchableOpacity 
      style={styles.postItem}
      onPress={() => {
        // Navigation vers le détail du post si nécessaire
      }}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
      ) : (
        <View style={[styles.postImage, styles.postImagePlaceholder]}>
          <MaterialCommunityIcons name="text" size={24} color={COLORS.textLight} />
        </View>
      )}
      <View style={styles.postOverlay}>
        <View style={styles.postStats}>
          <MaterialCommunityIcons name="heart" size={16} color="#fff" />
          <Text style={styles.postStatText}>{item.likesCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderStoryItem = ({ item }: { item: Story }) => {
    const isExpired = new Date(item.expiresAt) < new Date();
    
    return (
      <TouchableOpacity 
        style={styles.storyItem}
        onPress={() => !isExpired && handleViewStory(item)}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.storyImage} />
        ) : (
          <View style={[styles.storyImage, styles.storyImagePlaceholder]}>
            <MaterialCommunityIcons name="video" size={24} color={COLORS.textLight} />
          </View>
        )}
        {isExpired && (
          <View style={styles.expiredBadge}>
            <MaterialCommunityIcons name="clock-outline" size={12} color="#fff" />
          </View>
        )}
        <View style={styles.storyOverlay}>
          <View style={styles.storyStats}>
            <MaterialCommunityIcons name="eye" size={14} color="#fff" />
            <Text style={styles.storyStatText}>{item.viewCount}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={64} color={COLORS.error} />
        <Text style={styles.errorText}>
          {error || 'Impossible de charger le profil'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{profile.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Header du profil */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {profile.avatar ? (
              <Image
                source={{ uri: profile.avatar }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <MaterialCommunityIcons name="account" size={60} color="#999" />
              </View>
            )}
          </View>
          
          <Text style={styles.name}>{profile.name}</Text>
          
          {profile.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : (
            <Text style={styles.noBio}>Aucune biographie</Text>
          )}

          {/* Boutons d'action pour les profils publics */}
          {!isOwnProfile && (
            <View style={styles.actionButtons}>
              {contactStatus === 'friends' ? (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.messageButton]}
                  onPress={handleSendMessage}
                >
                  <MaterialCommunityIcons name="message-text" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Envoyer un message</Text>
                </TouchableOpacity>
              ) : contactStatus === 'pending' ? (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.pendingButton]}
                  disabled
                >
                  <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.primary} />
                  <Text style={[styles.actionButtonText, styles.pendingButtonText]}>Demande envoyée</Text>
                </TouchableOpacity>
              ) : contactStatus === 'incoming' ? (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.messageButton]}
                  onPress={() => navigation.navigate('Contacts')}
                >
                  <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Voir la demande</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.addButton]}
                  onPress={handleAddContact}
                  disabled={loadingContact}
                >
                  {loadingContact ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Ajouter en ami</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <ProfileStats stats={profile.stats} />
        <ProfileInfo profile={profile} editable={false} />

        {/* Section Posts et Stories */}
        <View style={styles.historySection}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'posts' && styles.tabActive]}
              onPress={() => setActiveTab('posts')}
            >
              <MaterialCommunityIcons 
                name="post" 
                size={20} 
                color={activeTab === 'posts' ? COLORS.primary : COLORS.textLight} 
              />
              <Text style={[styles.tabText, activeTab === 'posts' && styles.tabTextActive]}>
                Posts ({userPosts.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'stories' && styles.tabActive]}
              onPress={() => setActiveTab('stories')}
            >
              <MaterialCommunityIcons 
                name="book-open-variant" 
                size={20} 
                color={activeTab === 'stories' ? COLORS.primary : COLORS.textLight} 
              />
              <Text style={[styles.tabText, activeTab === 'stories' && styles.tabTextActive]}>
                Stories ({userStories.length})
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'posts' ? (
            loadingPosts ? (
              <View style={styles.loadingContent}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : userPosts.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="post-outline" size={48} color={COLORS.textLight} />
                <Text style={styles.emptyStateText}>Aucun post pour le moment</Text>
              </View>
            ) : (
              <FlatList
                data={userPosts}
                renderItem={renderPostItem}
                keyExtractor={(item) => item.id}
                numColumns={3}
                scrollEnabled={false}
                contentContainerStyle={styles.gridContainer}
              />
            )
          ) : (
            loadingStories ? (
              <View style={styles.loadingContent}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : userStories.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="book-open-variant" size={48} color={COLORS.textLight} />
                <Text style={styles.emptyStateText}>Aucune story pour le moment</Text>
              </View>
            ) : (
              <FlatList
                data={userStories}
                renderItem={renderStoryItem}
                keyExtractor={(item) => item.id}
                numColumns={3}
                scrollEnabled={false}
                contentContainerStyle={styles.gridContainer}
              />
            )
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: COLORS.backgroundLight,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 22,
  },
  noBio: {
    fontSize: 14,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  historySection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textLight,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  loadingContent: {
    padding: 32,
    alignItems: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textLight,
  },
  gridContainer: {
    gap: 2,
  },
  postItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 1,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  postImagePlaceholder: {
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postStatText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  storyItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 1,
    position: 'relative',
  },
  storyImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  storyImagePlaceholder: {
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expiredBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
  storyOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  storyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  storyStatText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButton: {
    backgroundColor: COLORS.primary,
  },
  messageButton: {
    backgroundColor: COLORS.primary,
  },
  pendingButton: {
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  pendingButtonText: {
    color: COLORS.primary,
  },
  secondaryButtonText: {
    color: COLORS.primary,
  },
});

