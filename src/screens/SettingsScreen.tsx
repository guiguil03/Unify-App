import React from "react";
import {
  View,
  Text,
  ScrollView,
  Switch,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSettings } from "../hooks/useSettings";
import { useAuth } from "../contexts/AuthContext";

export default function SettingsScreen() {
  const { settings, loading, updateSetting } = useSettings();
  const { signOut, user } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Déconnexion",
          onPress: () => signOut(),
          style: "destructive",
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E83D4D" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {user && (
        <View style={styles.userSection}>
          <Text style={styles.welcomeText}>Connecté en tant que</Text>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sécurité et confidentialité</Text>

        <View style={styles.setting}>
          <View style={styles.settingHeader}>
            <MaterialCommunityIcons
              name="account-group"
              size={24}
              color="#E83D4D"
            />
            <Text style={styles.settingTitle}>Recherche par genre</Text>
          </View>
          <Text style={styles.settingDescription}>
            Limiter la recherche aux personnes du même genre
          </Text>
          <Switch
            value={settings.sameGenderOnly}
            onValueChange={(value) => updateSetting("sameGenderOnly", value)}
            trackColor={{ false: "#767577", true: "#E83D4D" }}
          />
        </View>

        <View style={styles.setting}>
          <View style={styles.settingHeader}>
            <MaterialCommunityIcons
              name="map-marker-radius"
              size={24}
              color="#E83D4D"
            />
            <Text style={styles.settingTitle}>Masquer ma position exacte</Text>
          </View>
          <Text style={styles.settingDescription}>
            Afficher une zone approximative plutôt que ma position précise
          </Text>
          <Switch
            value={settings.hideExactLocation}
            onValueChange={(value) => updateSetting("hideExactLocation", value)}
            trackColor={{ false: "#767577", true: "#E83D4D" }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Préférences de course</Text>

        <View style={styles.setting}>
          <View style={styles.settingHeader}>
            <MaterialCommunityIcons
              name="speedometer"
              size={24}
              color="#E83D4D"
            />
            <Text style={styles.settingTitle}>Allure similaire</Text>
          </View>
          <Text style={styles.settingDescription}>
            Afficher uniquement les coureurs avec une allure proche de la mienne
            (±1 min/km)
          </Text>
          <Switch
            value={settings.similarPaceOnly}
            onValueChange={(value) => updateSetting("similarPaceOnly", value)}
            trackColor={{ false: "#767577", true: "#E83D4D" }}
          />
        </View>

        <View style={styles.setting}>
          <View style={styles.settingHeader}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={24}
              color="#E83D4D"
            />
            <Text style={styles.settingTitle}>Horaires similaires</Text>
          </View>
          <Text style={styles.settingDescription}>
            Afficher les coureurs actifs aux mêmes horaires que moi
          </Text>
          <Switch
            value={settings.similarSchedule}
            onValueChange={(value) => updateSetting("similarSchedule", value)}
            trackColor={{ false: "#767577", true: "#E83D4D" }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>

        <View style={styles.setting}>
          <View style={styles.settingHeader}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={24}
              color="#E83D4D"
            />
            <Text style={styles.settingTitle}>Coureurs à proximité</Text>
          </View>
          <Text style={styles.settingDescription}>
            M'alerter quand des coureurs correspondant à mes critères sont
            proches
          </Text>
          <Switch
            value={settings.nearbyRunnersNotifications}
            onValueChange={(value) =>
              updateSetting("nearbyRunnersNotifications", value)
            }
            trackColor={{ false: "#767577", true: "#E83D4D" }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compte</Text>
        
        {user ? (
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
          >
            <MaterialCommunityIcons name="logout" size={24} color="white" />
            <Text style={styles.logoutButtonText}>Déconnexion</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: '#4285F4' }]} 
            onPress={() => signOut()} // Retour à l'écran de login
          >
            <MaterialCommunityIcons name="login" size={24} color="white" />
            <Text style={styles.logoutButtonText}>Se connecter</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  userSection: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#f9f9f9",
  },
  welcomeText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  userName: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 16,
    color: "#666",
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
  },
  setting: {
    marginBottom: 24,
  },
  settingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  settingDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  logoutButton: {
    backgroundColor: "#E83D4D",
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
