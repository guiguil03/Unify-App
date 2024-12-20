import { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type RootStackParamList = {
  Home: undefined;
  Map: undefined;
  Activities: undefined;
  ActivityDetail: { 
    activityId: string;
  };
  Events: undefined;
  Profile: undefined;
  Settings: undefined;
  Contacts: undefined;
  Messages: undefined;
  Chat: {
    contactId: string;
    contactName: string;
  };
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;