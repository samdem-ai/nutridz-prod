import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { changeLanguage } from '../i18n';

interface SettingsState {
  language: string;
  hydrationNudges: boolean;
  streakReminder: boolean;
  setLanguage: (lang: string) => Promise<void>;
  setHydrationNudges: (v: boolean) => Promise<void>;
  setStreakReminder: (v: boolean) => Promise<void>;
  loadSettings: () => Promise<void>;
}

const KEYS = {
  lang: 'language',
  hydration: 'settings.hydrationNudges',
  streak: 'settings.streakReminder',
};

export const useSettingsStore = create<SettingsState>((set) => ({
  language: 'fr',
  hydrationNudges: true,
  streakReminder: true,

  setLanguage: async (lang) => {
    await AsyncStorage.setItem(KEYS.lang, lang);
    changeLanguage(lang);
    set({ language: lang });
  },

  setHydrationNudges: async (v) => {
    await AsyncStorage.setItem(KEYS.hydration, v ? '1' : '0');
    set({ hydrationNudges: v });
  },

  setStreakReminder: async (v) => {
    await AsyncStorage.setItem(KEYS.streak, v ? '1' : '0');
    set({ streakReminder: v });
  },

  loadSettings: async () => {
    try {
      let lang = await AsyncStorage.getItem(KEYS.lang);
      if (lang === 'darija' || (lang && !['fr', 'en', 'ar'].includes(lang))) {
        lang = 'fr';
        await AsyncStorage.setItem(KEYS.lang, lang);
      }
      if (lang) {
        changeLanguage(lang);
        set({ language: lang });
      }
      const hyd = await AsyncStorage.getItem(KEYS.hydration);
      const str = await AsyncStorage.getItem(KEYS.streak);
      set({
        hydrationNudges: hyd !== '0',
        streakReminder: str !== '0',
      });
    } catch {
      // AsyncStorage not available — use defaults
    }
  },
}));
