import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useStories } from '../../hooks/useStories';
import { useAuth } from '../../contexts/AuthContext';
import { NavigationProp } from '../../types/navigation';

export function StoriesRow() {
  const { stories, loading, refetch } = useStories();
  const { user } = useAuth();
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
                <Image
                  source={{ uri: currentUserStory.stories[0].imageUrl }}
                  style={styles.avatar}
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addBadgeButton}
              onPress={() => navigation.navigate('CreateStory')}
            >
              <View style={styles.addBadge}>
                <MaterialCommunityIcons name="plus" size={14} color="#fff" />
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
            <MaterialCommunityIcons name="plus" size={24} color="#fff" />
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
    marginVertical: 12,
  },
  content: {
    paddingHorizontal: 8,
    gap: 12,
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
    borderColor: '#E83D4D',
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
    backgroundColor: '#E83D4D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  addBadgeButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    zIndex: 10,
  },
  addBadge: {
    backgroundColor: '#4CAF50',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  name: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
});
