import { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type RootStackParamList = {
  Login: undefined;
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
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;