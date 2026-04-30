import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { changeLanguage } from '../i18n';

interface SettingsState {
  language: string;
  setLanguage: (lang: string) => Promise<void>;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  language: 'fr',

  setLanguage: async (lang) => {
    await AsyncStorage.setItem('language', lang);
    changeLanguage(lang);
    set({ language: lang });
  },

  loadSettings: async () => {
    try {
      let lang = await AsyncStorage.getItem('language');
      // Migrate removed languages to default
      if (lang === 'darija' || (lang && !['fr', 'en', 'ar'].includes(lang))) {
        lang = 'fr';
        await AsyncStorage.setItem('language', lang);
      }
      if (lang) {
        changeLanguage(lang);
        set({ language: lang });
      }
    } catch {
      // AsyncStorage not available, use default
    }
  },
}));
