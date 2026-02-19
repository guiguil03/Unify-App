import React from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { EventCard } from '../components/events/EventCard';
import { useEvents } from '../hooks/useEvents';
import { useSubscription } from '../contexts/SubscriptionContext';
import { COLORS } from '../constants/colors';
import { NavigationProp } from '../types/navigation';

export default function EventsScreen() {
  const { isPremium } = useSubscription();
  const navigation = useNavigation<NavigationProp>();
  const { events, loading, toggleParticipation } = useEvents();

  if (!isPremium) {
    return (
      <View style={styles.container}>
        <View style={styles.premiumRequired}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="calendar-star" size={56} color="#FFD700" />
          </View>
          <Text style={styles.premiumTitle}>Accès aux évènements</Text>
          <Text style={styles.premiumText}>
            Rejoignez des courses en groupe, des marathons et bien d'autres événements exclusifs réservés aux membres Premium.
          </Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="account-group" size={20} color={COLORS.primary} />
              <Text style={styles.featureText}>Courses en groupe organisées</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="trophy" size={20} color={COLORS.primary} />
              <Text style={styles.featureText}>Compétitions & défis</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="map-marker-radius" size={20} color={COLORS.primary} />
              <Text style={styles.featureText}>Événements près de chez vous</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="bell-ring" size={20} color={COLORS.primary} />
              <Text style={styles.featureText}>Notifications en avant-première</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <MaterialCommunityIcons name="crown" size={20} color="white" />
            <Text style={styles.upgradeButtonText}>Passer à Premium</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.list}>
        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Aucun événement à venir</Text>
          </View>
        ) : (
          events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onToggleParticipation={() =>
                toggleParticipation(event.id, !!event.isParticipating)
              }
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  list: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  premiumRequired: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  premiumText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  featuresList: {
    width: '100%',
    marginBottom: 28,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  featureText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
    width: '100%',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
