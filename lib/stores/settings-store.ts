/**
 * Settings Store - Zustand
 * Manages application settings and preferences
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserSettings, AppSettings, NotificationSettings, APISettings } from '@/lib/types';

interface SettingsStore extends UserSettings {
  // Actions
  updateAppSettings: (settings: Partial<AppSettings>) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  updateAPISettings: (settings: Partial<APISettings>) => void;
  resetToDefaults: () => void;
}

const defaultAppSettings: AppSettings = {
  theme: 'dark',
  accentColor: 'gold',
  animationSpeed: 'normal',
  fontSize: 'medium',
  language: 'en',
  refreshInterval: 15,
  dataRetention: 90,
};

const defaultNotificationSettings: NotificationSettings = {
  enabled: true,
  airdropAlerts: true,
  airdropLeadTime: 10,
  stabilityAlerts: true,
  stabilityThreshold: 50,
  soundEffects: true,
  volume: 70,
  doNotDisturb: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
  },
};

const defaultAPISettings: APISettings = {
  testConnection: false,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      app: defaultAppSettings,
      notifications: defaultNotificationSettings,
      api: defaultAPISettings,

      updateAppSettings: (settings) => {
        set((state) => ({
          app: { ...state.app, ...settings },
        }));
      },

      updateNotificationSettings: (settings) => {
        set((state) => ({
          notifications: { ...state.notifications, ...settings },
        }));
      },

      updateAPISettings: (settings) => {
        set((state) => ({
          api: { ...state.api, ...settings },
        }));
      },

      resetToDefaults: () => {
        set({
          app: defaultAppSettings,
          notifications: defaultNotificationSettings,
          api: defaultAPISettings,
        });
      },
    }),
    {
      name: 'binance-alpha-settings',
    }
  )
);
