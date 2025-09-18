import { createContext, useContext, useMemo, useState } from 'react'

type AuthContextValue = {
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  user?: { username: string }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ username: string } | undefined>(undefined)

  const value = useMemo<AuthContextValue>(() => ({
    isAuthenticated: true, // Temporarily bypass authentication for debugging
    user: { username: 'debug' },
    login: async (username: string, password: string) => {
      await new Promise((r) => setTimeout(r, 300))
      if (username === 'yts' && password === '123') {
        setUser({ username })
        return true
      }
      return false
    },
    logout: () => setUser(undefined),
  }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}


