import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types/navigation";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, Text, View, ActivityIndicator, TouchableWithoutFeedback, Image } from "react-native";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";

import LoginScreen from "./screens/LoginScreen";
import WelcomeScreen from "./screens/WelcomeScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import HomeScreen from "./screens/HomeScreen";
import MapScreen from "./screens/MapScreen/index";
import ActivitiesScreen from "./screens/ActivitiesScreen";
import ActivityDetailScreen from "./screens/ActivityDetailScreen";
import StatsScreen from "./screens/StatsScreen";
import EventsScreen from "./screens/EventsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import EditProfileScreen from "./screens/EditProfileScreen";
import ContactsScreen from "./screens/ContactsScreen";
import MessagesScreen from "./screens/MessagesScreen";
import ChatScreen from "./screens/ChatScreen";
import SettingsScreen from "./screens/SettingsScreen";
import CreateStoryScreen from "./screens/CreateStoryScreen";
import ViewStoriesScreen from "./screens/ViewStoriesScreen";
import CreatePostScreen from "./screens/CreatePostScreen";
import RoutesScreen from "./screens/RoutesScreen";
import CreateRouteScreen from "./screens/CreateRouteScreen";
import RouteDetailScreen from "./screens/RouteDetailScreen";
import UserProfileScreen from "./screens/UserProfileScreen";
import ResetPasswordScreen from "./screens/ResetPasswordScreen";
import { OnboardingChecker } from "./components/OnboardingChecker";
import { TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

console.log("=== DÉMARRAGE DE L'APPLICATION UNIFY ===");

const Stack = createNativeStackNavigator<RootStackParamList>();

// Composant pour les boutons du header (réglages et messages)
const HeaderButtons = ({ navigation }: { navigation: any }) => (
  <TouchableWithoutFeedback
    onPress={() => navigation.navigate("Messages")}
    style={{  backgroundColor: 'blue' }}
  >
    <MaterialCommunityIcons name="message-outline" size={24} color="white" />
</TouchableWithoutFeedback>
);

const HeaderLeft = ({ navigation }: { navigation: any }) => (
  <TouchableOpacity
    onPress={() => navigation.navigate("Settings")}
    style={{ marginLeft: 6, backgroundColor: 'transparent' }}
  >
    <MaterialCommunityIcons name="cog-outline" size={24} color="white" />
  </TouchableOpacity>
);

// Stack pour utilisateurs non authentifiés
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}

// Stack pour utilisateurs authentifiés ou qui ont cliqué sur "Continuer sans compte"
function AppStack() {
  return (
    <>
      <OnboardingChecker />
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: "#7D80F4",
          },
          headerTintColor: "white",
        }}
        initialRouteName="Home"
      >
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={({ navigation }) => ({
            title: "Accueil",
            headerLeft: () => <HeaderLeft navigation={navigation} />,
            headerRight: () => <HeaderButtons navigation={navigation} />,
          })}
        />
      <Stack.Screen
        name="Map"
        component={MapScreen}
        options={({ navigation }) => ({
          title: "Carte",
          headerLeft: () => <HeaderLeft navigation={navigation} />,
          headerRight: () => <HeaderButtons navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="Activities"
        component={ActivitiesScreen}
        options={({ navigation }) => ({
          title: "Mes Activités",
          headerLeft: () => <HeaderLeft navigation={navigation} />,
          headerRight: () => <HeaderButtons navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="ActivityDetail"
        component={ActivityDetailScreen}
        options={{ title: "Détails de l'activité" }}
      />
      <Stack.Screen
        name="Stats"
        component={StatsScreen}
        options={({ navigation }) => ({
          title: "Statistiques",
          headerLeft: () => <HeaderLeft navigation={navigation} />,
          headerRight: () => <HeaderButtons navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="Events"
        component={EventsScreen}
        options={({ navigation }) => ({
          title: "Événements",
          headerLeft: () => <HeaderLeft navigation={navigation} />,
          headerRight: () => <HeaderButtons navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={({ navigation }) => ({
          title: "Mon Profil",
          headerLeft: () => <HeaderLeft navigation={navigation} />,
          headerRight: () => <HeaderButtons navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ 
          title: "Modifier le profil",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Contacts"
        component={ContactsScreen}
        options={({ navigation }) => ({
          title: "Contacts",
          headerLeft: () => <HeaderLeft navigation={navigation} />,
          headerRight: () => <HeaderButtons navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="Messages"
        component={MessagesScreen}
        options={({ navigation }) => ({
          title: "Messages",
          headerLeft: () => <HeaderLeft navigation={navigation} />,
        })}
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
        options={{ title: "Paramètres" }}
      />
      <Stack.Screen
        name="CreateStory"
        component={CreateStoryScreen}
        options={{
          title: "Créer une story",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ViewStories"
        component={ViewStoriesScreen}
        options={{
          title: "Stories",
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Routes"
        component={RoutesScreen}
        options={({ navigation }) => ({
          title: "Parcours",
          headerLeft: () => <HeaderLeft navigation={navigation} />,
          headerRight: () => <HeaderButtons navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="CreateRoute"
        component={CreateRouteScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="RouteDetail"
        component={RouteDetailScreen}
        options={{
          title: "Détails du parcours",
        }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          headerShown: false,
        }}
      />
      </Stack.Navigator>
    </>
  );
}

// Configuration personnalisée pour le Toast
const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: "#7D80F4", borderLeftWidth: 4 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 15, fontWeight: "bold" }}
      text2Style={{ fontSize: 13 }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: "#7D80F4", borderLeftWidth: 4 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 15, fontWeight: "bold" }}
      text2Style={{ fontSize: 13 }}
    />
  ),
  info: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: "#7D80F4", borderLeftWidth: 4 }}
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
        <Image 
          source={require("./assets/logo.png")} 
          style={{ width: 150, height: 150, marginBottom: 32 }}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#7D80F4" />
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
        <SubscriptionProvider>
          <NavigationSwitcher />
          <Toast config={toastConfig} />
        </SubscriptionProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
