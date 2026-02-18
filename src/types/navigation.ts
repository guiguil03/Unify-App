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
  Stats: undefined;
  Events: undefined;
  Profile: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Contacts: undefined;
  Messages: undefined;
  Chat: {
    contactId: string;
    contactName: string;
    contactAvatar?: string;
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
  ResetPassword: { token?: string; email?: string } | undefined;
  GroupChat: { groupChatId: string; groupName: string };
  CreateGroup: undefined;
  Coaching: undefined;
  About: undefined;
  Help: undefined;
  Terms: undefined;
  Privacy: undefined;
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;