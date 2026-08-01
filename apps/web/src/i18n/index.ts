import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import sw from './sw.json';
import fr from './fr.json';
import pt from './pt.json';

i18n.use(LanguageDetector).use(initReactI18next).init({
  resources: {
    en: { translation: en },
    sw: { translation: sw },
    fr: { translation: fr },
    pt: { translation: pt },
  },
  fallbackLng: 'en',
  detection: {
    order: ['localStorage', 'navigator'],
    caches: ['localStorage'],
    lookupLocalStorage: 'lang',
  },
  interpolation: { escapeValue: false },
});

export default i18n;
