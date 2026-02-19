import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { EventCard } from '../components/events/EventCard';
import { useEvents } from '../hooks/useEvents';
import { useSubscription } from '../contexts/SubscriptionContext';
import { COLORS } from '../constants/colors';
import { NavigationProp } from '../types/navigation';

type FilterTab = 'all' | 'mine';

export default function EventsScreen() {
  const { isPremium } = useSubscription();
  const navigation = useNavigation<NavigationProp>();
  const { events, loading, refetch, toggleParticipation } = useEvents();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const myEvents = useMemo(() => events.filter(e => e.isParticipating), [events]);
  const displayedEvents = activeTab === 'mine' ? myEvents : events;

  // ── Premium gate ──────────────────────────────────────────────────────────────
  if (!isPremium) {
    return (
      <View style={styles.container}>
        <View style={styles.premiumWrap}>
          <View style={styles.premiumIcon}>
            <MaterialCommunityIcons name="calendar-star" size={48} color="#FFD700" />
          </View>
          <Text style={styles.premiumTitle}>Accès aux évènements</Text>
          <Text style={styles.premiumSub}>
            Rejoignez des courses en groupe, des marathons et bien d'autres
            événements exclusifs réservés aux membres Premium.
          </Text>
          <View style={styles.featureList}>
            {FEATURES.map(f => (
              <View key={f.label} style={styles.featureItem}>
                <View style={styles.featureDot}>
                  <MaterialCommunityIcons name={f.icon as any} size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.featureText}>{f.label}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="crown" size={18} color="#fff" />
            <Text style={styles.upgradeBtnText}>Passer à Premium</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Stats banner */}
      <View style={styles.statsBanner}>
        <StatChip icon="calendar-month" value={events.length} label="À venir" />
        <View style={styles.statsDivider} />
        <StatChip icon="check-circle-outline" value={myEvents.length} label="Mes inscriptions" />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            Tous ({events.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'mine' && styles.tabActive]}
          onPress={() => setActiveTab('mine')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'mine' && styles.tabTextActive]}>
            Mes inscriptions ({myEvents.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {displayedEvents.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          displayedEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onToggleParticipation={() =>
                toggleParticipation(event.id, !!event.isParticipating)
              }
            />
          ))
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatChip({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <View style={styles.statChip}>
      <MaterialCommunityIcons name={icon as any} size={18} color={COLORS.primary} />
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function EmptyState({ tab }: { tab: FilterTab }) {
  return (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        name={tab === 'mine' ? 'calendar-check-outline' : 'calendar-blank-outline'}
        size={64}
        color="#D0D0D0"
      />
      <Text style={styles.emptyTitle}>
        {tab === 'mine' ? 'Aucune inscription' : 'Aucun événement'}
      </Text>
      <Text style={styles.emptySub}>
        {tab === 'mine'
          ? "Inscrivez-vous à des événements pour les retrouver ici."
          : "Aucun événement à venir pour le moment. Revenez plus tard !"}
      </Text>
    </View>
  );
}

const FEATURES = [
  { icon: 'account-group',      label: 'Courses en groupe organisées' },
  { icon: 'trophy',             label: 'Compétitions & défis' },
  { icon: 'map-marker-radius',  label: 'Événements près de chez vous' },
  { icon: 'bell-ring',          label: 'Notifications en avant-première' },
];

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
  },

  // Stats banner
  statsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statsDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#EBEBEB',
    marginHorizontal: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A2E',
    lineHeight: 24,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    backgroundColor: '#EBEBEB',
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#999',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // List
  list: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
  },
  emptySub: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Premium gate
  premiumWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  premiumIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  premiumTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 10,
    textAlign: 'center',
  },
  premiumSub: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 21,
  },
  featureList: {
    width: '100%',
    gap: 12,
    marginBottom: 28,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  featureDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF0FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 28,
    borderRadius: 12,
    width: '100%',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
