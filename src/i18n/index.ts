import { ar } from './locales/ar';
import { fr } from './locales/fr';
import { en } from './locales/en';
import type { Language, TranslationSchema } from './types';

export * from './types';

export const LOCALES: Record<Language, TranslationSchema> = {
  ar,
  fr,
  en,
};

export const DEFAULT_LANGUAGE: Language = 'ar';

export const LANGUAGE_OPTIONS: { code: Language; label: string; flag: string; dir: 'rtl' | 'ltr' }[] = [
  { code: 'ar', label: 'العربية', flag: '🇩🇿', dir: 'rtl' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'en', label: 'English', flag: '🇬🇧', dir: 'ltr' },
];
