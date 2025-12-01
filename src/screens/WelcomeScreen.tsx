import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";

const { width } = Dimensions.get("window");

const logo = require("../assets/logo.png");

type Props = NativeStackScreenProps<RootStackParamList, "Welcome">;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#F3EAFE", "#F3EAFE"]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Image source={logo} style={styles.logo} />
          </View>

          <View style={styles.textBlock}>
            <Text style={styles.subtitle}>Bienvenue dans</Text>
            <Text style={styles.title}>UNIFY</Text>
            <Text style={styles.description}>
              Votre motivation, vos partenaires,{"\n"}
              vos parcours : tous réunis !
            </Text>
          </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate("Login", { mode: "signup" })}
          >
            <Text style={styles.primaryButtonText}>Inscription</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => navigation.navigate("Login", { mode: "login" })}
          >
            <Text style={styles.secondaryText}>
              Déjà un compte ? <Text style={styles.secondaryTextBold}>Connectez-vous</Text>
            </Text>
          </TouchableOpacity>

        </View>          
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3EAFE",
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  content: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
    justifyContent: "space-between",
    paddingVertical: 48,
  },
  header: {
    alignItems: "flex-start",
  },
  logo: {
    position: "relative",
    top:150,
    width: 80,
    height: 80,
    resizeMode: "contain",
  },
  textBlock: {
    marginTop: 40,
  },
  subtitle: {
    fontSize: 20,
    color: "#B29EEB",
    fontWeight: "600",
  },
  title: {
    fontSize: 40,
    color: "#7D80F4",
    fontWeight: "800",
    marginTop: 4,
  },
  description: {
    fontSize: 16,
    color: "#B29EEB",
    marginTop: 16,
    lineHeight: 22,
  },
  primaryButton: {
    marginTop: 40,
    backgroundColor: "#7D80F4",
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryAction: {
    alignItems: "center",
  },
  secondaryText: {
    marginTop: 16,
    fontSize: 14,
    color: "#8C7ACF",
  },
  secondaryTextBold: {
    fontWeight: "700",
  },
  illustrationContainer: {
    alignItems: "center",
    marginTop: 32,
  },
  illustration: {
    width: width * 0.8,
    height: width * 0.55,
    resizeMode: "contain",
  },
  buttonContainer: {
    position: "relative",
    bottom: 160,

    left: 0,
    right: 0,
    marginTop: 40,
  },
});


