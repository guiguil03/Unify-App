import React from 'react';
import { ScrollView, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileStats } from '../components/profile/ProfileStats';
import { ProfileInfo } from '../components/profile/ProfileInfo';
import { useProfile } from '../hooks/useProfile';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { BottomNav } from '../components/common/BottomNav';

export default function ProfileScreen() {
  const { profile, loading, error } = useProfile();

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
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <ProfileHeader profile={profile} />
        <ProfileStats stats={profile.stats} />
        <ProfileInfo profile={profile} />
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
});