import AsyncStorage from '@react-native-async-storage/async-storage';
import { Settings } from '../types/settings';

const SETTINGS_STORAGE_KEY = '@settings';

export class SettingsService {
  static async getSettings(): Promise<Settings> {
    try {
      const settings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('Error loading settings:', error);
      return null;
    }
  }

  static async saveSettings(settings: Settings): Promise<boolean> {
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }
}