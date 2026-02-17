import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Animated,
  ScrollView,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Settings } from "../../types/settings";
import { COLORS } from "../../constants/colors";

const SCREEN_HEIGHT = Dimensions.get('window').height;
const MAX_FILTERS_HEIGHT = SCREEN_HEIGHT * 0.5; // Maximum 50% de l'écran

interface MapFiltersProps {
  settings: Settings;
  onSettingChange: (key: keyof Settings, value: boolean) => void;
  style?: any;
}

export function MapFilters({ settings, onSettingChange, style }: MapFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;
    Animated.spring(animation, {
      toValue,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
    setIsExpanded(!isExpanded);
  };

  const heightInterpolate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [50, MAX_FILTERS_HEIGHT], // Hauteur minimale et maximale dynamique
  });

  const iconRotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <Animated.View style={[styles.container, style, { height: heightInterpolate }]}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <MaterialCommunityIcons
            name="filter-variant"
            size={24}
            color={COLORS.primary}
          />
          <Text style={styles.headerText}>Filtres de recherche</Text>
          <Animated.View style={{ transform: [{ rotate: iconRotation }] }}>
            <MaterialCommunityIcons
              name="chevron-down"
              size={24}
              color={COLORS.textSecondary}
            />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.filtersContent}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {/* Section: Recherche par genre */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Sécurité et confidentialité</Text>
            
            <View style={styles.filterRow}>
              <View style={styles.filterInfo}>
                <MaterialCommunityIcons
                  name="gender-male-female"
                  size={20}
                  color={COLORS.textSecondary}
                />
                <View style={styles.filterTextContainer}>
                  <Text style={styles.filterLabel}>Même genre uniquement</Text>
                  <Text style={styles.filterDescription}>
                    Limiter la recherche aux personnes du même genre
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.sameGenderOnly}
                onValueChange={(value) => onSettingChange("sameGenderOnly", value)}
                trackColor={{ false: "#ddd", true: COLORS.primary + "80" }}
                thumbColor={settings.sameGenderOnly ? COLORS.primary : "#f4f3f4"}
              />
            </View>

            <View style={styles.filterRow}>
              <View style={styles.filterInfo}>
                <MaterialCommunityIcons
                  name="map-marker-radius"
                  size={20}
                  color={COLORS.textSecondary}
                />
                <View style={styles.filterTextContainer}>
                  <Text style={styles.filterLabel}>Masquer ma position exacte</Text>
                  <Text style={styles.filterDescription}>
                    Afficher une zone approximative plutôt que ma position précise
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.hideExactLocation}
                onValueChange={(value) => onSettingChange("hideExactLocation", value)}
                trackColor={{ false: "#ddd", true: COLORS.primary + "80" }}
                thumbColor={settings.hideExactLocation ? COLORS.primary : "#f4f3f4"}
              />
            </View>
          </View>

          {/* Section: Préférences de course */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Préférences de course</Text>
            
            <View style={styles.filterRow}>
              <View style={styles.filterInfo}>
                <MaterialCommunityIcons
                  name="speedometer"
                  size={20}
                  color={COLORS.textSecondary}
                />
                <View style={styles.filterTextContainer}>
                  <Text style={styles.filterLabel}>Allure similaire</Text>
                  <Text style={styles.filterDescription}>
                    Afficher uniquement les coureur(se)s avec une allure proche (±1 min/km)
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.similarPaceOnly}
                onValueChange={(value) => onSettingChange("similarPaceOnly", value)}
                trackColor={{ false: "#ddd", true: COLORS.primary + "80" }}
                thumbColor={settings.similarPaceOnly ? COLORS.primary : "#f4f3f4"}
              />
            </View>

            <View style={styles.filterRow}>
              <View style={styles.filterInfo}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={20}
                  color={COLORS.textSecondary}
                />
                <View style={styles.filterTextContainer}>
                  <Text style={styles.filterLabel}>Horaires similaires</Text>
                  <Text style={styles.filterDescription}>
                    Afficher les coureur(se)s actif(ve)s aux mêmes horaires que moi
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.similarSchedule}
                onValueChange={(value) => onSettingChange("similarSchedule", value)}
                trackColor={{ false: "#ddd", true: COLORS.primary + "80" }}
                thumbColor={settings.similarSchedule ? COLORS.primary : "#f4f3f4"}
              />
            </View>
          </View>

          {/* Section: Notifications */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            
            <View style={styles.filterRow}>
              <View style={styles.filterInfo}>
                <MaterialCommunityIcons
                  name="bell-outline"
                  size={20}
                  color={COLORS.textSecondary}
                />
                <View style={styles.filterTextContainer}>
                  <Text style={styles.filterLabel}>Coureur(se)s à proximité</Text>
                  <Text style={styles.filterDescription}>
                    M'alerter quand des coureur(se)s correspondant à mes critères sont proches
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.nearbyRunnersNotifications}
                onValueChange={(value) => onSettingChange("nearbyRunnersNotifications", value)}
                trackColor={{ false: "#ddd", true: COLORS.primary + "80" }}
                thumbColor={settings.nearbyRunnersNotifications ? COLORS.primary : "#f4f3f4"}
              />
            </View>
          </View>
        </ScrollView>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 92, // Positionné sous la SearchBar (top: 20 + hauteur 48px + marge 32px)
    left: 10,
    width: '66%', // Réduit à 60% de la largeur pour laisser de l'espace aux contrôles à droite
    maxWidth: 280, // Largeur maximale pour les grands écrans
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10, // Élévation plus élevée pour être au-dessus de tout
    zIndex: 10, // zIndex élevé pour être au-dessus de la SearchBar et des résultats
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  scrollView: {
    maxHeight: MAX_FILTERS_HEIGHT - 60, // Hauteur maximale moins le header
  },
  filtersContent: {
    padding: 16,
    gap: 20,
    paddingBottom: 20,
  },
  filterSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  filterInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  filterTextContainer: {
    flex: 1,
    gap: 4,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
  },
  filterDescription: {
    fontSize: 12,
    color: COLORS.textLight,
    lineHeight: 16,
  },
});
