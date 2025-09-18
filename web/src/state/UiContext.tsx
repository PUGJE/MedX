import { createContext, useContext, useMemo, useState } from 'react'

type Language = 'English' | 'Hindi' | 'Punjabi'
type Theme = 'light' | 'dark'

type UiContextValue = {
  language: Language
  setLanguage: (lang: Language) => void
  locationText: string
  setLocationText: (v: string) => void
  patient: Patient
  setPatient: (p: Patient) => void
  theme: Theme
  setTheme: (theme: Theme) => void
  isSidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export type Patient = {
  name: string
  age?: number
  contact?: string
  village?: string
  patientId?: string
}

const UiContext = createContext<UiContextValue | undefined>(undefined)

export function UiProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('English')
  const [locationText, setLocationText] = useState('Nabha, Punjab')
  const [patient, setPatient] = useState<Patient>({ name: 'Demo Patient', village: 'Village X', patientId: 'PID-001' })
  const [theme, setTheme] = useState<Theme>('dark')
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  const value = useMemo(() => ({ 
    language, 
    setLanguage, 
    locationText, 
    setLocationText, 
    patient, 
    setPatient,
    theme,
    setTheme,
    isSidebarOpen,
    setSidebarOpen
  }), [language, locationText, patient, theme, isSidebarOpen])
  
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>
}

export function useUi() {
  const ctx = useContext(UiContext)
  if (!ctx) throw new Error('useUi must be used within UiProvider')
  return ctx
}


