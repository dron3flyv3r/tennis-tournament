import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations, type Locale, type TranslationKey } from './translations';

type Values = Record<string, string | number>;

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey | string, values?: Values) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const STORAGE_KEY = 'tennis_tournament_locale';
const DEFAULT_LOCALE: Locale = 'en';

const hasWindow = typeof window !== 'undefined';

const getBrowserLocale = (): Locale => {
  if (!hasWindow || typeof navigator === 'undefined') {
    return DEFAULT_LOCALE;
  }

  const preferred = navigator.languages?.length ? navigator.languages : [navigator.language];
  const normalized = preferred
    .map(locale => locale.toLowerCase())
    .find(locale => locale.startsWith('da') || locale.startsWith('en'));

  return normalized?.startsWith('da') ? 'da' : 'en';
};

const formatMessage = (template: string, values?: Values) => {
  if (!values) return template;
  return template.replace(/\{\{(.*?)\}\}/g, (match, key) => {
    const value = values[key.trim()];
    return value === undefined ? match : String(value);
  });
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (!hasWindow) return DEFAULT_LOCALE;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (stored === 'en' || stored === 'da') {
        return stored;
      }
    } catch (error) {
      console.warn('Unable to read locale from local storage.', error);
    }
    return getBrowserLocale();
  });

  useEffect(() => {
    if (!hasWindow) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch (error) {
      console.warn('Unable to write locale to local storage.', error);
    }
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useMemo(() => {
    return (key: TranslationKey | string, values?: Values) => {
      const table = translations[locale] ?? translations[DEFAULT_LOCALE];
      const fallback = translations[DEFAULT_LOCALE];
      const template =
        table[key as TranslationKey] ?? fallback[key as TranslationKey] ?? String(key);
      return formatMessage(template, values);
    };
  }, [locale]);

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
