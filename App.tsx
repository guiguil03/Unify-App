import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./src/types/navigation";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import HomeScreen from "./src/screens/HomeScreen";
import MapScreen from "./src/screens/MapScreen";
import ActivitiesScreen from "./src/screens/ActivitiesScreen";
import ActivityDetailScreen from "./src/screens/ActivityDetailScreen";
import EventsScreen from "./src/screens/EventsScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import ContactsScreen from "./src/screens/ContactsScreen";
import MessagesScreen from "./src/screens/MessagesScreen";
import ChatScreen from "./src/screens/ChatScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
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
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
