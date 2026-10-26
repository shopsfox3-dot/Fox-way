import React, { createContext, useContext, useState, useEffect } from 'react';
import { LOCALES, DEFAULT_LANGUAGE, LANGUAGE_OPTIONS } from '../i18n';
import type { Language, TranslationSchema } from '../i18n/types';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationSchema;
  dir: 'rtl' | 'ltr';
  isRTL: boolean;
  languages: typeof LANGUAGE_OPTIONS;
}

const STORAGE_KEY = 'foxway_lang';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved && (saved === 'ar' || saved === 'fr' || saved === 'en')) {
        return saved;
      }
    } catch {
      // ignore storage access errors
    }
    return DEFAULT_LANGUAGE;
  });

  const dir: 'rtl' | 'ltr' = language === 'ar' ? 'rtl' : 'ltr';
  const isRTL = dir === 'rtl';
  const t = LOCALES[language] || LOCALES[DEFAULT_LANGUAGE];

  const setLanguage = (newLang: Language) => {
    if (newLang !== 'ar' && newLang !== 'fr' && newLang !== 'en') return;
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // ignore storage errors
    }
  };

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
    document.title = `${t.nav.brandName} | ${t.nav.brandSub}`;
  }, [dir, language, t.nav.brandName, t.nav.brandSub]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        dir,
        isRTL,
        languages: LANGUAGE_OPTIONS,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
