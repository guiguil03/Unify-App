import { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type RootStackParamList = {
  Welcome: undefined;
  Login: { mode?: "login" | "signup" } | undefined;
  Onboarding: undefined;
  MainTabs: undefined;
  Home: undefined;
  Map: undefined;
  Activities: undefined;
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
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;