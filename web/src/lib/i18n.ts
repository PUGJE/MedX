// Internationalization configuration and utilities
import type { Language } from './types'

// Re-export for convenience
export type { Language }

export const SUPPORTED_LANGUAGES: { code: Language; name: string; nativeName: string; flag: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' }
]

export const DEFAULT_LANGUAGE: Language = 'en'

// Language detection utilities
export function detectLanguage(): Language {
  // Check localStorage first
  const stored = localStorage.getItem('app_language') as Language
  if (stored && SUPPORTED_LANGUAGES.some(lang => lang.code === stored)) {
    return stored
  }

  // Check browser language
  const browserLang = navigator.language.split('-')[0] as Language
  if (SUPPORTED_LANGUAGES.some(lang => lang.code === browserLang)) {
    return browserLang
  }

  // Check if browser language is Hindi or Punjabi
  const fullBrowserLang = navigator.language.toLowerCase()
  if (fullBrowserLang.includes('hi') || fullBrowserLang.includes('hindi')) {
    return 'hi'
  }
  if (fullBrowserLang.includes('pa') || fullBrowserLang.includes('punjabi')) {
    return 'pa'
  }

  return DEFAULT_LANGUAGE
}

// RTL language detection
export function isRTL(language: Language): boolean {
  return language === 'pa' // Punjabi is RTL
}

// Number formatting for different languages
export function formatNumber(number: number, language: Language): string {
  return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'hi-IN').format(number)
}

// Date formatting for different languages
export function formatDate(date: Date, language: Language): string {
  const locale = language === 'en' ? 'en-US' : 'hi-IN'
  return new Intl.DateTimeFormat(locale).format(date)
}
