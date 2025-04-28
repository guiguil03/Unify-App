import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types/navigation";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";

import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import MapScreen from "./screens/MapScreen";
import ActivitiesScreen from "./screens/ActivitiesScreen";
import ActivityDetailScreen from "./screens/ActivityDetailScreen";
import EventsScreen from "./screens/EventsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ContactsScreen from "./screens/ContactsScreen";
import MessagesScreen from "./screens/MessagesScreen";
import ChatScreen from "./screens/ChatScreen";
import SettingsScreen from "./screens/SettingsScreen";

import { FirebaseDiagnostic } from "./utils/FirebaseDiagnostic";
import { NetworkDiagnostic } from "./utils/NetworkDiagnostic";

console.log("=== DÉMARRAGE DE L'APPLICATION UNIFY ===");

// Fonction pour exécuter les diagnostics avec retry
const runDiagnosticsWithRetry = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await Promise.all([
        FirebaseDiagnostic.checkFirebaseStatus()
          .then((result) => console.log("Diagnostic Firebase:", result))
          .catch((error) => {
            console.warn(
              `Tentative ${i + 1}/${retries} - Erreur Firebase:`,
              error
            );
            throw error;
          }),
        NetworkDiagnostic.checkNetworkConnectivity()
          .then((result) => console.log("Diagnostic Réseau:", result))
          .catch((error) => {
            console.warn(
              `Tentative ${i + 1}/${retries} - Erreur Réseau:`,
              error
            );
            throw error;
          }),
      ]);
      console.log("✅ Diagnostics terminés avec succès");
      return;
    } catch (error) {
      if (i === retries - 1) {
        console.error("❌ Échec des diagnostics après", retries, "tentatives");
      } else {
        console.log(
          `⏳ Nouvelle tentative dans 2 secondes... (${i + 2}/${retries})`
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }
};

// Exécuter les diagnostics en arrière-plan après le chargement initial
setTimeout(() => {
  runDiagnosticsWithRetry().catch((error) =>
    console.error("Erreur finale lors des diagnostics:", error)
  );
}, 3000);

const Stack = createNativeStackNavigator<RootStackParamList>();

// Stack pour utilisateurs non authentifiés
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

// Stack pour utilisateurs authentifiés ou qui ont cliqué sur "Continuer sans compte"
function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#E83D4D",
        },
        headerTintColor: "white",
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Unify" }}
      />
      <Stack.Screen
        name="Map"
        component={MapScreen}
        options={{ title: "Carte" }}
      />
      <Stack.Screen
        name="Activities"
        component={ActivitiesScreen}
        options={{ title: "Mes Activités" }}
      />
      <Stack.Screen
        name="ActivityDetail"
        component={ActivityDetailScreen}
        options={{ title: "Détails de l'activité" }}
      />
      <Stack.Screen
        name="Events"
        component={EventsScreen}
        options={{ title: "Événements" }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Mon Profil" }}
      />
      <Stack.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{ title: "Contacts" }}
      />
      <Stack.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ title: "Messages" }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({
          title: route.params.contactName,
        })}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Parametres" }}
      />
    </Stack.Navigator>
  );
}

// Configuration personnalisée pour le Toast
const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: "#E83D4D", borderLeftWidth: 4 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 15, fontWeight: "bold" }}
      text2Style={{ fontSize: 13 }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: "#E83D4D", borderLeftWidth: 4 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 15, fontWeight: "bold" }}
      text2Style={{ fontSize: 13 }}
    />
  ),
  info: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: "#E83D4D", borderLeftWidth: 4 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 15, fontWeight: "bold" }}
      text2Style={{ fontSize: 13 }}
    />
  ),
};

// Composant qui décide quel stack afficher
function NavigationSwitcher() {
  const { user, isLoading, hasCompletedInitialCheck, isSkipped } = useAuth();

  // Afficher un indicateur de chargement pendant la vérification
  if (isLoading || !hasCompletedInitialCheck) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#E83D4D" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {/* Uniquement naviguer vers AppStack si user est connecté OU si l'utilisateur a explicitement choisi de passer la connexion */}
      {user !== null || isSkipped ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <NavigationSwitcher />
        <Toast config={toastConfig} />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
