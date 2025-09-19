import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { UsersService, type User, type AuthToken } from '../lib/users.service'

type AuthContextValue = {
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  register: (payload: { username: string; email: string; password: string; name: string; phone: string; gender: string; age?: number; address?: string; equipment?: string[] }) => Promise<boolean>
  getUserEquipment: () => Promise<any[]>
  updateProfile: (updates: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>) => Promise<boolean>
  user?: User
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function getInitialUser(): User | undefined {
  try {
    const token = localStorage.getItem('auth_token')
    const expires_at = localStorage.getItem('token_expires')
    if (token && expires_at && new Date() < new Date(expires_at)) {
      const raw = localStorage.getItem('auth_user')
      if (raw) return JSON.parse(raw)
    }
    // Clear if invalid/expired
    localStorage.removeItem('auth_token')
    localStorage.removeItem('token_expires')
    localStorage.removeItem('auth_user')
    return undefined
  } catch {
    return undefined
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthContextValue['user']>(getInitialUser())

  // Persist whenever it changes
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('auth_user', JSON.stringify(user))
      } else {
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_token')
        localStorage.removeItem('token_expires')
      }
    } catch {}
  }, [user])

  const value = useMemo<AuthContextValue>(() => ({
    isAuthenticated: Boolean(user),
    user,
    login: async (username: string, password: string) => {
      try {
        const authResult = await UsersService.authenticateUser(username, password)
        if (authResult) {
          // Persist token and user
          localStorage.setItem('auth_token', authResult.token)
          localStorage.setItem('token_expires', authResult.expires_at)
          localStorage.setItem('auth_user', JSON.stringify(authResult.user))
          setUser(authResult.user)
          return true
        }
        return false
      } catch (error) {
        console.error('Login error:', error)
        return false
      }
    },
    logout: () => {
      // Clear all auth data
      localStorage.removeItem('auth_token')
      localStorage.removeItem('token_expires')
      localStorage.removeItem('auth_user')
      setUser(undefined)
    },
    register: async (payload) => {
      try {
        console.log('Starting registration for:', payload.username)
        
        // Check if username already exists
        console.log('Checking if username exists...')
        const exists = await UsersService.checkUsernameExists(payload.username)
        if (exists) {
          console.log('Username already exists:', payload.username)
          throw new Error('Username already exists')
        }
        console.log('Username is available')
        
        console.log('Creating user...')
        const authResult = await UsersService.createUser({
          username: payload.username,
          password: payload.password,
          name: payload.name,
          phone: payload.phone,
          email: payload.email,
          gender: payload.gender,
          age: payload.age,
          address: payload.address,
        }, payload.equipment)
        
        console.log('User created successfully, setting user state')
        setUser(authResult.user)
        return true
      } catch (error) {
        console.error('Registration error details:', error)
        console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
        throw error
      }
    },
    updateProfile: async (updates) => {
      if (!user) return false
      try {
        const updatedUser = await UsersService.updateUser(user.id, updates)
        setUser(updatedUser)
        return true
      } catch (error) {
        console.error('Profile update error:', error)
        return false
      }
    },
    getUserEquipment: async () => {
      if (!user) return []
      try {
        return await UsersService.getUserEquipment(user.id)
      } catch (error) {
        console.error('Get user equipment error:', error)
        return []
      }
    },
  }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}


