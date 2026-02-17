import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RoutesService } from '../services/RoutesService';
import { Route } from '../types/route';
import { COLORS } from '../constants/colors';
import { showErrorToast, showSuccessToast } from '../utils/errorHandler';
import { NavigationProp } from '../types/navigation';

export default function RouteDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const routeId = (route.params as any)?.routeId;

  const [routeData, setRouteData] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapRegion, setMapRegion] = useState<any>(null);

  useEffect(() => {
    loadRoute();
  }, [routeId]);

  const loadRoute = async () => {
    if (!routeId) {
      showErrorToast('ID de parcours manquant');
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      const route = await RoutesService.getRouteById(routeId);
      setRouteData(route);

      // Calculer la région de la carte pour afficher tout le parcours
      if (route.points && route.points.length > 0) {
        const latitudes = route.points.map((p) => p.latitude);
        const longitudes = route.points.map((p) => p.longitude);

        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const minLon = Math.min(...longitudes);
        const maxLon = Math.max(...longitudes);

        const latDelta = (maxLat - minLat) * 1.5 || 0.01;
        const lonDelta = (maxLon - minLon) * 1.5 || 0.01;

        setMapRegion({
          latitude: (minLat + maxLat) / 2,
          longitude: (minLon + maxLon) / 2,
          latitudeDelta: latDelta || 0.01,
          longitudeDelta: lonDelta || 0.01,
        });
      }
    } catch (error: any) {
      showErrorToast(error.message || 'Impossible de charger le parcours');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoute = async () => {
    if (!routeData) return;

    try {
      await RoutesService.saveRoute(routeData.id);
      showSuccessToast('Parcours sauvegardé !');
    } catch (error: any) {
      showErrorToast(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleShareRoute = () => {
    if (!routeData?.shareCode) {
      Alert.alert('Partage', 'Ce parcours n\'a pas de code de partage.');
      return;
    }

    Alert.alert(
      'Partager le parcours',
      `Code de partage: ${routeData.shareCode}\n\nPartagez ce code avec d'autres utilisateurs pour qu'ils puissent accéder à votre parcours.`,
      [{ text: 'OK' }]
    );
  };

  const handleStartRun = () => {
    if (!routeData) return;
    
    // Naviguer vers l'écran Activities avec le parcours
    navigation.navigate('Activities', { routeToFollow: routeData });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!routeData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Parcours non trouvé</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const coordinates = routeData.points?.map((p) => ({
    latitude: p.latitude,
    longitude: p.longitude,
  })) || [];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Carte */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={mapRegion}
            region={mapRegion}
            scrollEnabled
            zoomEnabled
          >
            {routeData.points && routeData.points.length > 0 && (
              <>
                {/* Point de départ */}
                <Marker
                  coordinate={{
                    latitude: routeData.points[0].latitude,
                    longitude: routeData.points[0].longitude,
                  }}
                  title="Départ"
                  pinColor="green"
                />
                {/* Point d'arrivée */}
                {routeData.points.length > 1 && (
                  <Marker
                    coordinate={{
                      latitude: routeData.points[routeData.points.length - 1].latitude,
                      longitude: routeData.points[routeData.points.length - 1].longitude,
                    }}
                    title="Arrivée"
                    pinColor="red"
                  />
                )}
                {/* Ligne du parcours */}
                {coordinates.length > 1 && (
                  <Polyline
                    coordinates={coordinates}
                    strokeColor={COLORS.primary}
                    strokeWidth={4}
                  />
                )}
              </>
            )}
          </MapView>
        </View>

        {/* Informations du parcours */}
        <View style={styles.infoContainer}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{routeData.title}</Text>
              {routeData.difficulty && (
                <View
                  style={[
                    styles.difficultyBadge,
                    {
                      backgroundColor:
                        routeData.difficulty === 'easy'
                          ? COLORS.success
                          : routeData.difficulty === 'medium'
                          ? '#FFA500'
                          : routeData.difficulty === 'hard'
                          ? COLORS.error
                          : '#8B0000',
                    },
                  ]}
                >
                  <Text style={styles.difficultyText}>
                    {routeData.difficulty === 'easy'
                      ? 'Facile'
                      : routeData.difficulty === 'medium'
                      ? 'Moyen'
                      : routeData.difficulty === 'hard'
                      ? 'Difficile'
                      : 'Expert'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {routeData.description && (
            <Text style={styles.description}>{routeData.description}</Text>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <MaterialCommunityIcons name="map-marker-distance" size={24} color={COLORS.primary} />
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>{routeData.distance.toFixed(2)} km</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
            </View>

            {routeData.durationEstimate && (
              <View style={styles.stat}>
                <MaterialCommunityIcons name="clock-outline" size={24} color={COLORS.primary} />
                <View style={styles.statInfo}>
                  <Text style={styles.statValue}>{routeData.durationEstimate} min</Text>
                  <Text style={styles.statLabel}>Durée estimée</Text>
                </View>
              </View>
            )}

            {routeData.points && (
              <View style={styles.stat}>
                <MaterialCommunityIcons name="map-marker" size={24} color={COLORS.primary} />
                <View style={styles.statInfo}>
                  <Text style={styles.statValue}>{routeData.points.length}</Text>
                  <Text style={styles.statLabel}>Points</Text>
                </View>
              </View>
            )}
          </View>

          {routeData.creatorName && (
            <View style={styles.creatorContainer}>
              <MaterialCommunityIcons name="account" size={20} color={COLORS.textLight} />
              <Text style={styles.creatorText}>Créé par {routeData.creatorName}</Text>
            </View>
          )}

          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.startRunButton]} 
              onPress={handleStartRun}
            >
              <MaterialCommunityIcons name="run" size={20} color="white" />
              <Text style={styles.actionButtonText}>Démarrer une course</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionsContainer}>
            {routeData.shareCode && (
              <TouchableOpacity style={styles.actionButton} onPress={handleShareRoute}>
                <MaterialCommunityIcons name="share-variant" size={20} color="white" />
                <Text style={styles.actionButtonText}>Partager</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.actionButton} onPress={handleSaveRoute}>
              <MaterialCommunityIcons name="bookmark" size={20} color="white" />
              <Text style={styles.actionButtonText}>Sauvegarder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  mapContainer: {
    height: 300,
    width: '100%',
  },
  map: {
    flex: 1,
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  description: {
    fontSize: 16,
    color: COLORS.textLight,
    lineHeight: 24,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  stat: {
    alignItems: 'center',
    gap: 8,
  },
  statInfo: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: '#f0f0f0',
  },
  creatorText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  startRunButton: {
    backgroundColor: COLORS.success,
    marginBottom: 12,
  },
});

