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
import { showInfoToast, showErrorToast } from "../utils/errorHandler";
import { validatePassword, formatPasswordErrors, normalizeEmail, sanitizeName } from "../utils/validation";
import * as AppleAuthentication from 'expo-apple-authentication';

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

  const { signIn, signUp, signInWithGoogle, signInWithApple, skipAuth, authenticating } = useAuth();


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

    // Normalisation de l'email
    const normalizedEmail = normalizeEmail(email);

    // Validation du format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      showInfoToast(
        "Veuillez entrer une adresse email valide",
        "Format invalide"
      );
      return;
    }

    // Validation du mot de passe à l'inscription
    if (!isLoginMode) {
      const passwordCheck = validatePassword(password);
      if (!passwordCheck.valid) {
        showErrorToast(formatPasswordErrors(passwordCheck.errors));
        return;
      }
    }

    setIsSubmitting(true);

    let success = false;

    try {
      if (isLoginMode) {
        success = await signIn(normalizedEmail, password);
      } else {
        const sanitizedName = sanitizeName(name);
        success = await signUp(sanitizedName, normalizedEmail, password);
        if (success) {
          navigation.navigate("Onboarding");
        }
      }
    } catch {
      success = false;
    } finally {
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

  const handleGoogleSignIn = async () => {
    if (isSubmitting || authenticating) return;
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch {
      // Erreur gérée dans AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppleSignIn = async () => {
    if (isSubmitting || authenticating) return;
    setIsSubmitting(true);
    try {
      await signInWithApple();
    } catch {
      // Erreur gérée dans AuthContext
    } finally {
      setIsSubmitting(false);
    }
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

          {/* Lien mot de passe oublié */}
          {isLoginMode && (
            <TouchableOpacity
              style={styles.forgotPasswordLink}
              onPress={() => navigation.navigate("ResetPassword")}
            >
              <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          )}

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

          {/* Boutons sociaux */}
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={[styles.socialButton, (isSubmitting || authenticating) && styles.socialButtonDisabled]}
              onPress={handleGoogleSignIn}
              disabled={isSubmitting || authenticating}
            >
              <Text style={styles.socialText}>G</Text>
            </TouchableOpacity>
            {Platform.OS === 'ios' && (
              <View style={styles.appleButtonContainer}>
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                  cornerRadius={28}
                  style={styles.appleButton}
                  onPress={handleAppleSignIn}
                />
              </View>
            )}
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
  socialButtonDisabled: {
    opacity: 0.5,
  },
  socialText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#7D80F4",
  },
  appleButtonContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  appleButton: {
    width: 56,
    height: 56,
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
  forgotPasswordLink: {
    alignSelf: "flex-end",
    marginTop: 4,
    marginBottom: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#7D80F4",
    fontWeight: "600",
  },
});
