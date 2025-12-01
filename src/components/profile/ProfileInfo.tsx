import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../../types/navigation';
import { Profile } from '../../types/profile';

interface ProfileInfoProps {
  profile: Profile;
}

export function ProfileInfo({ profile }: ProfileInfoProps) {
  const navigation = useNavigation<NavigationProp>();

  // Mapper les valeurs aux labels
  const getLevelLabel = (level?: string) => {
    const levels: Record<string, string> = {
      beginner: '🐣 Débutant',
      intermediate: '🏃 Intermédiaire',
      advanced: '💪 Avancé',
      expert: '🏆 Expert',
    };
    return levels[level || ''] || 'Non renseigné';
  };

  const getTimeLabel = (time?: string) => {
    const times: Record<string, string> = {
      morning: '🌅 Matinée (6h-10h)',
      afternoon: '☀️ Après-midi (14h-18h)',
      evening: '🌇 Soirée (18h-21h)',
      night: '🌙 Nuit (21h-6h)',
    };
    return times[time || ''] || 'Non renseigné';
  };

  const getTerrainLabel = (terrain?: string) => {
    if (!terrain) return 'Non renseigné';
    const terrains: Record<string, string> = {
      route: 'Route',
      trail: 'Trail',
      track: 'Piste',
      mixed: 'Mixte',
    };
    return terrain.split(',').map(t => terrains[t.trim()]).filter(Boolean).join(', ') || 'Non renseigné';
  };

  const getGroupLabel = (pref?: string) => {
    const prefs: Record<string, string> = {
      solo: 'Je préfère courir seul(e)',
      group: 'J\'aime courir en groupe',
      both: 'Les deux, selon mon humeur',
    };
    return prefs[pref || ''] || 'Non renseigné';
  };

  const getMemberSince = (date?: string) => {
    if (!date) return 'Récemment';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      {/* Section À propos */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>À propos</Text>
          <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
            <MaterialCommunityIcons name="pencil" size={20} color="#7D80F4" />
          </TouchableOpacity>
        </View>

        <InfoItem
          icon="account"
          label="Membre depuis"
          value={getMemberSince(profile.memberSince)}
        />

        <InfoItem
          icon="trophy"
          label="Niveau"
          value={getLevelLabel(profile.level)}
        />

        {profile.goal && (
          <InfoItem
            icon="run-fast"
            label="Objectif"
            value={profile.goal}
          />
        )}
      </View>

      {/* Section Préférences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Préférences</Text>

        <InfoItem
          icon="weather-sunny"
          label="Moment préféré"
          value={getTimeLabel(profile.preferredTime)}
        />

        <InfoItem
          icon="map-marker"
          label="Type de parcours"
          value={getTerrainLabel(profile.preferredTerrain)}
        />

        <InfoItem
          icon="account-multiple"
          label="Préférence"
          value={getGroupLabel(profile.groupPreference)}
        />
      </View>

      {/* Section Badges */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Badges et réalisations</Text>
        
        <View style={styles.badgesGrid}>
          <BadgeItem
            icon="medal"
            label="Premier 5km"
            color="#FFD700"
          />
          <BadgeItem
            icon="fire"
            label="10 jours d'affilée"
            color="#FF6B6B"
          />
          <BadgeItem
            icon="star"
            label="50km total"
            color="#4CAF50"
          />
          <BadgeItem
            icon="trophy-variant"
            label="Marathon"
            color="#9C27B0"
          />
        </View>

        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>Voir tous les badges</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#7D80F4" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface InfoItemProps {
  icon: string;
  label: string;
  value: string;
}

function InfoItem({ icon, label, value }: InfoItemProps) {
  return (
    <View style={styles.infoItem}>
      <MaterialCommunityIcons name={icon as any} size={20} color="#666" />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

interface BadgeItemProps {
  icon: string;
  label: string;
  color: string;
}

function BadgeItem({ icon, label, color }: BadgeItemProps) {
  return (
    <View style={styles.badge}>
      <View style={[styles.badgeIcon, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.badgeLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoContent: {
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badge: {
    width: '47%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  badgeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  viewAllText: {
    color: '#7D80F4',
    fontSize: 14,
    fontWeight: '500',
  },
});

