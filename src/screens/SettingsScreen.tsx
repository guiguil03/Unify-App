import React, { useState, useEffect } from "react";
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
import { IdentityVerificationModal } from "../components/identity/IdentityVerificationModal";
import { IdentityVerificationService } from "../services/IdentityVerificationService";
import { IdentityVerification } from "../types/identityVerification";
import { COLORS } from "../constants/colors";

export default function SettingsScreen() {
  const { settings, loading, updateSetting } = useSettings();
  const { signOut, user } = useAuth();
  const [verification, setVerification] = useState<IdentityVerification | null>(null);
  const [loadingVerification, setLoadingVerification] = useState(true);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  useEffect(() => {
    loadVerification();
  }, []);

  const loadVerification = async () => {
    try {
      setLoadingVerification(true);
      const verif = await IdentityVerificationService.getVerification();
      setVerification(verif);
    } catch (error) {
      console.error('Erreur lors du chargement de la vérification:', error);
    } finally {
      setLoadingVerification(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'verified':
        return COLORS.success;
      case 'rejected':
        return COLORS.error;
      case 'pending':
        return '#FFA500';
      default:
        return '#999';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'verified':
        return 'Vérifié';
      case 'rejected':
        return 'Rejeté';
      case 'pending':
        return 'En attente';
      default:
        return 'Non vérifié';
    }
  };

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
        <ActivityIndicator size="large" color="#7D80F4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {user && (
          <View style={styles.userSection}>
            <Text style={styles.welcomeText}>Connecté en tant que</Text>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sécurité et confidentialité</Text>

        {/* Vérification d'identité */}
        <View style={styles.setting}>
          <View style={styles.settingHeader}>
            <MaterialCommunityIcons
              name="shield-check"
              size={24}
              color="#7D80F4"
            />
            <Text style={styles.settingTitle}>Vérification d'identité</Text>
          </View>
          <Text style={styles.settingDescription}>
            Vérifiez votre identité pour renforcer la sécurité de la communauté
          </Text>
          {loadingVerification ? (
            <ActivityIndicator size="small" color="#7D80F4" style={{ marginTop: 12 }} />
          ) : (
            <View style={styles.verificationContainer}>
              <View style={styles.verificationStatus}>
                <View
                  style={[
                    styles.statusIndicator,
                    { backgroundColor: getStatusColor(verification?.status) },
                  ]}
                />
                <Text style={styles.statusText}>
                  {getStatusText(verification?.status)}
                </Text>
              </View>
              {verification?.rejectionReason && (
                <Text style={styles.rejectionReason}>
                  Raison: {verification.rejectionReason}
                </Text>
              )}
              <TouchableOpacity
                style={styles.verificationButton}
                onPress={() => setShowVerificationModal(true)}
              >
                <MaterialCommunityIcons
                  name={verification ? "pencil" : "upload"}
                  size={20}
                  color="white"
                />
                <Text style={styles.verificationButtonText}>
                  {verification ? "Mettre à jour" : "Vérifier mon identité"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.setting}>
          <View style={styles.settingHeader}>
            <MaterialCommunityIcons
              name="account-group"
              size={24}
              color="#7D80F4"
            />
            <Text style={styles.settingTitle}>Recherche par genre</Text>
          </View>
          <Text style={styles.settingDescription}>
            Limiter la recherche aux personnes du même genre
          </Text>
          <Switch
            value={settings.sameGenderOnly}
            onValueChange={(value) => updateSetting("sameGenderOnly", value)}
            trackColor={{ false: "#767577", true: "#7D80F4" }}
          />
        </View>

        <View style={styles.setting}>
          <View style={styles.settingHeader}>
            <MaterialCommunityIcons
              name="map-marker-radius"
              size={24}
              color="#7D80F4"
            />
            <Text style={styles.settingTitle}>Masquer ma position exacte</Text>
          </View>
          <Text style={styles.settingDescription}>
            Afficher une zone approximative plutôt que ma position précise
          </Text>
          <Switch
            value={settings.hideExactLocation}
            onValueChange={(value) => updateSetting("hideExactLocation", value)}
            trackColor={{ false: "#767577", true: "#7D80F4" }}
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
              color="#7D80F4"
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
            trackColor={{ false: "#767577", true: "#7D80F4" }}
          />
        </View>

        <View style={styles.setting}>
          <View style={styles.settingHeader}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={24}
              color="#7D80F4"
            />
            <Text style={styles.settingTitle}>Horaires similaires</Text>
          </View>
          <Text style={styles.settingDescription}>
            Afficher les coureurs actifs aux mêmes horaires que moi
          </Text>
          <Switch
            value={settings.similarSchedule}
            onValueChange={(value) => updateSetting("similarSchedule", value)}
            trackColor={{ false: "#767577", true: "#7D80F4" }}
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
              color="#7D80F4"
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
            trackColor={{ false: "#767577", true: "#7D80F4" }}
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

      <IdentityVerificationModal
        visible={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onSuccess={() => {
          loadVerification();
        }}
      />
    </View>
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
    backgroundColor: "#7D80F4",
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
  verificationContainer: {
    marginTop: 12,
  },
  verificationStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  rejectionReason: {
    fontSize: 12,
    color: COLORS.error,
    marginBottom: 12,
    fontStyle: "italic",
  },
  verificationButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  verificationButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
