import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types/navigation";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, Text, View, ActivityIndicator, Image, Platform } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
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
import { Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

if (__DEV__) console.log("=== DÉMARRAGE DE L'APPLICATION UNIFY ===");

const Stack = createNativeStackNavigator<RootStackParamList>();

// Header custom 100% React Native — élimine les artefacts du header natif iOS
function AppHeader({ title, navigation }: { title: string; navigation: any }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[appHeaderStyles.container, { paddingTop: insets.top + 4 }]}>
      <Pressable
        onPress={() => navigation.navigate("Settings")}
        hitSlop={12}
        style={appHeaderStyles.pressable}
      >
        {({ pressed }) => (
          <View style={[appHeaderStyles.btn, pressed && appHeaderStyles.btnPressed]}>
            <MaterialCommunityIcons name="cog-outline" size={19} color="#7D80F4" />
          </View>
        )}
      </Pressable>

      <Text style={appHeaderStyles.title} numberOfLines={1}>{title}</Text>

      <Pressable
        onPress={() => navigation.navigate("Messages")}
        hitSlop={12}
        style={appHeaderStyles.pressable}
      >
        {({ pressed }) => (
          <View style={[appHeaderStyles.btn, pressed && appHeaderStyles.btnPressed]}>
            <MaterialCommunityIcons name="message-text-outline" size={19} color="#7D80F4" />
          </View>
        )}
      </Pressable>
    </View>
  );
}

const appHeaderStyles = StyleSheet.create({
  container: {
    backgroundColor: "#7D80F4",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
  },
  pressable: {
    padding: 2,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.95)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#5B5ECC",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  btnPressed: {
    backgroundColor: "rgba(255,255,255,0.75)",
    transform: [{ scale: 0.93 }],
  },
  title: {
    flex: 1,
    color: "white",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.3,
  },
});

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
          headerTransparent: false,
          gestureEnabled: false,
          presentation: 'card',
          freezeOnBlur: true,
          contentStyle: {
            backgroundColor: '#f5f5f5',
          },
          animation: 'none',
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
            header: () => <AppHeader title="Accueil" navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="Map"
          component={MapScreen}
          options={({ navigation }) => ({
            header: () => <AppHeader title="Carte" navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="Activities"
          component={ActivitiesScreen}
          options={({ navigation }) => ({
            header: () => <AppHeader title="Mes Activités" navigation={navigation} />,
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
            header: () => <AppHeader title="Statistiques" navigation={navigation} />,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          })}
        />
        <Stack.Screen
          name="Events"
          component={EventsScreen}
          options={({ navigation }) => ({
            header: () => <AppHeader title="Événements" navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={({ navigation }) => ({
            header: () => <AppHeader title="Mon Profil" navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{
            title: "Modifier le profil",
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          }}
        />
        <Stack.Screen
          name="Contacts"
          component={ContactsScreen}
          options={({ navigation }) => ({
            header: () => <AppHeader title="Contacts" navigation={navigation} />,
          })}
        />
      <Stack.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({
          title: route.params.contactName,
          contentStyle: { backgroundColor: '#f5f5f5' },
        })}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ 
          title: "Paramètres",
        }}
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
            header: () => <AppHeader title="Parcours" navigation={navigation} />,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
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
      <SafeAreaProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <NavigationSwitcher />
            <Toast config={toastConfig} />
          </SubscriptionProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
