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
      lightColor: '#7D80F4',
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
    let pace = '--:--';
    if (distance > 0) {
      const secPerKm = duration / distance;
      const m = Math.floor(secPerKm / 60);
      const s = Math.floor(secPerKm % 60);
      pace = `${m}:${s.toString().padStart(2, '0')} /km`;
    }

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

try {
  if (!TaskManager.isTaskDefined(LIVE_ACTIVITY_TASK)) {
    TaskManager.defineTask(LIVE_ACTIVITY_TASK, async ({ data, error }: any) => {
      if (error) return;
      // Handle background location updates here
    });
  }
} catch {
  // TaskManager not ready (new architecture) — ne pas crasher
}