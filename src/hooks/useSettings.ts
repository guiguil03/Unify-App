import { useState, useEffect } from 'react';
import { Settings } from '../types/settings';
import { SettingsService } from '../services/SettingsService';

const DEFAULT_SETTINGS: Settings = {
  sameGenderOnly: false,
  hideExactLocation: false,
  similarPaceOnly: false,
  similarSchedule: false,
  nearbyRunnersNotifications: true,
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await SettingsService.getSettings();
      if (savedSettings) {
        setSettings(savedSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof Settings, value: boolean) => {
    const newSettings = {
      ...settings,
      [key]: value
    };
    setSettings(newSettings);
    await SettingsService.saveSettings(newSettings);
  };

  return {
    settings,
    loading,
    updateSetting,
  };
}