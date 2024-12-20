import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { formatDuration } from '../utils/format';

const LIVE_ACTIVITY_TASK = 'LIVE_ACTIVITY_TASK';

export class LiveActivityService {
  static async requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  static async startActivity() {
    await this.requestPermissions();
    
    await Notifications.setNotificationChannelAsync('live-activity', {
      name: 'Live Activity',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E83D4D',
    });

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Course en cours',
        body: '00:00 | 0.00 km',
        data: { startTime: new Date().toISOString() },
      },
      trigger: null,
    });
  }

  static async updateActivity(duration: number, distance: number) {
    const pace = distance > 0 
      ? `${((duration / 60) / distance).toFixed(2)} min/km`
      : '--:--';

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Course en cours',
        body: `${formatDuration(duration)} | ${distance.toFixed(2)} km | ${pace}`,
      },
      trigger: null,
    });
  }

  static async stopActivity() {
    await Notifications.dismissAllNotificationsAsync();
  }
}

TaskManager.defineTask(LIVE_ACTIVITY_TASK, ({ data, error }) => {
  if (error) {
    return;
  }
  // Handle background location updates here
});