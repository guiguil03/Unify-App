import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RoutesService } from '../services/RoutesService';
import { SubscriptionService } from '../services/SubscriptionService';
import { Route } from '../types/route';
import { COLORS } from '../constants/colors';
import { showErrorToast, showSuccessToast } from '../utils/errorHandler';

type Tab = 'public' | 'my' | 'saved';

export default function RoutesScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<Tab>('public');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    checkPremium();
    loadRoutes();
  }, [activeTab]);

  const checkPremium = async () => {
    try {
      const premium = await SubscriptionService.isPremium();
      setIsPremium(premium);
    } catch (error) {
      if (__DEV__) console.error('Premium check failed:', error);
    }
  };

  const loadRoutes = async () => {
    try {
      setLoading(true);
      let data: Route[] = [];

      switch (activeTab) {
        case 'public':
          data = await RoutesService.getPublicRoutes();
          break;
        case 'my':
          if (isPremium) {
            data = await RoutesService.getMyRoutes();
          }
          break;
        case 'saved':
          data = await RoutesService.getSavedRoutes();
          break;
      }

      setRoutes(data);
    } catch (error: any) {
      if (error.message?.includes('premium')) {
        // Ne pas afficher d'erreur si c'est juste une question de premium
      } else {
        showErrorToast(error.message || 'Erreur lors du chargement des parcours');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRoutes();
  };

  const handleCreateRoute = () => {
    if (!isPremium) {
      Alert.alert(
        'Fonctionnalité Premium',
        'La création de parcours est réservée aux utilisateurs premium.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Voir Premium', onPress: () => navigation.navigate('Profile' as never) },
        ]
      );
      return;
    }
    navigation.navigate('CreateRoute' as never);
  };

  const handleSaveRoute = async (routeId: string) => {
    try {
      await RoutesService.saveRoute(routeId);
      showSuccessToast('Parcours sauvegardé !');
      if (activeTab === 'saved') {
        loadRoutes();
      }
    } catch (error: any) {
      showErrorToast(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleShareRoute = (route: Route) => {
    if (route.shareCode) {
      Alert.alert(
        'Partager le parcours',
        `Code de partage: ${route.shareCode}\n\nPartagez ce code avec d'autres utilisateurs pour qu'ils puissent accéder à votre parcours.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleRoutePress = (route: Route) => {
    navigation.navigate('RouteDetail' as never, { routeId: route.id } as never);
  };

  const renderRoute = ({ item }: { item: Route }) => (
    <TouchableOpacity 
      style={styles.routeCard} 
      onPress={() => handleRoutePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.routeHeader}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeTitle}>{item.title}</Text>
          {item.description && (
            <Text style={styles.routeDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
        {item.difficulty && (
          <View
            style={[
              styles.difficultyBadge,
              {
                backgroundColor:
                  item.difficulty === 'easy'
                    ? COLORS.success
                    : item.difficulty === 'medium'
                    ? '#FFA500'
                    : item.difficulty === 'hard'
                    ? COLORS.error
                    : '#8B0000',
              },
            ]}
          >
            <Text style={styles.difficultyText}>
              {item.difficulty === 'easy'
                ? 'Facile'
                : item.difficulty === 'medium'
                ? 'Moyen'
                : item.difficulty === 'hard'
                ? 'Difficile'
                : 'Expert'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.routeStats}>
        <View style={styles.stat}>
          <View style={styles.statIcon}>
            <MaterialCommunityIcons name="map-marker-distance" size={18} color={COLORS.primary} />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{item.distance.toFixed(2)}</Text>
            <Text style={styles.statLabel}>km</Text>
          </View>
        </View>
        {item.durationEstimate && (
          <View style={styles.stat}>
            <View style={styles.statIcon}>
              <MaterialCommunityIcons name="clock-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{item.durationEstimate}</Text>
              <Text style={styles.statLabel}>min</Text>
            </View>
          </View>
        )}
        {item.creatorName && (
          <View style={styles.stat}>
            <View style={styles.statIcon}>
              <MaterialCommunityIcons name="account-circle" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.creatorName} numberOfLines={1}>{item.creatorName}</Text>
          </View>
        )}
      </View>

      <View style={styles.routeActions}>
        {item.shareCode && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleShareRoute(item);
            }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="share-variant" size={18} color={COLORS.primary} />
            <Text style={styles.actionText}>Partager</Text>
          </TouchableOpacity>
        )}
        {activeTab !== 'saved' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleSaveRoute(item.id);
            }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="bookmark-outline" size={18} color={COLORS.primary} />
            <Text style={styles.actionText}>Sauvegarder</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.viewButton}
          onPress={(e) => {
            e.stopPropagation();
            handleRoutePress(item);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.viewButtonText}>Voir</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Parcours</Text>
        {isPremium && (
          <TouchableOpacity 
            style={styles.createButton} 
            onPress={handleCreateRoute}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="plus-circle" size={28} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'public' && styles.tabActive]}
          onPress={() => setActiveTab('public')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'public' && styles.tabTextActive]}>
            Public
          </Text>
        </TouchableOpacity>
        {isPremium && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'my' && styles.tabActive]}
            onPress={() => setActiveTab('my')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>Mes parcours</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
          onPress={() => setActiveTab('saved')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
            Sauvegardés
          </Text>
        </TouchableOpacity>
      </View>

      {loading && routes.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : routes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="map-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.emptyText}>
            {activeTab === 'public'
              ? 'Aucun parcours public pour le moment'
              : activeTab === 'my'
              ? 'Vous n\'avez pas encore créé de parcours'
              : 'Aucun parcours sauvegardé'}
          </Text>
          {activeTab === 'my' && isPremium && (
            <TouchableOpacity style={styles.emptyButton} onPress={handleCreateRoute}>
              <Text style={styles.emptyButtonText}>Créer mon premier parcours</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={routes}
          renderItem={renderRoute}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
  },
  createButton: {
    padding: 4,
    borderRadius: 20,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    marginHorizontal: 4,
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textLight,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  list: {
    padding: 16,
    paddingTop: 20,
  },
  routeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  routeInfo: {
    flex: 1,
    marginRight: 12,
  },
  routeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  routeDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 70,
    alignItems: 'center',
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  routeStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flexDirection: 'column',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: -2,
  },
  creatorName: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
  },
  routeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundLight,
  },
  actionText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    marginLeft: 'auto',
  },
  viewButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: COLORS.backgroundLight,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  emptyButton: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});

