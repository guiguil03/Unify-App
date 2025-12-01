import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { showInfoToast } from "../utils/errorHandler";

// Import du logo
const logo = require("../assets/logo.png");

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ route, navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(
    route.params?.mode ? route.params.mode === "login" : true
  );
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn, signUp, skipAuth, authenticating } = useAuth();


  const handleSubmit = async () => {
    if (isSubmitting || authenticating) return;

    // Validation basique des champs
    if (isLoginMode && (!email || !password)) {
      showInfoToast("Veuillez remplir tous les champs", "Attention");
      return;
    }

    if (!isLoginMode && (!name || !email || !password)) {
      showInfoToast("Veuillez remplir tous les champs", "Attention");
      return;
    }

    // Validation du format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showInfoToast(
        "Veuillez entrer une adresse email valide",
        "Format invalide"
      );
      return;
    }

    console.log(
      `Tentative de ${isLoginMode ? "connexion" : "création de compte"} pour ${email}`
    );

    // Définir l'état local de soumission à true
    setIsSubmitting(true);

    let success = false;

    try {
      if (isLoginMode) {
        console.log("Appel de signIn avec:", email);
        // Attendre explicitement la fin de la connexion
        success = await signIn(email, password);
        if (success) {
          console.log("Connexion réussie");
        } else {
          // Si la connexion a échoué, ne rien faire d'autre - reste sur la page de login
          console.log("Échec de la connexion - reste sur la page de login");
        }
      } else {
        console.log("Appel de signUp avec:", name, email);
        // Attendre explicitement la fin de l'inscription
        success = await signUp(name, email, password);
        if (success) {
          console.log("Inscription réussie - redirection vers onboarding");
          // Rediriger vers l'onboarding après l'inscription
          navigation.navigate("Onboarding");
        } else {
          // Si l'inscription a échoué, ne rien faire d'autre - reste sur la page de login
          console.log("Échec de l'inscription - reste sur la page de login");
        }
      }
    } catch (error) {
      // En cas d'erreur inattendue qui n'est pas gérée par AuthContext
      console.error("Erreur lors de la connexion/inscription:", error);
      // S'assurer qu'en cas d'erreur, on reste sur la page de login
      success = false;
    } finally {
      // Mettre fin à l'état de soumission
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    // Réinitialiser les champs lors du changement de mode
    setEmail("");
    setPassword("");
    setName("");
  };

  const handleSkip = () => {
    // La transition vers la page d'accueil se fera automatiquement
    // une fois que isSkipped est mis à true
    skipAuth();
    showInfoToast("Mode invité activé", "Bienvenue");
  };

  const isSignup = !isLoginMode;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        {/* Header avec flèche de retour */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
        </View>

        {/* Logo + titre */}
        <View style={styles.logoBlock}>
          <Image source={logo} style={styles.logo} />
          <Text style={styles.screenTitle}>
            {isSignup ? "Inscription" : "Connexion"}
          </Text>
        </View>

        {/* Formulaire */}
        <View style={styles.formCard}>
          {isSignup && (
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Nom ..."
                placeholderTextColor="#C4BCEB"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Adresse mail ..."
              placeholderTextColor="#C4BCEB"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Mot de passe ..."
              placeholderTextColor="#C4BCEB"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSubmit}
            disabled={isSubmitting || authenticating}
          >
            {isSubmitting || authenticating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isSignup ? "Inscription" : "Connexion"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Séparateur "ou" */}
          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>ou</Text>
            <View style={styles.separatorLine} />
          </View>

          {/* Boutons sociaux (statique / design) */}
          <View style={styles.socialRow}>
            <View style={styles.socialButton}>
              <Text style={styles.socialText}>G</Text>
            </View>
            <View style={styles.socialButton}>
              <Text style={styles.socialText}></Text>
            </View>
          </View>
        </View>

        {/* Lien bas de page */}
        <TouchableOpacity style={styles.bottomLink} onPress={toggleMode}>
          <Text style={styles.bottomText}>
            {isSignup ? "Déjà un compte ? " : "Pas de compte ? "}
            <Text style={styles.bottomTextBold}>
              {isSignup ? "Connectez-vous" : "Inscrivez-vous"}
            </Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.guestLink} onPress={handleSkip}>
          <Text style={styles.guestText}>Continuer sans compte</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3EAFE",
  },
  inner: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 24,
  },
  header: {
    height: 40,
    justifyContent: "center",
  },
  backArrow: {
    fontSize: 48,
    color: "#7D80F4",
  },
  logoBlock: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#7D80F4",
    marginTop: 4,
  },
  formCard: {
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  inputWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0D7FF",
  },
  input: {
    fontSize: 16,
    color: "#4A3F84",
  },
  primaryButton: {
    backgroundColor: "#7D80F4",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0D7FF",
  },
  separatorText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: "#B29EEB",
    fontWeight: "600",
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  socialText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#7D80F4",
  },
  bottomLink: {
    marginTop: 24,
    alignItems: "center",
  },
  bottomText: {
    fontSize: 15,
    color: "#8C7ACF",
  },
  bottomTextBold: {
    fontWeight: "700",
  },
  guestLink: {
    marginTop: 8,
    alignItems: "center",
  },
  guestText: {
    fontSize: 14,
    color: "#A29ACF",
  },
});
