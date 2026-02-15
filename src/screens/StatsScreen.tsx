import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatsService, AdvancedStats } from '../services/StatsService';
import { useSubscription } from '../contexts/SubscriptionContext';
import { COLORS } from '../constants/colors';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen() {
  const { isPremium } = useSubscription();
  const [stats, setStats] = useState<AdvancedStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await StatsService.getAdvancedStats();
      setStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h${minutes}min`;
    }
    return `${minutes}min`;
  };

  const formatDistance = (meters: number): string => {
    const km = meters / 1000;
    return `${km.toFixed(1)} km`;
  };

  const calculateProgress = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  if (!isPremium) {
    return (
      <View style={styles.container}>
        <View style={styles.premiumRequired}>
          <MaterialCommunityIcons name="crown" size={64} color={COLORS.primary} />
          <Text style={styles.premiumTitle}>Fonctionnalité Premium</Text>
          <Text style={styles.premiumText}>
            Les statistiques avancées sont réservées aux membres Premium.
            Passez à Premium pour débloquer :
          </Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="chart-line" size={20} color={COLORS.primary} />
              <Text style={styles.featureText}>Graphiques de progression</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="chart-bar" size={20} color={COLORS.primary} />
              <Text style={styles.featureText}>Statistiques par semaine/mois</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="fire" size={20} color={COLORS.primary} />
              <Text style={styles.featureText}>Suivi des séries (streaks)</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="trophy" size={20} color={COLORS.primary} />
              <Text style={styles.featureText}>Objectifs et records personnels</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Aucune statistique disponible</Text>
      </View>
    );
  }

  const weekProgress = calculateProgress(stats.thisWeekDistance, stats.lastWeekDistance);
  const monthProgress = calculateProgress(stats.thisMonthDistance, stats.lastMonthDistance);

  // Données pour le graphique des distances par semaine
  const weeklyDistanceData = {
    labels: stats.weeklyStats.map(w => w.week),
    datasets: [
      {
        data: stats.weeklyStats.map(w => w.totalDistance / 1000), // Convertir en km
        color: (opacity = 1) => `rgba(125, 128, 244, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  // Données pour le graphique des activités par mois
  const monthlyActivitiesData = {
    labels: stats.monthlyStats.map(m => m.month),
    datasets: [
      {
        data: stats.monthlyStats.map(m => m.activitiesCount),
      },
    ],
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(125, 128, 244, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: COLORS.primary,
    },
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Vue d'ensemble */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="map-marker-distance" size={32} color={COLORS.primary} />
            <Text style={styles.statValue}>{formatDistance(stats.totalDistance)}</Text>
            <Text style={styles.statLabel}>Distance totale</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="clock-outline" size={32} color={COLORS.primary} />
            <Text style={styles.statValue}>{formatDuration(stats.totalDuration)}</Text>
            <Text style={styles.statLabel}>Temps total</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="run" size={32} color={COLORS.primary} />
            <Text style={styles.statValue}>{stats.totalActivities}</Text>
            <Text style={styles.statLabel}>Activités</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="fire" size={32} color="#FF6B6B" />
            <Text style={styles.statValue}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Jours de suite</Text>
          </View>
        </View>
      </View>

      {/* Comparaison semaine */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cette semaine</Text>
        <View style={styles.comparisonCard}>
          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>Distance parcourue</Text>
            <Text style={styles.comparisonValue}>{formatDistance(stats.thisWeekDistance)}</Text>
          </View>
          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>Semaine dernière</Text>
            <Text style={styles.comparisonValueSecondary}>
              {formatDistance(stats.lastWeekDistance)}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(Math.abs(weekProgress), 100)}%`,
                  backgroundColor: weekProgress >= 0 ? COLORS.success : COLORS.error,
                },
              ]}
            />
          </View>
          <Text
            style={[
              styles.progressText,
              { color: weekProgress >= 0 ? COLORS.success : COLORS.error },
            ]}
          >
            {weekProgress >= 0 ? '+' : ''}{weekProgress}% par rapport à la semaine dernière
          </Text>
        </View>
      </View>

      {/* Graphique des distances par semaine */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Distance par semaine (km)</Text>
        <LineChart
          data={weeklyDistanceData}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Graphique des activités par mois */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nombre d'activités par mois</Text>
        <BarChart
          data={monthlyActivitiesData}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
          yAxisLabel=""
          yAxisSuffix=""
        />
      </View>

      {/* Records personnels */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Records personnels</Text>
        <View style={styles.recordsContainer}>
          <View style={styles.recordCard}>
            <MaterialCommunityIcons name="speedometer" size={24} color={COLORS.primary} />
            <Text style={styles.recordValue}>{stats.bestPace.toFixed(2)} min/km</Text>
            <Text style={styles.recordLabel}>Meilleure allure</Text>
          </View>
          <View style={styles.recordCard}>
            <MaterialCommunityIcons name="map-marker-distance" size={24} color={COLORS.primary} />
            <Text style={styles.recordValue}>{formatDistance(stats.longestRun)}</Text>
            <Text style={styles.recordLabel}>Plus longue course</Text>
          </View>
          <View style={styles.recordCard}>
            <MaterialCommunityIcons name="chart-line-variant" size={24} color={COLORS.primary} />
            <Text style={styles.recordValue}>{stats.averagePace.toFixed(2)} min/km</Text>
            <Text style={styles.recordLabel}>Allure moyenne</Text>
          </View>
        </View>
      </View>

      {/* Comparaison mois */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ce mois-ci</Text>
        <View style={styles.comparisonCard}>
          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>Distance parcourue</Text>
            <Text style={styles.comparisonValue}>{formatDistance(stats.thisMonthDistance)}</Text>
          </View>
          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>Mois dernier</Text>
            <Text style={styles.comparisonValueSecondary}>
              {formatDistance(stats.lastMonthDistance)}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(Math.abs(monthProgress), 100)}%`,
                  backgroundColor: monthProgress >= 0 ? COLORS.success : COLORS.error,
                },
              ]}
            />
          </View>
          <Text
            style={[
              styles.progressText,
              { color: monthProgress >= 0 ? COLORS.success : COLORS.error },
            ]}
          >
            {monthProgress >= 0 ? '+' : ''}{monthProgress}% par rapport au mois dernier
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    marginTop: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  comparisonCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  comparisonLabel: {
    fontSize: 14,
    color: '#666',
  },
  comparisonValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  comparisonValueSecondary: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginVertical: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  recordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  recordCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recordValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
  },
  recordLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
  premiumRequired: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  premiumText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  featuresList: {
    width: '100%',
    marginTop: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
  },
});
