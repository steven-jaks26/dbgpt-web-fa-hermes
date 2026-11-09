import en from '@/locales/en';
import fa from '@/locales/fa';
import zh from '@/locales/zh';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// This deployment exposes Persian as its only user-selectable UI language.
// English/Chinese resources remain loaded for compatibility with legacy data.
export const SUPPORTED_UI_LANGUAGES = ['fa'] as const;
export type UiLanguage = (typeof SUPPORTED_UI_LANGUAGES)[number];
export type I18nKeys = keyof typeof en;

export const DEFAULT_UI_LANGUAGE: UiLanguage = 'fa';

export function normalizeUiLanguage(value?: string | null): UiLanguage {
  const code = String(value || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0];
  return (SUPPORTED_UI_LANGUAGES as readonly string[]).includes(code) ? (code as UiLanguage) : DEFAULT_UI_LANGUAGE;
}

export function isRtlLanguage(value?: string | null): boolean {
  return normalizeUiLanguage(value) === 'fa';
}

export function nextUiLanguage(value?: string | null): UiLanguage {
  const current = normalizeUiLanguage(value);
  const index = SUPPORTED_UI_LANGUAGES.indexOf(current);
  return SUPPORTED_UI_LANGUAGES[(index + 1) % SUPPORTED_UI_LANGUAGES.length];
}
interface Resources {
  translation: Record<I18nKeys, string>;
}

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: en,
    },
    zh: {
      translation: zh,
    },
    fa: {
      translation: fa,
    },
  },
  // Keep SSR and the first client render identical. CssWrapper applies the
  // persisted browser preference immediately after hydration.
  lng: DEFAULT_UI_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: Resources;
  }
}
