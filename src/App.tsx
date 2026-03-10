import React, { useEffect, Component } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types/navigation";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, Text, View, ActivityIndicator, Image, Platform, ScrollView } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";
import { NotificationService } from "./services/NotificationService";
import * as Linking from "expo-linking";
import { supabase } from "./config/supabase";

// ErrorBoundary — attrape les crashes React en prod et affiche l'erreur
// au lieu d'un écran blanc (utile pour le debug TestFlight)
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <ScrollView
          contentContainerStyle={{ flex: 1, padding: 24, paddingTop: 80, backgroundColor: '#fff' }}
        >
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#c00', marginBottom: 12 }}>
            Erreur au démarrage
          </Text>
          <Text style={{ fontSize: 13, color: '#333', marginBottom: 8 }}>
            {this.state.error.toString()}
          </Text>
          <Text style={{ fontSize: 11, color: '#666', fontFamily: 'monospace' }}>
            {this.state.error.stack}
          </Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

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
import GroupChatScreen from "./screens/GroupChatScreen";
import CreateGroupScreen from "./screens/CreateGroupScreen";
import CoachingScreen from "./screens/CoachingScreen";
import AboutScreen from "./screens/AboutScreen";
import HelpScreen from "./screens/HelpScreen";
import TermsScreen from "./screens/TermsScreen";
import PrivacyScreen from "./screens/PrivacyScreen";
import { OnboardingChecker } from "./components/OnboardingChecker";
import { Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Capture les erreurs JS fatales AVANT que React ne monte (module-level crashes)
// Sans ça, ces erreurs donnent un écran blanc sans aucun message
if (typeof ErrorUtils !== 'undefined') {
  const prev = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    if (__DEV__) console.error('[GlobalError]', error);
    prev?.(error, isFatal);
  });
}

if (__DEV__) console.log("=== DÉMARRAGE DE L'APPLICATION UNIFY ===");

const Stack = createNativeStackNavigator<RootStackParamList>();

// Header custom 100% React Native — élimine les artefacts du header natif iOS
function AppHeader({ title, navigation, showBackButton = false }: { title: string; navigation: any; showBackButton?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[appHeaderStyles.container, { paddingTop: insets.top + 6 }]}>
      {showBackButton ? (
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          {({ pressed }) => (
            <View style={[appHeaderStyles.btn, pressed && appHeaderStyles.btnPressed]}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="#7D80F4" />
            </View>
          )}
        </Pressable>
      ) : (
        <Pressable onPress={() => navigation.navigate("Settings")} hitSlop={12}>
          {({ pressed }) => (
            <View style={[appHeaderStyles.btn, pressed && appHeaderStyles.btnPressed]}>
              <MaterialCommunityIcons name="cog-outline" size={22} color="#7D80F4" />
            </View>
          )}
        </Pressable>
      )}
      <Text style={appHeaderStyles.title} numberOfLines={1}>{title}</Text>
      {showBackButton ? (
        <View style={appHeaderStyles.btn} />
      ) : (
        <Pressable onPress={() => navigation.navigate("Messages")} hitSlop={12}>
          {({ pressed }) => (
            <View style={[appHeaderStyles.btn, pressed && appHeaderStyles.btnPressed]}>
              <MaterialCommunityIcons name="message-outline" size={22} color="#7D80F4" />
            </View>
          )}
        </Pressable>
      )}
    </View>
  );
}

const appHeaderStyles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 3,
    borderBottomColor: "#7D80F4",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#7D80F4",
    letterSpacing: -0.3,
    fontStyle: "italic",
    flex: 1,
    textAlign: "center",
  },
  btn: {
    padding: 8,
    width: 38,
    alignItems: "center",
  },
  btnPressed: {
    opacity: 0.5,
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
  useEffect(() => {
    NotificationService.registerForPushNotifications().catch(() => {});
  }, []);

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
            backgroundColor: '#ffffff',
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
            header: () => <AppHeader title="Carte" navigation={navigation} showBackButton={true} />,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
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
          options={({ navigation }) => ({
            header: () => <AppHeader title="Détails de l'activité" navigation={navigation} showBackButton={true} />,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          })}
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
          options={({ navigation }) => ({
            header: () => <AppHeader title="Modifier le profil" navigation={navigation} showBackButton={true} />,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          })}
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
        options={({ navigation, route }) => ({
          header: () => <AppHeader title={route.params.contactName} navigation={navigation} showBackButton={true} />,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          contentStyle: { backgroundColor: '#ffffff' },
        })}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={({ navigation }) => ({
          header: () => <AppHeader title="Paramètres" navigation={navigation} showBackButton={true} />,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        })}
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
        options={({ navigation }) => ({
          header: () => <AppHeader title="Détails du parcours" navigation={navigation} showBackButton={true} />,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        })}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="GroupChat"
        component={GroupChatScreen}
        options={({ navigation, route }) => ({
          header: () => (
            <AppHeader
              title={(route.params as any).groupName}
              navigation={navigation}
              showBackButton={true}
            />
          ),
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        })}
      />
      <Stack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={({ navigation }) => ({
          header: () => (
            <AppHeader title="Nouveau groupe" navigation={navigation} showBackButton={true} />
          ),
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        })}
      />
      <Stack.Screen
        name="Coaching"
        component={CoachingScreen}
        options={({ navigation }) => ({
          header: () => (
            <AppHeader title="Coaching" navigation={navigation} showBackButton={true} />
          ),
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        })}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={({ navigation }) => ({
          header: () => (
            <AppHeader title="À propos" navigation={navigation} showBackButton={true} />
          ),
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        })}
      />
      <Stack.Screen
        name="Help"
        component={HelpScreen}
        options={({ navigation }) => ({
          header: () => (
            <AppHeader title="Aide et support" navigation={navigation} showBackButton={true} />
          ),
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        })}
      />
      <Stack.Screen
        name="Terms"
        component={TermsScreen}
        options={({ navigation }) => ({
          header: () => (
            <AppHeader title="Conditions d'utilisation" navigation={navigation} showBackButton={true} />
          ),
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        })}
      />
      <Stack.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={({ navigation }) => ({
          header: () => (
            <AppHeader title="Politique de confidentialité" navigation={navigation} showBackButton={true} />
          ),
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        })}
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

// Gère les deep links entrants (confirmation email, reset password…)
function DeepLinkHandler() {
  useEffect(() => {
    const handleUrl = async ({ url }: { url: string }) => {
      if (!url.includes("auth/callback")) return;

      try {
        const parsed = Linking.parse(url);

        // PKCE flow : Supabase redirige avec ?code=
        const code = parsed.queryParams?.code as string | undefined;
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
          return;
        }

        // Implicit flow : Supabase redirige avec #access_token=&refresh_token=
        const fragment = url.split("#")[1];
        if (fragment) {
          const params = new URLSearchParams(fragment);
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");
          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          }
        }
      } catch (e) {
        if (__DEV__) console.error("[DeepLink] Erreur traitement URL:", e);
      }
    };

    // App ouverte depuis un cold start via deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    // App déjà ouverte et deep link reçu en background
    const sub = Linking.addEventListener("url", handleUrl);
    return () => sub.remove();
  }, []);

  return null;
}

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
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <DeepLinkHandler />
              <NavigationSwitcher />
              <Toast config={toastConfig} />
            </SubscriptionProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
