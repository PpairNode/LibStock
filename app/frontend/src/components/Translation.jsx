import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../locales/en/translation.json';
import fr from '../locales/fr/translation.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
    lng: localStorage.getItem('language-chosen') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
  });

export default i18n;
