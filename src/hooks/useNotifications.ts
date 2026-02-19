import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { NavigationProp } from '../types/navigation';

export function useNotifications(navigation: NavigationProp) {
  useEffect(() => {
    const received = Notifications.addNotificationReceivedListener(() => {});
    const response = Notifications.addNotificationResponseReceivedListener(r => {
      const data = r.notification.request.content.data as any;
      if (data?.type === 'message') {
        navigation.navigate('Chat', {
          contactId: data.contactId,
          contactName: data.contactName,
        });
      } else if (data?.type === 'contact_request') {
        navigation.navigate('Contacts');
      }
    });
    return () => {
      received.remove();
      response.remove();
    };
  }, []);
}
