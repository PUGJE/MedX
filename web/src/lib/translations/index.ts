// Translation files index
import { en } from './en'
import { hi } from './hi'
import { pa } from './pa'
import type { Language, TranslationKeys } from '../types'

export const translations = {
  en,
  hi,
  pa,
} as const

export function getTranslation(language: Language): TranslationKeys {
  return translations[language] || translations.en
}

// Helper function to get nested translation values
export function getNestedTranslation(
  translation: TranslationKeys,
  key: string
): string {
  const keys = key.split('.')
  let value: any = translation
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      return key // Return the key if translation not found
    }
  }
  
  return typeof value === 'string' ? value : key
}
