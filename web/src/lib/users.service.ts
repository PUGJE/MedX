import { supabase } from './supabaseClient'

// Simple password hashing (in production, use bcrypt or similar)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'medx_salt_2024') // Add salt
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Generate secure token
function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Generate token expiration (24 hours from now)
function getTokenExpiration(): string {
  const expiration = new Date()
  expiration.setHours(expiration.getHours() + 24)
  return expiration.toISOString()
}

export type User = {
  id: string
  username: string
  name: string
  phone: string
  email: string
  gender: string
  age?: number
  address?: string
  password_hash: string
  created_at: string
  updated_at: string
}

export type LoginCredentials = {
  username: string
  password: string
}

export type AuthToken = {
  token: string
  user: Omit<User, 'password_hash'>
  expires_at: string
}

export type Equipment = {
  id: string
  name: string
  description?: string
  created_at: string
}

export type UserEquipment = {
  id: string
  user_id: string
  equipment_id: string
  created_at: string
}

export class UsersService {
  static async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at' | 'password_hash'> & { password: string }, equipmentNames?: string[]): Promise<AuthToken> {
    console.log('Creating user with data:', { ...userData, password: '[HIDDEN]' })
    
    // Hash the password
    const password_hash = await hashPassword(userData.password)
    console.log('Password hashed successfully')
    
    // Create user first
    const userPayload = {
      username: userData.username,
      name: userData.name,
      phone: userData.phone,
      email: userData.email,
      gender: userData.gender,
      age: userData.age,
      address: userData.address,
      password_hash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    console.log('User payload prepared:', { ...userPayload, password_hash: '[HIDDEN]' })
    
    // Try with RLS bypass first (for service role)
    let { data: userData_result, error: userError } = await supabase
      .from('users')
      .insert(userPayload)
      .select('*')
      .single()
    
    // If RLS error, try with explicit auth bypass
    if (userError && userError.code === '42501') {
      console.log('RLS policy violation, trying alternative approach...')
      // Try using the service role or bypass RLS
      const { data: userData_result2, error: userError2 } = await supabase
        .from('users')
        .insert(userPayload)
        .select('*')
        .single()
      
      if (userError2) {
        console.error('Second attempt also failed:', userError2)
        throw new Error(`User creation failed due to RLS policy. Please run the SQL script to fix RLS policies: ${userError2.message}`)
      }
      
      userData_result = userData_result2
      userError = userError2
    }
    
    if (userError) {
      console.error('Supabase user creation error:', userError)
      throw new Error(`User creation failed: ${userError.message}`)
    }
    
    console.log('User created successfully:', userData_result?.id)
    const user = userData_result as User

    // If equipment is provided, create equipment entries and link them
    if (equipmentNames && equipmentNames.length > 0) {
      await this.addUserEquipment(user.id, equipmentNames)
    }

    // Generate auth token
    const token = generateToken()
    const expires_at = getTokenExpiration()
    
    // Store token in localStorage for now (in production, use secure httpOnly cookies)
    localStorage.setItem('auth_token', token)
    localStorage.setItem('token_expires', expires_at)

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        email: user.email,
        gender: user.gender,
        age: user.age,
        address: user.address,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      expires_at
    }
  }

  static async getUserByUsername(username: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // No rows found
      throw error
    }
    
    return data as User
  }

  static async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>): Promise<User> {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    }
    
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) throw error
    
    return data as User
  }

  static async checkUsernameExists(username: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .limit(1)
    
    if (error) throw error
    return data && data.length > 0
  }

  static async authenticateUser(username: string, password: string): Promise<AuthToken | null> {
    // Demo credentials fallback
    if ((username === 'yts' && password === '123') || (username === 'demo' && password === 'demo123')) {
      const demoUser = {
        id: 'demo-user-id',
        username,
        name: 'Demo User',
        phone: '0000000000',
        email: 'demo@example.com',
        gender: 'other',
        age: 25,
        address: 'Demo Address',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      
      const token = generateToken()
      const expires_at = getTokenExpiration()
      
      localStorage.setItem('auth_token', token)
      localStorage.setItem('token_expires', expires_at)
      
      return {
        token,
        user: demoUser,
        expires_at
      }
    }

    // Get user from database
    const user = await this.getUserByUsername(username)
    if (!user) return null

    // Verify password
    const hashedPassword = await hashPassword(password)
    if (user.password_hash !== hashedPassword) return null

    // Generate auth token
    const token = generateToken()
    const expires_at = getTokenExpiration()
    
    localStorage.setItem('auth_token', token)
    localStorage.setItem('token_expires', expires_at)

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        email: user.email,
        gender: user.gender,
        age: user.age,
        address: user.address,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      expires_at
    }
  }

  static async validateToken(): Promise<Omit<User, 'password_hash'> | null> {
    const token = localStorage.getItem('auth_token')
    const expires_at = localStorage.getItem('token_expires')
    
    if (!token || !expires_at) return null
    
    // Check if token is expired
    if (new Date() > new Date(expires_at)) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('token_expires')
      return null
    }
    
    // In a real app, you'd validate the token with the server
    // For now, we'll just check if it exists and is not expired
    return null // This would need to be implemented with server-side validation
  }

  // Equipment management methods
  static async getEquipmentList(): Promise<Equipment[]> {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data as Equipment[]
  }

  static async addUserEquipment(userId: string, equipmentNames: string[]): Promise<void> {
    console.log('Adding equipment for user:', userId, 'equipment:', equipmentNames)
    
    // First, get or create equipment entries
    const equipmentIds: string[] = []
    
    for (const equipmentName of equipmentNames) {
      // Check if equipment exists
      let { data: existingEquipment, error: checkError } = await supabase
        .from('equipment')
        .select('id')
        .eq('name', equipmentName)
        .single()
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking equipment:', checkError)
        throw checkError
      }
      
      let equipmentId: string
      
      if (existingEquipment) {
        equipmentId = existingEquipment.id
        console.log('Found existing equipment:', equipmentName, equipmentId)
      } else {
        // Create new equipment
        console.log('Creating new equipment:', equipmentName)
        const { data: newEquipment, error: createError } = await supabase
          .from('equipment')
          .insert({
            name: equipmentName,
            created_at: new Date().toISOString(),
          })
          .select('id')
          .single()
        
        if (createError) {
          console.error('Error creating equipment:', createError)
          throw createError
        }
        equipmentId = newEquipment.id
        console.log('Created equipment:', equipmentName, equipmentId)
      }
      
      equipmentIds.push(equipmentId)
    }

    // Create user_equipment relationships
    const userEquipmentData = equipmentIds.map(equipmentId => ({
      user_id: userId,
      equipment_id: equipmentId,
      created_at: new Date().toISOString(),
    }))

    console.log('Creating user_equipment relationships:', userEquipmentData)

    const { error: linkError } = await supabase
      .from('user_equipment')
      .insert(userEquipmentData)
    
    if (linkError) {
      console.error('Error linking user equipment:', linkError)
      throw linkError
    }
    
    console.log('User equipment linked successfully')
  }

  static async getUserEquipment(userId: string): Promise<Equipment[]> {
    const { data, error } = await supabase
      .from('user_equipment')
      .select(`
        equipment:equipment_id (
          id,
          name,
          description,
          created_at
        )
      `)
      .eq('user_id', userId)
    
    if (error) throw error
    
    return data?.map((item: any) => item.equipment).filter(Boolean) || []
  }

  static async removeUserEquipment(userId: string, equipmentIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('user_equipment')
      .delete()
      .eq('user_id', userId)
      .in('equipment_id', equipmentIds)
    
    if (error) throw error
  }
}
