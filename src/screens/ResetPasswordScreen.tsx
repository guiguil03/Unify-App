import React, { useState, useEffect } from "react";
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
  ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { AuthService } from "../services/AuthService";
import { showErrorToast, showSuccessToast, showInfoToast } from "../utils/errorHandler";

const logo = require("../assets/logo.png");

type Props = NativeStackScreenProps<RootStackParamList, "ResetPassword">;

export default function ResetPasswordScreen({ route, navigation }: Props) {
  const [step, setStep] = useState<"request" | "verify" | "reset">("request");
  
  // État pour la demande d'email
  const [emailInput, setEmailInput] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  // État pour la vérification du code
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  
  // État pour la réinitialisation
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      showInfoToast("Veuillez entrer un code à 6 chiffres", "Code invalide");
      return;
    }

    setIsVerifying(true);
    try {
      const isValid = await AuthService.verifyResetCode(emailInput, code);
      if (isValid) {
        showSuccessToast("Code vérifié !");
        setStep("reset");
      } else {
        showErrorToast("Code invalide ou expiré");
      }
    } catch (error: any) {
      console.error("Erreur lors de la vérification du code:", error);
      showErrorToast(error.message || "Code invalide ou expiré");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!emailInput) {
      showInfoToast("Veuillez entrer votre adresse email", "Champ requis");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
      showInfoToast("Veuillez entrer une adresse email valide", "Format invalide");
      return;
    }

    setIsSendingEmail(true);
    try {
      await AuthService.sendPasswordResetEmail(emailInput);
      showSuccessToast("Code envoyé ! Vérifiez votre boîte de réception.");
      setStep("verify");
    } catch (error: any) {
      console.error("Erreur lors de l'envoi de l'email:", error);
      // Le service gère déjà l'affichage des messages
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      showInfoToast("Veuillez remplir tous les champs", "Champs requis");
      return;
    }

    if (newPassword.length < 6) {
      showInfoToast("Le mot de passe doit contenir au moins 6 caractères", "Mot de passe trop court");
      return;
    }

    if (newPassword !== confirmPassword) {
      showInfoToast("Les mots de passe ne correspondent pas", "Erreur");
      return;
    }

    if (!code) {
      showErrorToast("Code de réinitialisation manquant");
      return;
    }

    setIsResetting(true);
    try {
      await AuthService.resetPassword(newPassword, code, emailInput);
      showSuccessToast("Mot de passe réinitialisé avec succès !");
      // Rediriger vers la page de connexion
      navigation.navigate("Login", { mode: "login" });
    } catch (error: any) {
      console.error("Erreur lors de la réinitialisation:", error);
      showErrorToast(error.message || "Erreur lors de la réinitialisation");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
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
              {step === "request" ? "Mot de passe oublié" : step === "verify" ? "Vérification du code" : "Nouveau mot de passe"}
            </Text>
          </View>

          {/* Formulaire */}
          <View style={styles.formCard}>
            {step === "request" ? (
              <>
                <Text style={styles.description}>
                  Entrez votre adresse email et nous vous enverrons un code pour réinitialiser votre mot de passe.
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Adresse mail ..."
                    placeholderTextColor="#C4BCEB"
                    value={emailInput}
                    onChangeText={setEmailInput}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleSendResetEmail}
                  disabled={isSendingEmail}
                >
                  {isSendingEmail ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Envoyer le code</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : step === "verify" ? (
              <>
                <Text style={styles.description}>
                  Entrez le code à 6 chiffres que nous avons envoyé à {emailInput}
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Code à 6 chiffres ..."
                    placeholderTextColor="#C4BCEB"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoCapitalize="none"
                  />
                </View>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleVerifyCode}
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Vérifier le code</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    setStep("request");
                    setCode("");
                  }}
                >
                  <Text style={styles.secondaryButtonText}>Renvoyer le code</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.description}>
                  Entrez votre nouveau mot de passe.
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Nouveau mot de passe ..."
                    placeholderTextColor="#C4BCEB"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="password-new"
                  />
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirmer le mot de passe ..."
                    placeholderTextColor="#C4BCEB"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="password-new"
                  />
                </View>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleResetPassword}
                  disabled={isResetting}
                >
                  {isResetting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Réinitialiser</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Lien retour */}
          <TouchableOpacity
            style={styles.bottomLink}
            onPress={() => navigation.navigate("Login", { mode: "login" })}
          >
            <Text style={styles.bottomText}>
              Retour à la <Text style={styles.bottomTextBold}>connexion</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3EAFE",
  },
  scrollContent: {
    flexGrow: 1,
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
  description: {
    fontSize: 15,
    color: "#8C7ACF",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
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
  secondaryButton: {
    backgroundColor: "transparent",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#7D80F4",
  },
  secondaryButtonText: {
    color: "#7D80F4",
    fontSize: 17,
    fontWeight: "700",
  },
});

