import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager, Alert, DevSettings, NativeModules } from 'react-native';

import fr from './fr.json';
import en from './en.json';
import ar from './ar.json';

const RTL_LANGUAGES = ['ar'];

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: 'fr',
  fallbackLng: 'fr',
  interpolation: {
    escapeValue: false,
  },
});

const reloadApp = () => {
  try {
    if (DevSettings && typeof DevSettings.reload === 'function') {
      DevSettings.reload();
      return;
    }
  } catch {}
  // Fallback: native bridge restart (works in some standalone builds)
  try {
    (NativeModules as any).DevSettings?.reload?.();
  } catch {}
};

export const changeLanguage = (lang: string) => {
  const isRTL = RTL_LANGUAGES.includes(lang);
  const wasRTL = I18nManager.isRTL;
  i18n.changeLanguage(lang);

  if (isRTL !== wasRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
    // forceRTL only takes effect after a full app reload. Prompt + reload.
    Alert.alert(
      lang === 'ar' ? 'إعادة التشغيل مطلوبة' : 'Redémarrage requis',
      lang === 'ar'
        ? 'سيتم إعادة تشغيل التطبيق لتطبيق اتجاه الكتابة من اليمين إلى اليسار.'
        : 'L\'application va redémarrer pour appliquer le sens d\'écriture.',
      [{ text: 'OK', onPress: reloadApp }],
      { cancelable: false }
    );
  }
};

export default i18n;
