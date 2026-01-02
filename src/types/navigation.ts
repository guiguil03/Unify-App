import { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type RootStackParamList = {
  Welcome: undefined;
  Login: { mode?: "login" | "signup" } | undefined;
  Onboarding: undefined;
  MainTabs: undefined;
  Home: undefined;
  Map: undefined;
  Activities: { routeToFollow?: any } | undefined;
  ActivityDetail: { 
    activityId: string;
  };
  Events: undefined;
  Profile: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Contacts: undefined;
  Messages: undefined;
  Chat: {
    contactId: string;
    contactName: string;
  };
  CreateStory: undefined;
  ViewStories: {
    userId: string;
  };
  CreatePost: undefined;
  Routes: undefined;
  CreateRoute: undefined;
  RouteDetail: { routeId: string };
  UserProfile: { userId: string };
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;