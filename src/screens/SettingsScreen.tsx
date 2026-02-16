import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Switch,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Animated,
  Linking,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSettings } from "../hooks/useSettings";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "../types/navigation";
import { IdentityVerificationModal } from "../components/identity/IdentityVerificationModal";
import { IdentityVerificationService } from "../services/IdentityVerificationService";
import { IdentityVerification } from "../types/identityVerification";
import { COLORS } from "../constants/colors";

export default function SettingsScreen() {
  const { settings, loading, updateSetting } = useSettings();
  const { signOut, user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [verification, setVerification] = useState<IdentityVerification | null>(null);
  const [loadingVerification, setLoadingVerification] = useState(true);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadVerification();
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
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

  const handleDeleteAccount = () => {
    Alert.alert(
      "Supprimer le compte",
      "Cette action est irréversible. Toutes vos données seront supprimées définitivement.",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          onPress: () => {
            // TODO: Implémenter la suppression du compte
            Alert.alert("Information", "Cette fonctionnalité sera bientôt disponible.");
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      "Exporter mes données",
      "Un email contenant toutes vos données sera envoyé sous peu.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Exporter",
          onPress: () => {
            // TODO: Implémenter l'export des données
            Alert.alert("Information", "Cette fonctionnalité sera bientôt disponible.");
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const SettingCard = ({ 
    icon, 
    title, 
    description, 
    value, 
    onValueChange, 
    children,
    onPress,
    showArrow = false 
  }: any) => (
    <TouchableOpacity
      style={styles.settingCard}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.settingCardContent}>
        <View style={styles.settingIconContainer}>
          <MaterialCommunityIcons name={icon} size={24} color={COLORS.primary} />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {description && (
            <Text style={styles.settingDescription}>{description}</Text>
          )}
        </View>
        {onValueChange !== undefined ? (
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: "#E0E0E0", true: COLORS.primary + "80" }}
            thumbColor={value ? COLORS.primary : "#f4f3f4"}
            ios_backgroundColor="#E0E0E0"
          />
        ) : showArrow ? (
          <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
        ) : null}
      </View>
      {children}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header utilisateur */}
        <Animated.View
          style={[
            styles.userSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {user?.avatar ? (
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <MaterialCommunityIcons name="account" size={40} color={COLORS.primary} />
              </View>
            </View>
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="account-circle" size={64} color={COLORS.primary} />
            </View>
          )}
          <Text style={styles.userName}>{user?.name || "Utilisateur"}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="pencil" size={16} color={COLORS.primary} />
            <Text style={styles.editProfileText}>Modifier le profil</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Vérification d'identité */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Sécurité</Text>
          <View style={styles.settingCard}>
            <View style={styles.settingCardContent}>
              <View style={styles.settingIconContainer}>
                <MaterialCommunityIcons name="shield-check" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Vérification d'identité</Text>
                <Text style={styles.settingDescription}>
                  Renforcez la sécurité de la communauté
                </Text>
              </View>
            </View>
            {loadingVerification ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 12 }} />
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
                    {verification.rejectionReason}
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.verificationButton}
                  onPress={() => setShowVerificationModal(true)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={verification ? "pencil" : "upload"}
                    size={18}
                    color="white"
                  />
                  <Text style={styles.verificationButtonText}>
                    {verification ? "Mettre à jour" : "Vérifier mon identité"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Confidentialité */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Confidentialité</Text>
          <SettingCard
            icon="account-group"
            title="Recherche par genre"
            description="Limiter la recherche aux personnes du même genre"
            value={settings.sameGenderOnly}
            onValueChange={(value: boolean) => updateSetting("sameGenderOnly", value)}
          />
          <SettingCard
            icon="map-marker-radius"
            title="Masquer ma position exacte"
            description="Afficher une zone approximative plutôt que ma position précise"
            value={settings.hideExactLocation}
            onValueChange={(value: boolean) => updateSetting("hideExactLocation", value)}
          />
        </Animated.View>

        {/* Préférences de course */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Préférences de course</Text>
          <SettingCard
            icon="speedometer"
            title="Allure similaire"
            description="Afficher uniquement les coureurs avec une allure proche (±1 min/km)"
            value={settings.similarPaceOnly}
            onValueChange={(value: boolean) => updateSetting("similarPaceOnly", value)}
          />
          <SettingCard
            icon="clock-outline"
            title="Horaires similaires"
            description="Afficher les coureurs actifs aux mêmes horaires que moi"
            value={settings.similarSchedule}
            onValueChange={(value: boolean) => updateSetting("similarSchedule", value)}
          />
        </Animated.View>

        {/* Notifications */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Notifications</Text>
          <SettingCard
            icon="bell-outline"
            title="Coureurs à proximité"
            description="M'alerter quand des coureurs correspondant à mes critères sont proches"
            value={settings.nearbyRunnersNotifications}
            onValueChange={(value: boolean) =>
              updateSetting("nearbyRunnersNotifications", value)
            }
          />
        </Animated.View>

        {/* Application */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Application</Text>
          <SettingCard
            icon="information-outline"
            title="À propos"
            description="Version 1.0.0"
            showArrow
            onPress={() => Alert.alert("Unify", "Version 1.0.0\n\nApplication de running sociale")}
          />
          <SettingCard
            icon="help-circle-outline"
            title="Aide et support"
            description="FAQ et assistance"
            showArrow
            onPress={() => Alert.alert("Aide", "Contactez-nous à support@unify.app")}
          />
          <SettingCard
            icon="file-document-outline"
            title="Conditions d'utilisation"
            description="Lire les conditions"
            showArrow
            onPress={() => Alert.alert("Conditions", "Les conditions d'utilisation seront disponibles prochainement.")}
          />
          <SettingCard
            icon="shield-lock-outline"
            title="Politique de confidentialité"
            description="Comment nous protégeons vos données"
            showArrow
            onPress={() => Alert.alert("Confidentialité", "Notre politique de confidentialité sera disponible prochainement.")}
          />
        </Animated.View>

        {/* Données */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Données</Text>
          <SettingCard
            icon="download-outline"
            title="Exporter mes données"
            description="Télécharger une copie de toutes vos données"
            showArrow
            onPress={handleExportData}
          />
          <SettingCard
            icon="delete-outline"
            title="Supprimer mon compte"
            description="Supprimer définitivement votre compte et toutes vos données"
            showArrow
            onPress={handleDeleteAccount}
          />
        </Animated.View>

        {/* Compte */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {user ? (
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="logout" size={20} color="white" />
              <Text style={styles.logoutButtonText}>Déconnexion</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.logoutButton, styles.loginButton]}
              onPress={() => signOut()}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="login" size={20} color="white" />
              <Text style={styles.logoutButtonText}>Se connecter</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        <View style={styles.bottomSpace} />
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
    backgroundColor: COLORS.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.backgroundLight,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  userSection: {
    backgroundColor: COLORS.background,
    padding: 24,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPlaceholder: {
    marginBottom: 12,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 15,
    color: COLORS.textLight,
    marginBottom: 16,
  },
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  settingCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18,
  },
  verificationContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  verificationStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
  },
  rejectionReason: {
    fontSize: 12,
    color: COLORS.error,
    marginBottom: 12,
    fontStyle: "italic",
  },
  verificationButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
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
  logoutButton: {
    backgroundColor: COLORS.error,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpace: {
    height: 20,
  },
});
