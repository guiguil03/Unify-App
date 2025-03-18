import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types/navigation";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

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

import { FirebaseDiagnostic } from './utils/FirebaseDiagnostic';
import { NetworkDiagnostic } from './utils/NetworkDiagnostic';

console.log('=== DÉMARRAGE DE L\'APPLICATION UNIFY ===');



// Exécuter les diagnostics au démarrage
setTimeout(() => {
  FirebaseDiagnostic.checkFirebaseStatus()
    .then(result => console.log('Diagnostic Firebase:', result))
    .catch(error => console.error('Erreur lors du diagnostic Firebase:', error));
    
  NetworkDiagnostic.checkNetworkConnectivity()
    .then(result => console.log('Diagnostic Réseau:', result))
    .catch(error => console.error('Erreur lors du diagnostic réseau:', error));
}, 1000);

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

// Composant qui décide quel stack afficher
function NavigationSwitcher() {
  const { user, isLoading, hasCompletedInitialCheck, isSkipped } = useAuth();
  
  // Afficher un indicateur de chargement pendant la vérification
  if (isLoading || !hasCompletedInitialCheck) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#E83D4D" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user !== null || isSkipped ? <AppStack /> : <AuthStack />}
      {/* La barre de connectivité s'affichera automatiquement en cas de problème */}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <NavigationSwitcher />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
