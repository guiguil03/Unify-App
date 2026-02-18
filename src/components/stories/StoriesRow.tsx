import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useStories } from '../../hooks/useStories';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { NavigationProp } from '../../types/navigation';

export function StoriesRow() {
  const { stories, loading, refetch } = useStories();
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigation = useNavigation<NavigationProp>();

  // Rafraîchir les stories quand on revient sur l'écran
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Grouper les stories par utilisateur
  const groupedStories = React.useMemo(() => {
    const groups = new Map<string, typeof stories>();
    
    stories.forEach(story => {
      if (!groups.has(story.userId)) {
        groups.set(story.userId, []);
      }
      groups.get(story.userId)!.push(story);
    });

    return Array.from(groups.entries()).map(([userId, userStories]) => ({
      userId,
      userName: userStories[0].userName,
      userAvatar: userStories[0].userAvatar,
      stories: userStories,
      hasUnviewed: userStories.some(s => !s.hasViewed),
    }));
  }, [stories]);

  // Trouver la story de l'utilisateur actuel
  const currentUserStory = React.useMemo(() => {
    return groupedStories.find(group => group.userId === user?.id);
  }, [groupedStories, user?.id]);

  // Stories des autres utilisateurs (exclure la story actuelle)
  const otherStories = React.useMemo(() => {
    return groupedStories.filter(group => group.userId !== user?.id);
  }, [groupedStories, user?.id]);

  // Si on charge et qu'on n'a pas encore de stories, ne rien afficher
  // Sinon, toujours afficher les stories existantes même pendant le rechargement
  if (loading && stories.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Story de l'utilisateur actuel */}
      {currentUserStory ? (
        <View style={styles.storyItem}>
          <View style={styles.avatarWrapper}>
            <TouchableOpacity onPress={() => navigation.navigate('ViewStories', { userId: user!.id })}>
              <View style={[styles.avatarContainer, styles.myStoryBorder]}>
                {profile?.avatar ? (
                  <Image
                    source={{ uri: profile.avatar }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <MaterialCommunityIcons name="account" size={24} color="#999" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>Ma story</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.storyItem}
          onPress={() => navigation.navigate('CreateStory')}
        >
          <View style={[styles.avatar, styles.addStoryAvatar]}>
            <MaterialCommunityIcons name="plus" size={24} color="#ffffff" />
          </View>
          <Text style={styles.name}>Votre story</Text>
        </TouchableOpacity>
      )}

      {/* Stories des autres */}
      {otherStories.map((group) => (
        <TouchableOpacity
          key={group.userId}
          style={styles.storyItem}
          onPress={() => navigation.navigate('ViewStories', { userId: group.userId })}
        >
          <View style={[
            styles.avatarContainer,
            group.hasUnviewed && styles.unviewedBorder
          ]}>
            {group.userAvatar ? (
              <Image source={{ uri: group.userAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <MaterialCommunityIcons name="account" size={24} color="#999" />
              </View>
            )}
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {group.userName}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
  },
  content: {
    paddingHorizontal: 8,
    gap: 12,
    backgroundColor: '#ffffff',
  },
  storyItem: {
    alignItems: 'center',
    width: 70,
    position: 'relative',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 4,
  },
  avatarContainer: {
    padding: 2,
    borderRadius: 35,
    position: 'relative',
  },
  unviewedBorder: {
    borderWidth: 2,
    borderColor: '#7D80F4',
  },
  myStoryBorder: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
  },
  addStoryAvatar: {
    backgroundColor: '#7D80F4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7D80F4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 12,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  name: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
});
