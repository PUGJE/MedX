import { useEffect } from 'react'
import { useUi } from '../state/UiContext'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useUi()

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  return <>{children}</>
}
