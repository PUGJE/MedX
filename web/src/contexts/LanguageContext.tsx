import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { detectLanguage, isRTL } from '../lib/i18n'
import { getTranslation, getNestedTranslation } from '../lib/translations'
import type { Language, TranslationKeys } from '../lib/types'

type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string) => string
  isRTL: boolean
  availableLanguages: Array<{ code: Language; name: string; nativeName: string; flag: string }>
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectLanguage())

  // Load language from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('app_language') as Language
    if (stored && ['en', 'hi', 'pa'].includes(stored)) {
      setLanguageState(stored)
    }
  }, [])

  // Save language to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('app_language', language)
    // Set document language attribute
    document.documentElement.lang = language
  }, [language])

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage)
  }

  const translation = useMemo(() => getTranslation(language), [language])
  const rtl = useMemo(() => isRTL(language), [language])

  const t = (key: string): string => {
    return getNestedTranslation(translation, key)
  }

  const availableLanguages = [
    { code: 'en' as Language, name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'hi' as Language, name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
    { code: 'pa' as Language, name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  ]

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    t,
    isRTL: rtl,
    availableLanguages,
  }), [language, rtl])

  return (
    <LanguageContext.Provider value={value}>
      <div dir={rtl ? 'rtl' : 'ltr'} className={rtl ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Hook for easy translation access
export function useTranslation() {
  const { t } = useLanguage()
  return { t }
}
