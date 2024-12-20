import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { StoryCircle } from './StoryCircle';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../../types/navigation';

const MOCK_STORIES = [
  {
    id: '1',
    username: 'Marie L.',
    imageUrl: 'https://randomuser.me/api/portraits/women/1.jpg',
    seen: false,
  },
  {
    id: '2',
    username: 'Thomas R.',
    imageUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
    seen: false,
  },
  {
    id: '3',
    username: 'Sophie M.',
    imageUrl: 'https://randomuser.me/api/portraits/women/2.jpg',
    seen: true,
  },
  {
    id: '4',
    username: 'Lucas P.',
    imageUrl: 'https://randomuser.me/api/portraits/men/2.jpg',
    seen: false,
  },
  {
    id: '5',
    username: 'Emma W.',
    imageUrl: 'https://randomuser.me/api/portraits/women/3.jpg',
    seen: true,
  },
];

export function StoriesRow() {
  const navigation = useNavigation<NavigationProp>();

  const handleStoryPress = (userId: string) => {
    navigation.navigate('ActivityDetail', { activityId: userId });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {MOCK_STORIES.map((story) => (
          <StoryCircle
            key={story.id}
            imageUrl={story.imageUrl}
            username={story.username}
            seen={story.seen}
            onPress={() => handleStoryPress(story.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 10,
  },
});