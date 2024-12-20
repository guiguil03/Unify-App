import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileStats } from '../components/profile/ProfileStats';
import { Profile } from '../types/profile';

const MOCK_PROFILE: Profile = {
  id: '1',
  name: 'John Doe',
  avatar: 'https://example.com/avatar.jpg',
  bio: 'Passionné de course à pied',
  stats: {
    totalDistance: 42.5,
    totalTime: '3h45',
    sessions: 8,
    averagePace: '5:20 min/km',
  },
};

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container}>
      <ProfileHeader profile={MOCK_PROFILE} />
      <ProfileStats stats={MOCK_PROFILE.stats} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',
  },
});