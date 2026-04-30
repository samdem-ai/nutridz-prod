import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';

import fr from './fr.json';
import en from './en.json';
import ar from './ar.json';
import darija from './darija.json';

const RTL_LANGUAGES = ['ar', 'darija'];

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
    ar: { translation: ar },
    darija: { translation: darija },
  },
  lng: 'fr',
  fallbackLng: 'fr',
  interpolation: {
    escapeValue: false,
  },
});

export const changeLanguage = (lang: string) => {
  const isRTL = RTL_LANGUAGES.includes(lang);
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.forceRTL(isRTL);
    // App needs to restart for RTL change to take effect
  }
  i18n.changeLanguage(lang);
};

export default i18n;
