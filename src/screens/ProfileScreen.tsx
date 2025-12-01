import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, Image, FlatList, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileStats } from '../components/profile/ProfileStats';
import { ProfileInfo } from '../components/profile/ProfileInfo';
import { useProfile } from '../hooks/useProfile';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { BottomNav } from '../components/common/BottomNav';
import { PostsService } from '../services/PostsService';
import { StoriesService, Story } from '../services/StoriesService';
import { Post } from '../types/post';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../constants/colors';

export default function ProfileScreen() {
  const { profile, loading, error } = useProfile();
  const { user } = useAuth();
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingStories, setLoadingStories] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'stories'>('posts');

  // Charger les posts et stories de l'utilisateur
  useEffect(() => {
    if (user?.id) {
      loadUserContent();
    }
  }, [user?.id]);

  const loadUserContent = async () => {
    if (!user?.id) return;

    try {
      setLoadingPosts(true);
      setLoadingStories(true);

      const [posts, stories] = await Promise.all([
        PostsService.getUserPosts(user.id),
        StoriesService.getUserStoriesHistory(user.id),
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserContent();
    setRefreshing(false);
  };

  const renderPostItem = ({ item }: { item: Post }) => (
    <TouchableOpacity style={styles.postItem}>
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
      <TouchableOpacity style={styles.storyItem}>
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
        <ActivityIndicator size="large" color="#7D80F4" />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error || 'Impossible de charger le profil'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Profil" />
      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        <ProfileHeader profile={profile} />
        <ProfileStats stats={profile.stats} />
        <ProfileInfo profile={profile} />

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
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#7D80F4',
    textAlign: 'center',
  },
  historySection: {
    backgroundColor: COLORS.background,
    borderRadius: 20,
    padding: 16,
    marginTop: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundLight,
    gap: 8,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  tabTextActive: {
    color: COLORS.background,
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
    borderRadius: 8,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    padding: 6,
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
    borderRadius: 8,
  },
  storyImagePlaceholder: {
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expiredBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  storyOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    padding: 6,
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
  loadingContent: {
    padding: 40,
    alignItems: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});