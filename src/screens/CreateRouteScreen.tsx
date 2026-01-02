import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RoutesService } from '../services/RoutesService';
import { SubscriptionService } from '../services/SubscriptionService';
import { useLocation } from '../hooks/useLocation';
import { COLORS } from '../constants/colors';
import { showErrorToast, showSuccessToast } from '../utils/errorHandler';
import { RouteDifficulty, CreateRouteData } from '../types/route';
import { calculateDistance } from '../utils/map/distance';

export default function CreateRouteScreen() {
  const navigation = useNavigation();
  const { location } = useLocation();
  const mapRef = useRef<MapView>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<RouteDifficulty>('medium');
  const [isPublic, setIsPublic] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [routePoints, setRoutePoints] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapRegion, setMapRegion] = useState<any>(null);
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });
  const [mapPosition, setMapPosition] = useState({ x: 0, y: 0 });
  const drawingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mapContainerRef = useRef<View>(null);

  useEffect(() => {
    checkPremium();
    if (location) {
      const region = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setMapRegion(region);
    }
  }, [location]);

  // Fonction pour convertir les coordonnées de l'écran en coordonnées géographiques
  const screenToCoordinate = (x: number, y: number, region: any, width: number, height: number) => {
    try {
      if (!region || width === 0 || height === 0) {
        console.log('screenToCoordinate: paramètres invalides', { region: !!region, width, height });
        return null;
      }
      
      if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) {
        console.log('screenToCoordinate: coordonnées invalides', { x, y });
        return null;
      }
      
      // Calculer la latitude et longitude à partir des coordonnées de l'écran
      // La latitude diminue vers le bas (y augmente)
      // La longitude augmente vers la droite (x augmente)
      const latitude = region.latitude - ((y - height / 2) / height) * region.latitudeDelta;
      const longitude = region.longitude + ((x - width / 2) / width) * region.longitudeDelta;
      
      if (isNaN(latitude) || isNaN(longitude)) {
        console.log('screenToCoordinate: résultat invalide', { latitude, longitude });
        return null;
      }
      
      return { latitude, longitude };
    } catch (error) {
      console.error('Erreur dans screenToCoordinate:', error);
      return null;
    }
  };

  // Fonction pour obtenir les coordonnées géographiques depuis les coordonnées de l'écran
  const getCoordinateFromScreenPoint = async (x: number, y: number) => {
    if (!mapRegion || mapDimensions.width === 0 || mapDimensions.height === 0) return null;

    // Calcul manuel des coordonnées géographiques
    // Les coordonnées x, y sont relatives au conteneur de la carte
    return screenToCoordinate(x, y, mapRegion, mapDimensions.width, mapDimensions.height);
  };

  // Utiliser onPress de MapView pour capturer les coordonnées directement
  const handleMapPressInDrawingMode = (event: any) => {
    if (!isDrawing) return;
    
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const newPoint = { latitude, longitude };
    
    if (lastPoint) {
      const distance = calculateDistance(
        lastPoint.latitude,
        lastPoint.longitude,
        latitude,
        longitude
      );
      
      if (distance >= 0.003) {
        setRoutePoints((prev) => [...prev, newPoint]);
        setLastPoint(newPoint);
      }
    } else {
      setRoutePoints((prev) => [...prev, newPoint]);
      setLastPoint(newPoint);
    }
  };


  // Gesture pour le glissement - version simplifiée et sécurisée
  const panGesture = React.useMemo(() => {
    if (!isDrawing) {
      return Gesture.Pan().enabled(false);
    }
    
    return Gesture.Pan()
      .minPointers(1)
      .maxPointers(1)
      .onStart((event) => {
        try {
          if (!mapRegion || !mapRegion.latitude || !mapRegion.longitude || 
              mapDimensions.width === 0 || mapDimensions.height === 0) {
            return;
          }
          
          const x = event.x;
          const y = event.y;
          
          if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) {
            return;
          }
          
          const coordinate = screenToCoordinate(x, y, mapRegion, mapDimensions.width, mapDimensions.height);
          if (coordinate && typeof coordinate.latitude === 'number' && typeof coordinate.longitude === 'number' &&
              !isNaN(coordinate.latitude) && !isNaN(coordinate.longitude)) {
            const newPoint = { latitude: coordinate.latitude, longitude: coordinate.longitude };
            setRoutePoints((prev) => [...prev, newPoint]);
            setLastPoint(newPoint);
          }
        } catch (error: any) {
          const errorMsg = error?.message || String(error) || 'Erreur inconnue';
          console.error('Erreur dans onStart:', errorMsg);
        }
      })
      .onUpdate((event) => {
        try {
          if (!mapRegion || !mapRegion.latitude || !mapRegion.longitude || 
              mapDimensions.width === 0 || mapDimensions.height === 0) {
            return;
          }
          
          const x = event.x;
          const y = event.y;
          
          if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) {
            return;
          }
          
          const coordinate = screenToCoordinate(x, y, mapRegion, mapDimensions.width, mapDimensions.height);
          if (coordinate && typeof coordinate.latitude === 'number' && typeof coordinate.longitude === 'number' &&
              !isNaN(coordinate.latitude) && !isNaN(coordinate.longitude)) {
            setLastPoint((prevLastPoint) => {
              if (prevLastPoint) {
                const distance = calculateDistance(
                  prevLastPoint.latitude,
                  prevLastPoint.longitude,
                  coordinate.latitude,
                  coordinate.longitude
                );
                
                if (distance >= 0.003) {
                  const newPoint = { latitude: coordinate.latitude, longitude: coordinate.longitude };
                  setRoutePoints((prev) => [...prev, newPoint]);
                  return newPoint;
                }
                return prevLastPoint;
              } else {
                const newPoint = { latitude: coordinate.latitude, longitude: coordinate.longitude };
                setRoutePoints((prev) => [...prev, newPoint]);
                return newPoint;
              }
            });
          }
        } catch (error: any) {
          const errorMsg = error?.message || String(error) || 'Erreur inconnue';
          console.error('Erreur dans onUpdate:', errorMsg);
        }
      })
      .onEnd(() => {
        setLastPoint(null);
      });
  }, [isDrawing, mapRegion, mapDimensions.width, mapDimensions.height]);

  // Nettoyer l'interval quand on quitte le mode dessin
  useEffect(() => {
    if (!isDrawing) {
      if (drawingIntervalRef.current) {
        clearInterval(drawingIntervalRef.current);
        drawingIntervalRef.current = null;
      }
      setLastPoint(null);
    }
    
    return () => {
      if (drawingIntervalRef.current) {
        clearInterval(drawingIntervalRef.current);
      }
    };
  }, [isDrawing]);

  const checkPremium = async () => {
    try {
      const premium = await SubscriptionService.isPremium();
      setIsPremium(premium);
      if (!premium) {
        Alert.alert(
          'Fonctionnalité Premium',
          'La création de parcours est réservée aux utilisateurs premium. Passez à Premium pour créer et partager vos parcours.',
          [
            { text: 'Annuler', onPress: () => navigation.goBack() },
            { text: 'Voir Premium', onPress: () => navigation.navigate('Profile' as never) },
          ]
        );
      }
    } catch (error) {
      console.error('Erreur vérification premium:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = (event: any) => {
    if (!isPremium) return;

    if (isDrawing) {
      // En mode dessin, utiliser la fonction spéciale
      handleMapPressInDrawingMode(event);
    } else {
      // En mode normal, on ajoute juste un point
      const { latitude, longitude } = event.nativeEvent.coordinate;
      setRoutePoints((prev) => [...prev, { latitude, longitude }]);
    }
  };

  const handleRegionChangeComplete = (region: any) => {
    setMapRegion(region);
  };

  const handleMapLayout = (event: any) => {
    const { width, height, x, y } = event.nativeEvent.layout;
    setMapDimensions({ width, height });
    setMapPosition({ x, y });
  };

  const handleClearRoute = () => {
    Alert.alert('Effacer le parcours', 'Voulez-vous effacer tous les points du parcours ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Effacer', style: 'destructive', onPress: () => setRoutePoints([]) },
    ]);
  };

  const handleRemoveLastPoint = () => {
    setRoutePoints((prev) => prev.slice(0, -1));
  };

  const calculateRouteDistance = (): number => {
    if (routePoints.length < 2) return 0;
    let totalDistance = 0;
    for (let i = 0; i < routePoints.length - 1; i++) {
      totalDistance += calculateDistance(
        routePoints[i].latitude,
        routePoints[i].longitude,
        routePoints[i + 1].latitude,
        routePoints[i + 1].longitude
      );
    }
    return totalDistance;
  };

  const handleSave = async () => {
    if (!isPremium) {
      showErrorToast('Fonctionnalité réservée aux utilisateurs premium');
      return;
    }

    if (!title.trim()) {
      showErrorToast('Veuillez donner un titre au parcours');
      return;
    }

    if (routePoints.length < 2) {
      showErrorToast('Veuillez tracer au moins 2 points sur la carte');
      return;
    }

    try {
      setSaving(true);

      const distance = calculateRouteDistance();
      const routeData: CreateRouteData = {
        title: title.trim(),
        description: description.trim() || undefined,
        distance: Math.round(distance * 100) / 100, // Arrondir à 2 décimales
        difficulty,
        isPublic,
        isShared,
        points: routePoints,
      };

      const route = await RoutesService.createRoute(routeData);

      showSuccessToast('Parcours créé avec succès !');
      
      if (route.shareCode) {
        Alert.alert(
          'Parcours créé',
          `Votre parcours a été créé !\n\nCode de partage: ${route.shareCode}\n\nVous pouvez partager ce code avec d'autres utilisateurs.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('Erreur création parcours:', error);
      showErrorToast(error.message || 'Erreur lors de la création du parcours');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!isPremium) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Créer un parcours</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.premiumRequired}>
          <MaterialCommunityIcons name="crown" size={64} color="#FFD700" />
          <Text style={styles.premiumText}>Fonctionnalité Premium</Text>
          <Text style={styles.premiumSubtext}>
            Passez à Premium pour créer et partager vos parcours personnalisés
          </Text>
          <TouchableOpacity
            style={styles.premiumButton}
            onPress={() => navigation.navigate('Profile' as never)}
          >
            <Text style={styles.premiumButtonText}>Voir Premium</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const distance = calculateRouteDistance();
  const coordinates = routePoints.map((p) => ({
    latitude: p.latitude,
    longitude: p.longitude,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Créer un parcours</Text>
        <TouchableOpacity 
          style={[styles.headerButton, (!title.trim() || routePoints.length < 2) && styles.headerButtonDisabled]}
          onPress={handleSave} 
          disabled={saving || !title.trim() || routePoints.length < 2}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <MaterialCommunityIcons name="check" size={24} color={(!title.trim() || routePoints.length < 2) ? COLORS.textLight : COLORS.primary} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer} ref={mapContainerRef}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={
            location
              ? {
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }
              : undefined
          }
          region={mapRegion}
          onPress={handleMapPress}
          onRegionChangeComplete={handleRegionChangeComplete}
          onLayout={handleMapLayout}
          scrollEnabled={!isDrawing}
          zoomEnabled={!isDrawing}
          pitchEnabled={!isDrawing}
          rotateEnabled={!isDrawing}
        >
          {routePoints.length > 0 && (
            <>
              {routePoints.map((point, index) => (
                <Marker
                  key={index}
                  coordinate={point}
                  title={index === 0 ? 'Départ' : index === routePoints.length - 1 ? 'Arrivée' : `Point ${index + 1}`}
                />
              ))}
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
        
        {/* Overlay pour capturer les gestes de glissement */}
        {isDrawing && (
          <GestureDetector gesture={panGesture}>
            <View 
              style={StyleSheet.absoluteFill} 
              pointerEvents="box-only"
              onLayout={(event) => {
                const { x, y, width, height } = event.nativeEvent.layout;
                // Les coordonnées du geste sont déjà relatives à ce View
              }}
            />
          </GestureDetector>
        )}
        
        {/* Instructions pour le mode dessin */}
        {isDrawing && (
          <View style={styles.drawingHint}>
            <View style={styles.drawingHintIcon}>
              <MaterialCommunityIcons name="gesture" size={18} color="white" />
            </View>
            <Text style={styles.drawingHintText}>
              Glissez votre doigt sur la carte
            </Text>
          </View>
        )}

        {/* Contrôles de la carte */}
        <View style={styles.mapControls}>
          <TouchableOpacity
            style={[styles.mapButton, isDrawing && styles.mapButtonActive]}
            onPress={() => setIsDrawing(!isDrawing)}
          >
            <MaterialCommunityIcons
              name={isDrawing ? 'pencil-off' : 'pencil'}
              size={22}
              color={isDrawing ? 'white' : COLORS.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.mapButton, routePoints.length === 0 && styles.mapButtonDisabled]} 
            onPress={handleRemoveLastPoint} 
            disabled={routePoints.length === 0}
          >
            <MaterialCommunityIcons
              name="undo"
              size={22}
              color={routePoints.length === 0 ? COLORS.textLight : COLORS.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.mapButton, routePoints.length === 0 && styles.mapButtonDisabled]} 
            onPress={handleClearRoute} 
            disabled={routePoints.length === 0}
          >
            <MaterialCommunityIcons
              name="delete-outline"
              size={22}
              color={routePoints.length === 0 ? COLORS.textLight : COLORS.error}
            />
          </TouchableOpacity>
        </View>

        {/* Info du parcours */}
        {routePoints.length > 0 && (
          <View style={styles.routeInfo}>
            <View style={styles.routeInfoRow}>
              <MaterialCommunityIcons name="map-marker-path" size={18} color={COLORS.primary} />
              <Text style={styles.routeInfoText}>
                {routePoints.length} point{routePoints.length > 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.routeInfoDivider} />
            <View style={styles.routeInfoRow}>
              <MaterialCommunityIcons name="map-marker-distance" size={18} color={COLORS.primary} />
              <Text style={styles.routeInfoText}>{distance.toFixed(2)} km</Text>
            </View>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.form} 
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Titre *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Parcours du centre-ville"
              placeholderTextColor={COLORS.textLight}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Décrivez votre parcours..."
              placeholderTextColor={COLORS.textLight}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Difficulté</Text>
            <View style={styles.difficultyButtons}>
              {(['easy', 'medium', 'hard', 'expert'] as RouteDifficulty[]).map((diff) => (
                <TouchableOpacity
                  key={diff}
                  style={[
                    styles.difficultyButton,
                    difficulty === diff && styles.difficultyButtonActive,
                  ]}
                  onPress={() => setDifficulty(diff)}
                >
                  <Text
                    style={[
                      styles.difficultyButtonText,
                      difficulty === diff && styles.difficultyButtonTextActive,
                    ]}
                  >
                    {diff === 'easy' ? 'Facile' : diff === 'medium' ? 'Moyen' : diff === 'hard' ? 'Difficile' : 'Expert'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <TouchableOpacity
              style={styles.switchRow}
              onPress={() => setIsPublic(!isPublic)}
              activeOpacity={0.7}
            >
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Parcours public</Text>
                <Text style={styles.switchDescription}>
                  Visible par tous les utilisateurs
                </Text>
              </View>
              <View style={[styles.switchContainer, isPublic && styles.switchContainerActive]}>
                <View style={[styles.switchThumb, isPublic && styles.switchThumbActive]} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <TouchableOpacity
              style={styles.switchRow}
              onPress={() => setIsShared(!isShared)}
              activeOpacity={0.7}
            >
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Partager le parcours</Text>
                <Text style={styles.switchDescription}>
                  Générer un code de partage
                </Text>
              </View>
              <View style={[styles.switchContainer, isShared && styles.switchContainerActive]}>
                <View style={[styles.switchThumb, isShared && styles.switchThumbActive]} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, (saving || !title.trim() || routePoints.length < 2) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving || !title.trim() || routePoints.length < 2}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <MaterialCommunityIcons name="check-circle" size={22} color="white" />
              <Text style={styles.saveButtonText}>Enregistrer le parcours</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    position: 'relative',
    top: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerButton: {
    padding: 4,
    borderRadius: 8,
  },
  headerButtonDisabled: {
    opacity: 0.3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  mapContainer: {
    height: 240,
    position: 'relative',
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    top: 12,
    right: 12,
    gap: 10,
  },
  mapButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  mapButtonActive: {
    backgroundColor: COLORS.primary,
  },
  mapButtonDisabled: {
    opacity: 0.4,
  },
  routeInfo: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  routeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeInfoDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
  },
  routeInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 16,
    paddingTop: 20,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  input: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  difficultyButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  difficultyButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  difficultyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  difficultyButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundLight,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18,
  },
  switchContainer: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchContainerActive: {
    backgroundColor: COLORS.primary,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    transform: [{ translateX: 22 }],
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    gap: 10,
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  premiumRequired: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: COLORS.backgroundLight,
  },
  premiumText: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 10,
  },
  premiumSubtext: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  premiumButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  premiumButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  drawingHint: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    gap: 10,
  },
  drawingHintIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawingHintText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    flex: 1,
  },
});

