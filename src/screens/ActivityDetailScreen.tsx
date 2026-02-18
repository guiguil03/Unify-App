import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityMap } from '../components/activities/ActivityMap';
import { NavigationProp } from '../types/navigation';
import { useActivitiesManager } from '../hooks/useActivitiesManager';
import { Activity, ActivityRoute } from '../types/activity';
import { ActivitiesService } from '../services/ActivitiesService';
import { formatDistance, formatDuration } from '../utils/format';
import { COLORS } from '../constants/colors';

interface ActivityDetailScreenProps {
  route: {
    params: {
      activityId: string;
    };
  };
}

function parsePaceToMinutes(pace: string): number | null {
  const match = pace?.match(/(\d+):(\d+)/);
  if (!match) return null;
  return parseInt(match[1]) + parseInt(match[2]) / 60;
}

function formatTotalPauseTime(pauses: ActivityRoute['pauses']): string {
  if (!pauses.length) return '0s';
  const totalSec = pauses.reduce((acc, p) => acc + (p.endTime - p.startTime) / 1000, 0);
  return formatDuration(totalSec);
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function ActivityDetailScreen({ route }: ActivityDetailScreenProps) {
  const { activityId } = route.params;
  const navigation = useNavigation<NavigationProp>();
  const { deleteActivity } = useActivitiesManager();
  const [activity, setActivity] = React.useState<Activity & { route?: ActivityRoute } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    ActivitiesService.getActivityById(activityId)
      .then(setActivity)
      .catch(() => setActivity(null))
      .finally(() => setLoading(false));
  }, [activityId]);

  const handleDelete = React.useCallback(() => {
    Alert.alert(
      'Supprimer l\'activité',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            if (activity) {
              deleteActivity(activity.id);
              navigation.goBack();
            }
          },
        },
      ]
    );
  }, [activity, deleteActivity, navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!activity) return null;

  const pauses = activity.route?.pauses ?? [];
  const coordinates = activity.route?.coordinates ?? [];

  const paceMinutes = parsePaceToMinutes(activity.pace);
  const speedKmh = paceMinutes ? (60 / paceMinutes).toFixed(1) : '—';

  const initialRegion = coordinates.length > 0
    ? {
        latitude: coordinates[0].latitude,
        longitude: coordinates[0].longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : { latitude: 0, longitude: 0, latitudeDelta: 0.01, longitudeDelta: 0.01 };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ── Carte ── */}
      {activity.route && coordinates.length > 0 ? (
        <ActivityMap route={activity.route} initialRegion={initialRegion} />
      ) : (
        <View style={styles.noMapPlaceholder}>
          <MaterialCommunityIcons name="map-off" size={40} color={COLORS.textLight} />
          <Text style={styles.noMapText}>Aucun tracé GPS enregistré</Text>
        </View>
      )}

      <View style={styles.content}>

        {/* ── Date + heure ── */}
        <View style={styles.dateRow}>
          <MaterialCommunityIcons name="calendar" size={16} color={COLORS.primary} />
          <Text style={styles.dateText}>{formatDate(activity.date)}</Text>
          <Text style={styles.timeText}>{formatTime(activity.date)}</Text>
        </View>

        {/* ── 3 stats principales ── */}
        <View style={styles.mainStatsRow}>
          <View style={styles.mainStat}>
            <Text style={styles.mainStatValue}>{formatDistance(activity.distance)}</Text>
            <Text style={styles.mainStatLabel}>Distance</Text>
          </View>
          <View style={styles.mainStatDivider} />
          <View style={styles.mainStat}>
            <Text style={styles.mainStatValue}>{activity.duration}</Text>
            <Text style={styles.mainStatLabel}>Durée</Text>
          </View>
          <View style={styles.mainStatDivider} />
          <View style={styles.mainStat}>
            <Text style={styles.mainStatValue}>{activity.pace}</Text>
            <Text style={styles.mainStatLabel}>Allure</Text>
          </View>
        </View>

        {/* ── Stats secondaires ── */}
        <View style={styles.secondaryGrid}>
          <StatCard icon="speedometer" label="Vitesse moy." value={`${speedKmh} km/h`} />
          <StatCard icon="pause-circle-outline" label="Pauses" value={`${pauses.length}`} />
          <StatCard icon="timer-pause-outline" label="Temps en pause" value={pauses.length ? formatTotalPauseTime(pauses) : '—'} />
          <StatCard icon="map-marker-path" label="Points GPS" value={`${coordinates.length}`} />
        </View>

        {/* ── Détail des pauses ── */}
        {pauses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pauses</Text>
            {pauses.map((pause, index) => {
              const duration = formatDuration((pause.endTime - pause.startTime) / 1000);
              return (
                <View key={index} style={styles.pauseCard}>
                  <View style={styles.pauseIconWrap}>
                    <MaterialCommunityIcons name="pause" size={18} color={COLORS.primary} />
                  </View>
                  <View style={styles.pauseInfo}>
                    <Text style={styles.pauseTitle}>Pause {index + 1}</Text>
                    <Text style={styles.pauseSub}>Durée : {duration}</Text>
                  </View>
                  <Text style={styles.pauseDuration}>{duration}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Infos tracé ── */}
        {coordinates.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tracé</Text>
            <View style={styles.traceRow}>
              <View style={styles.traceItem}>
                <View style={[styles.traceIcon, { backgroundColor: COLORS.success + '20' }]}>
                  <MaterialCommunityIcons name="flag-checkered" size={18} color={COLORS.success} />
                </View>
                <Text style={styles.traceLabel}>Départ</Text>
                <Text style={styles.traceCoord}>
                  {coordinates[0].latitude.toFixed(4)}, {coordinates[0].longitude.toFixed(4)}
                </Text>
              </View>
              <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.textLight} />
              <View style={styles.traceItem}>
                <View style={[styles.traceIcon, { backgroundColor: COLORS.error + '20' }]}>
                  <MaterialCommunityIcons name="flag" size={18} color={COLORS.error} />
                </View>
                <Text style={styles.traceLabel}>Arrivée</Text>
                <Text style={styles.traceCoord}>
                  {coordinates[coordinates.length - 1].latitude.toFixed(4)}, {coordinates[coordinates.length - 1].longitude.toFixed(4)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Bouton supprimer ── */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.8}>
          <MaterialCommunityIcons name="delete-outline" size={20} color={COLORS.error} />
          <Text style={styles.deleteButtonText}>Supprimer l'activité</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statCardIcon}>
        <MaterialCommunityIcons name={icon as any} size={20} color={COLORS.primary} />
      </View>
      <Text style={styles.statCardValue}>{value}</Text>
      <Text style={styles.statCardLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
  },
  content: {
    padding: 16,
    gap: 12,
  },

  // No map
  noMapPlaceholder: {
    height: 180,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  noMapText: {
    fontSize: 14,
    color: COLORS.textLight,
  },

  // Date
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textTransform: 'capitalize',
  },
  timeText: {
    fontSize: 13,
    color: COLORS.textLight,
  },

  // Stats principales
  mainStatsRow: {
    marginTop: 8,
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  mainStat: {
    flex: 1,
    alignItems: 'center',
  },
  mainStatValue: {
    fontSize: 22,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.5,
  },
  mainStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mainStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },

  // Stats secondaires
  secondaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '47.5%',
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  statCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  statCardLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },

  // Sections
  section: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  // Pauses
  pauseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  pauseIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseInfo: {
    flex: 1,
  },
  pauseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  pauseSub: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  pauseDuration: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Tracé
  traceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 4,
  },
  traceItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  traceIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  traceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  traceCoord: {
    fontSize: 11,
    color: COLORS.textLight,
    textAlign: 'center',
  },

  // Delete
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.error,
    marginBottom: 8,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.error,
  },
});
