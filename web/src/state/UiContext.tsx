import { createContext, useContext, useMemo, useState, useEffect } from 'react'

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

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored === 'light' || stored === 'dark') return stored
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  } catch {
    return 'light'
  }
}

export function UiProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('English')
  const [locationText, setLocationText] = useState('Detecting location...')
  const [patient, setPatient] = useState<Patient>({ name: 'Demo Patient', village: 'Village X', patientId: 'PID-001' })
  const [theme, setTheme] = useState<Theme>(getInitialTheme())
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  // Persist theme changes
  useEffect(() => {
    try { localStorage.setItem('theme', theme) } catch {}
  }, [theme])

  // Automatic location detection
  useEffect(() => {
    const detectLocation = async () => {
      if (!navigator.geolocation) {
        setLocationText('Location not available')
        return
      }

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          })
        })

        const { latitude, longitude } = position.coords
        
        // Use reverse geocoding to get location name
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          )
          const data = await response.json()
          
          if (data.city && data.principalSubdivision) {
            setLocationText(`${data.city}, ${data.principalSubdivision}`)
          } else if (data.locality) {
            setLocationText(data.locality)
          } else {
            setLocationText(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
          }
        } catch (geocodeError) {
          // Fallback to coordinates if geocoding fails
          setLocationText(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        }
      } catch (error) {
        console.error('Location detection failed:', error)
        setLocationText('Location not available')
      }
    }

    detectLocation()
  }, [])

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


