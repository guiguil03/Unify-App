import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';
import { getCurrentUserFromDB } from '../utils/supabaseHelpers';

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch {
  // Module natif pas encore prêt (nouvelle architecture) — ne pas crasher
}

export class NotificationService {
  static async registerForPushNotifications(): Promise<string | null> {
    if (!Constants.isDevice) return null;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        lightColor: '#7D80F4',
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'a7e92250-0e8a-4fe5-b783-71bb351185ca',
    });
    const token = tokenData.data;

    const currentUser = await getCurrentUserFromDB();
    if (currentUser?.id) {
      await supabase
        .from('users')
        .update({ push_token: token })
        .eq('id', currentUser.id);
    }

    return token;
  }

  static async getRecipientToken(userId: string): Promise<string | null> {
    const { data } = await supabase
      .from('users')
      .select('push_token')
      .eq('id', userId)
      .single();
    return (data as any)?.push_token ?? null;
  }

  static async sendPushNotification(
    toToken: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to: toToken, title, body, data }),
    });
  }
}
